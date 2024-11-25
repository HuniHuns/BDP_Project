python은 3.8.20 사용했고, 라이브러리는 env.yaml로 공유해드립니다.

port 10000이 HiveServer2의 default port라고 합니다.

putty에서 Connection-SSH-Auth-Tunnels에서 127.0.0.1:10000으로 포트포워딩 설정해줬습니다.

서버 시작해주고
http://localhost:5000/query?query=SELECT%20*%20FROM%20drivers
로 접속해서 SELECT * FROM drivers로 쿼리 테스트합니다.
