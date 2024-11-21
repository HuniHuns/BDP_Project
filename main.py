from flask import Flask, request, jsonify
from pyhive import hive

app = Flask(__name__)

# Hive 연결 설정 함수
def get_hive_connection():
    conn = hive.Connection(
        host="127.0.0.1",
        port=10000,
        username="hive", # maria_dev 사용자는 권한 이슈가 있어 일단 Super user인 hive로 설정 했습니다.
        database="default",
        auth='NONE' # 마찬가지로 Super user인 hive는 Auth 규칙이 없어서 NONE으로 바꿨습니다.
    )
    return conn

# API 엔드포인트: SQL 쿼리 실행
@app.route('/query', methods=['GET'])
def query_data():
    # 클라이언트에서 쿼리 수신
    sql_query = request.args.get('query')
    if not sql_query:
        return jsonify({'error': 'SQL query is missing'}), 400

    # Hive에서 쿼리 실행
    try:
        conn = get_hive_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query)

        # 결과 가져오기
        result = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]

        # JSON으로 변환
        result_list = [dict(zip(column_names, row)) for row in result]
        return jsonify(result_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 포트는 각 제 로컬에서는 9999가 사용중이지 않아 그냥 9999로 설정했습니다.
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9999)  # 모든 인터페이스에서 접근 가능
