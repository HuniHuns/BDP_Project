from flask import Flask, request, jsonify
from pyhive import hive

app = Flask(__name__)

# Hive 연결 설정 함수
def get_hive_connection():
    conn = hive.Connection(
        host="127.0.0.1",
        port=10000,
        username="maria_dev",        
        database="default",
        auth='NOSASL'
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)  # 모든 인터페이스에서 접근 가능
