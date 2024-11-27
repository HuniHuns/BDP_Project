from flask import Flask, request, jsonify, render_template, redirect, url_for
from pyspark.sql import SparkSession
import reques
from urllib.parse import quote as url_quote

app = Flask(__name__)

spark = SparkSession.builder \
        .appName("FlaskSparkSQLApp") \
        .config("spark.sql.catalogImplementation", "hive") \
        .getOrCreate()

HDFS_HOST = "http://127.0.0.1:50070"
HDFS_USER = "maria_dev"
HDFS_UPLOAD_DIR = f"/user/{HDFS_USER}/term_project"

@app.route('/upload', methods=['GET', 'POST'])
def upload_to_hdfs():
    if request.method == 'GET':
        return render_template('upload.html')
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    hdfs_path = f"{HDFS_UPLOAD_DIR}/{file.filename}"
    try:
        create_url = f"{HDFS_HOST}/webhdfs/v1{hdfs_path}?op=CREATE&overwrite=true&user.name=maria_dev"
        response = requests.put(create_url, allow_redirects=False)
        if response.status_code != 307:
            return jsonify({"error": "Failed to initiate file creation"}), response.status_code
        redirect_url = response.headers['Location'].replace('sandbox-hdp.hortonworks.com', '127.0.0.1')
        redirect_url = redirect_url.replace('overwrite=false', 'overwrite=true')

        with file.stream as f:
            response = requests.put(redirect_url, data=f)
            if response.status_code != 201:
                return jsonify({"error": "Failed to upload file to HDFS"}), response.status_code
        table_name = file.filename.split('.')[0]
        try:
            spark.read.csv(f"hdfs://127.0.0.1:8020/user/maria_dev/term_project/{file.filename}", header=True, inferSchema=True).createOrReplaceTempView(file.filename.split('.')[0])
        except Exception as e:
            return jsonify({"error": f"Spark view creation failed: {str(e)}"}), 500

        return redirect(url_for('query_page', table_name=table_name))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/query', methods=['GET','POST'])
def query_page():
    table_name = request.args.get('table_name', '')
    if request.method == 'GET':
        return render_template('query.html', table_name=table_name)

    sql_query = request.form.get('query')
    if not sql_query:
        return jsonify({"error": "No query provided"}), 400
    try:
        result_df = spark.sql(sql_query)
        result = result_df.toPandas().to_dict(orient='records')
    except Exception as e:
        return jsonify({"error": str(e)}), 500
