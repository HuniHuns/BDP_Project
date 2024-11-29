from flask import Flask, request, jsonify, render_template
from pyspark.sql import SparkSession
import requests


app = Flask(__name__)

#spark 세션 생성 - Hive 지원 활성화
spark = SparkSession.builder \
    .appName("CsvToHiveTable") \
    .enableHiveSupport() \
    .getOrCreate()

#WebHDFS 설정
HDFS_HOST = "http://127.0.0.1:50070"  # HDFS NameNode 주소
HDFS_USER = "maria_dev"  # HDFS 사용자 이름
HDFS_UPLOAD_DIR = f"/user/{HDFS_USER}/term_project"  # 파일 업로드 경로

# upload로 get 요청 시 페이지 렌더링
@app.route('/upload')
def index():
    """업로드 페이지 렌더링"""
    return render_template('upload.html')

#upload로 post 요청 시 작동
@app.route('/upload', methods=['POST'])
def upload_to_hdfs():
    # 예외 처리
    if 'file' not in request.files:
        return jsonify({"error": "파일이 없습니다."}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "선택된 파일이 없습니다."}), 400

    # HDFS 파일 경로 설정
    hdfs_path = f"{HDFS_UPLOAD_DIR}/{file.filename}"

    try:
        # Create API 요청
        create_url = f"{HDFS_HOST}/webhdfs/v1{hdfs_path}?op=CREATE&user.name={HDFS_USER}"
        response = requests.put(create_url, allow_redirects=False)
        
        if response.status_code != 307:
            return jsonify({"error": "파일 생성 초기화 실패"}), response.status_code

        # 파일 업로드
        redirect_url = response.headers['Location']
        redirect_url = redirect_url.replace('sandbox-hdp.hortonworks.com', '127.0.0.1')
        redirect_url = redirect_url.replace('overwrite=false', 'overwrite=true')
        
        with file.stream as f:
            response = requests.put(redirect_url, data=f)
        
        
        if response.status_code != 201:
            return jsonify({"error": "HDFS에 파일 업로드 실패"}), response.status_code

        # Hive 테이블 이름 설정 (파일명에서 확장자 제거)
        table_name = file.filename.split('.')[0]
        hdfs_file_path = f"hdfs://127.0.0.1:8020/user/maria_dev/term_project/{file.filename}"

        # CSV 파일을 Spark DataFrame으로 읽기
        # header=True: 첫 번째 행을 컬럼명으로 사용
        # inferSchema=True: 데이터 타입을 자동으로 추론
        df = spark.read.csv(hdfs_file_path, header=True, inferSchema=True)
        
        # 중복 데이터 제거
        df = df.dropDuplicates()

        # 임시 뷰 생성 (선택 사항)
        df.createOrReplaceTempView(table_name)

        # Hive 테이블로 저장
        # mode("overwrite"): 동일한 이름의 테이블 존재 시 덮어쓰기
        df.write.mode("overwrite").saveAsTable(table_name)

        return jsonify({
            "message": f"파일 '{file.filename}'이 HDFS에 업로드되었고 '{table_name}' Hive 테이블이 성공적으로 생성되었습니다."
        }), 200

    except Exception as e:
        # 예외 발생 시 오류 메시지 반환
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)