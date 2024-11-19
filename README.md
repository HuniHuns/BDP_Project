flask로 hive 연동하는거 해보다가 막혀서 같이 생각해보고자 올립니다.

python은 3.8.20 사용했고, 라이브러리는 env.yaml로 공유해드립니다.

port 10000이 HiveServer2의 default port라고 하고요

맞는건진 모르겠지만
putty에서 Connection-SSH-Auth-Tunnels에서 127.0.0.1:10000으로 터널링 설정해줬습니다.

서버 시작해주고
http://localhost:5000/query?query=SELECT%20*%20FROM%20drivers
로 접속해서 SELECT * FROM drivers로 쿼리 테스트 했는데, 오류가 납니다.
{"error":"TSocket read 0 bytes"}

해당 테이블은 강의시간에 실습으로 만든 테이블이니, 실습 참여 안하셨으면 강의자료 참고하시면 될 것 같습니다.

쿼리 보내기도 전에 get_hive_connection()에서 오류가 발생하는걸로 확인됩니다. 