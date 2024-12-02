from flask import Flask, request, jsonify, render_template, redirect, url_for, Response, send_file
from pyspark.sql import SparkSession
import requests
from urllib.parse import quote as url_quote
import time
import random
import io
import os

app = Flask(__name__)
app.secret_key = 'BDP_project'
# Spark 세션 생성
spark = SparkSession.builder \
    .appName("FlaskSparkSQLApp") \
    .getOrCreate()
# WebHDFS 설정
HDFS_HOST = "http://127.0.0.1:50070"  # HDFS NameNode 주소
HDFS_USER = "maria_dev"  # HDFS 사용자 이름
HDFS_UPLOAD_DIR = f"/user/{HDFS_USER}/term_project"  # 파일 업로드 경로

# Query 결과 디렉토리
QUERY_RESULT_DIR = "./query_results"
if not os.path.exists(QUERY_RESULT_DIR):
    os.makedirs(QUERY_RESULT_DIR)
# 테이블 관리
tables = {}
@app.route('/upload', methods=['GET', 'POST'])
def upload_to_hdfs():
    """파일 업로드 및 Hive 테이블 생성"""
    global tables
    if request.method == 'GET':
        return render_template('upload.html', tables=tables.keys(), error_message=None)

    if 'file' not in request.files:
        return render_template('upload.html', tables=tables.keys(), error_message="파일을 선택해주세요")

    file = request.files['file']
    if file.filename == '':
        return render_template('upload.html', tables=tables.keys(), error_message="선택된 파일이 없습니다")

    if not file.filename.lower().endswith('.csv'):
        return render_template('upload.html', tables=tables.keys(), error_message="CSV 파일만 업로드할 수 있습니다")

    # 고유 파일명 생성 및 경로 설정
    unique_id = f"{int(time.time())}_{random.randint(1000, 9999)}"
    unique_filename = f"{file.filename.split('.')[0]}_{unique_id}.csv"
    hdfs_path = f"{HDFS_UPLOAD_DIR}/{unique_filename}"

    try:
        create_url = f"{HDFS_HOST}/webhdfs/v1{hdfs_path}?op=CREATE&user.name={HDFS_USER}"
        response = requests.put(create_url, allow_redirects=False)
        if response.status_code != 307:
            return render_template('upload.html', tables=tables.keys(), error_message="파일 생성 초기화 실패")
        redirect_url = response.headers['Location']
        parts = redirect_url.split('sandbox-hdp.hortonworks.com', 1)
        redirect_url = '127.0.0.1'.join(parts)
        redirect_url = redirect_url.replace(
            'overwrite=false', 'overwrite=true')

        with file.stream as f:
            data = f.read()
        response = requests.put(redirect_url, data=data, headers={
                                "Content-Type": "application/octet-stream"})
        if response.status_code != 201:
            return render_template('upload.html', tables=tables.keys(), error_message="HDFS에 파일 업로드 실패")
        file_content = data.decode('utf-8')
        rdd = spark.sparkContext.parallelize(file_content.splitlines())
        df = spark.read.option("header", "true").csv(rdd)
        table_name = file.filename.split('.')[0]
        df = df.dropDuplicates()
        df.createOrReplaceTempView(table_name)
        if table_name not in tables:
            tables[table_name] = []
        tables[table_name].append(unique_filename)
        return redirect(url_for('query_page'))
    except Exception as e:
        return render_template('upload.html', tables=tables.keys(), error_message=f"오류 발생: {str(e)}")


@app.route('/query', methods=['GET', 'POST'])
def query_page():
    """SQL 쿼리 실행"""
    query_result = None
    query_file_path = None
    download_available = False
    error_message = None

    if request.method == 'GET':
        return render_template('query.html', tables=tables.keys(), query_result=query_result, download_available=False, error_message=error_message)

    sql_query = request.form.get('query')
    if not sql_query:
        return render_template('query.html', tables=tables.keys(), query_result={"error": "No query provided"}, download_available=False, error_message=error_message)

    try:
        result_df = spark.sql(sql_query)
        result = result_df.toPandas()
        unique_id = f"{int(time.time())}_{random.randint(1000, 9999)}"
        query_file_path = os.path.join(
            QUERY_RESULT_DIR, f"query_result_{unique_id}.csv")
        result.to_csv(query_file_path, index=False)

        return render_template('query.html', tables=tables.keys(), query_result=result.to_dict(orient='records'),
                               download_available=True, download_path=query_file_path, error_message=error_message)
    except Exception as e:
        return render_template('query.html', tables=tables.keys(), query_result=None, download_available=False, error_message=str(e))


@app.route('/download', methods=['POST'])
def download_query_result():
    """쿼리 결과 다운로드"""
    query_file_path = request.form.get('file_path')
    if not query_file_path or not os.path.exists(query_file_path):
        return jsonify({"error": "No query result available for download"}), 400
    try:
        return send_file(query_file_path, mimetype="text/csv", as_attachment=True, download_name="query_result.csv")
    except Exception as e:
        return jsonify({"error": f"Error during file download: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
