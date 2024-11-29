from flask import Flask, request, jsonify, render_template, redirect, url_for, Response, send_file
from pyspark.sql import SparkSession
import requests
from urllib.parse import quote as url_quote
import time, random, io, os

app = Flask(__name__)
app.secret_key = 'BDP_project'


spark = SparkSession.builder \
        .appName("FlaskSparkSQLApp") \
        .config("spark.sql.catalogImplementation", "hive") \
        .getOrCreate()

HDFS_HOST = "http://127.0.0.1:50070"
HDFS_USER = "maria_dev"
HDFS_UPLOAD_DIR = f"/user/{HDFS_USER}/term_project"

tables = {}

QUERY_RESULT_DIR = "./query_results"
if not os.path.exists(QUERY_RESULT_DIR):
    os.makedirs(QUERY_RESULT_DIR)

@app.route('/upload', methods=['GET', 'POST'])
def upload_to_hdfs():
    global tables;
    if request.method == 'GET':
        return render_template('upload.html', tables = tables.keys())
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    files = request.files.getlist('file')
    if not files or all(file.filename == '' for file in files):
        return jsonify({"error": "No selected file"}), 400

    for file in files:
        if file.filename == '':
            continue

        unique_id = f"{int(time.time())}_{random.randint(1000, 9999)}"
        unique_filename = f"{file.filename.split('.')[0]}_{unique_id}.csv"
        hdfs_path = f"{HDFS_UPLOAD_DIR}/{unique_filename}"
        try:
            create_url = f"{HDFS_HOST}/webhdfs/v1{hdfs_path}?op=CREATE&user.name=maria_dev"
            response = requests.put(create_url, allow_redirects=False)
            if response.status_code != 307:
                return jsonify({"error": "Failed to initiate file creation"}), response.status_code
            redirect_url = response.headers['Location'].replace('sandbox-hdp.hortonworks.com', '127.0.0.1')
            redirect_url = redirect_url.replace('overwrite=false', 'overwrite=true')

            with file.stream as f:
                response = requests.put(redirect_url, data=f)
                if response.status_code != 201:
                    return jsonify({"error": "Failed to upload file to HDFS"}), response.status_code
            table_name = f"{file.filename.split('.')[0]}_{unique_id}"
            try:
                spark.read.csv(f"hdfs://127.0.0.1:8020/user/maria_dev/term_project/{unique_filename}", header=True, inferSchema=True).createOrReplaceTempView(file.filename.split('.')[0])
                if file.filename.split('.')[0] not in tables:
                    tables[file.filename.split('.')[0]] = []
                tables[file.filename.split('.')[0]].append(table_name)
            except Exception as e:
                return jsonify({"error": f"Spark view creation failed: {str(e)}"}), 500

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return redirect(url_for('query_page'))


@app.route('/query', methods=['GET','POST'])
def query_page():
    table_name = request.args.get('table_name', '')
    query_result = None
    query_file_path = None
    download_available = False

    if request.method == 'GET':
        return render_template('query.html',tables = tables.keys(), query_result = query_result, download_available=False)

    sql_query = request.form.get('query')
    if not sql_query:
        query_result = {"error": "No query provided"}
        return render_template('query.html', tables=tables.keys(), query_result=query_result, download_available=False)
    try:
        result_df = spark.sql(sql_query)
        result = result_df.toPandas()
        unique_id = f"{int(time.time())}_{random.randint(1000, 9999)}"
        query_file_path = os.path.join(QUERY_RESULT_DIR, f"query_result_{unique_id}.csv")
        result.to_csv(query_file_path, index=False)
        return render_template('query.html', tables=tables.keys(), query_result=result.to_dict(orient='records'), download_available=True, download_path=query_file_path)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/get_common_columns')
def get_common_columns():
    table1 = request.args.get('table1')
    table2 = request.args.get('table2')
    if not table1 or not table2:
        return jsonify({"error": "Both tables must be provided"}), 400

    try:
        columns1 = {col['col_name'] for col in spark.sql(f"DESCRIBE {table1}").collect()}
        columns2 = {col['col_name'] for col in spark.sql(f"DESCRIBE {table2}").collect()}
        common_columns = list(columns1 & columns2)
        return jsonify({"common_columns": common_columns})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/download', methods=['POST'])
def download_query_result():
    query_file_path = request.form.get('file_path')
    if not query_file_path or not os.path.exists(query_file_path):
        return jsonify({"error": "No query result available for download"}), 400
    try:
        return send_file(query_file_path,mimetype="text/csv",as_attachment=True,download_name="query_result.csv")
    except Exception as e:
        return jsonify({"error": "Error during file download"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

