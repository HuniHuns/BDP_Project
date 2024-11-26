from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__)

# WebHDFS 설정
HDFS_HOST = "http://127.0.0.1:50070"  # HDFS NameNode 주소
HDFS_USER = "maria_dev"  # HDFS 사용자 이름
HDFS_UPLOAD_DIR = f"/user/{HDFS_USER}/term_project"  # 파일 업로드 경로

# upload로 get 요청 시 페이지 렌더링
@app.route('/upload')
def index():
    return render_template('upload.html')

# upload로 post 요청 시 작동
@app.route('/upload', methods=['POST'])
def upload_to_hdfs():
    # 예외 처리
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400


    # HDFS 파일 경로 설정
    hdfs_path = f"{HDFS_UPLOAD_DIR}/{file.filename}"

    try:
        # Create API 요청
        create_url = f"{HDFS_HOST}/webhdfs/v1{hdfs_path}?op=CREATE&user.name={HDFS_USER}"
        response = requests.put(create_url, allow_redirects=False)
        if response.status_code != 307:
            return jsonify({"error": "Failed to initiate file creation"}), response.status_code

        # 파일 업로드
        redirect_url = response.headers['Location']
        redirect_url = redirect_url.replace('sandbox-hdp.hortonworks.com', '127.0.0.1')
        redirect_url = redirect_url.replace('overwrite=false', 'overwrite=true')
        print(redirect_url)

        with file.stream as f:
            response = requests.put(redirect_url, data=f)
            if response.status_code != 201:
                return jsonify({"error": "Failed to upload file to HDFS"}), response.status_code

        return jsonify({"message": f"File uploaded to HDFS at {hdfs_path}"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) # 안쓰는 포트로 사용해주세요