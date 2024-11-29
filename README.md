## 진행 상황
- hdfs로 파일 올림(성민님 코드 합치기 완료)
- hdfs에 올린 파일을 들고와서 입력한 query문으로 spark sql을 실행함
- 데이터를 api로 개방
- 같은 이름 파일 저장되는 것 처리 -> 현재시간 + random number을 통해 unique한 id를 만들어줘 파일 이름 + id로 저장되게 해줌
- 매일 자정 파일 자동 삭제 - 크론탭 이용(리눅스에서 특정 시간에 자동으로 실행할 수 있도록 하는 도구)
- 결과 csv파일 저장
- 파일 여러개 올리기 가능 -> join 연산 가능

## 실행 관련 확인사항
- /user/maria_dev/term_project 파일에 파일명+id로 저장이 됨
  <br>매일 자정마다 저장된 파일이 자동 삭제됨
![image](https://github.com/user-attachments/assets/8dac28a3-114d-41f7-9356-22b0f5376d3d)
- crontab 실행 방법
```bash
#term_project에 대한 접근 권한 설정해줌
hdfs dfs -chmod -R 777 /user/maria_dev/term_project
crontab -e
# 입력해서 넣어줌 (예시)
0 0 * * * ~/miniconda3/envs/bdp2024/bin/python3 /home/maria_dev/delete_old_files.py >> /home/maria_dev/cron.log 2>&1
# python3의 절대경로를 넣어줘야하는데 which python3를 하여 자신의 절대 경로를 확인해준 후
# 아래와 같이 설정 >>
0 0 * * * 자신의_python3절대경로 /home/maria_dev/delete_old_files.py >> /home/maria_dev/cron.log 2>&1
#자동으로 delete_old_files에 접근해서 실행해야하므로 해당 파일에 대한 접근 권한 설정
chmod +x /home/maria_dev/delete_old_files.py

#만약 실행이 안된다면 설치 후 크론탭 제대로 실행되고 있는지 확인 >>sudo yum install cronie
```

## 실행 방법
- localhost:5000/upload에 파일 넣고 upload 버튼 누름
![image](https://github.com/user-attachments/assets/86fb259a-83eb-4770-aa10-327b794e0b23)
- 자동으로 localhost:5000/query로 이동함
- 이동 후 sql query문을 입력하고 실행 버튼을 누르면 실행 결과 테이블 + 다운로드 할 수 있는 버튼이 나옴
![image](https://github.com/user-attachments/assets/e3b8b4a8-dab5-42ca-b20c-7625bcd4df4f)
- 다운로드 버튼 누르면 csv 파일 다운
![image](https://github.com/user-attachments/assets/d0959b4e-491a-4935-80f4-9911fcba9dcd)


## 실행단계에서 오류가 발생하는 경우 확인해봐야할 것
pyspark가 install되어 있어야함 
<br>-> 환경 생성할 때 pyspark도 같이 install을 해주지 않았다면 추가로 pip install pyspark를 해줘 pyspark.sql을 사용할 수 있도록 해야함
- 버전 호환의 문제
<br>Flask와 Werkzeug 패키지의 버전이 서로 호환되지 않아 발생하는 문제가 발생할 수 있음
<br>-> pip install --upgrade Flask Werkzeug 을 해주면 정상적으로 실행이 됨

<br>((이것 이외로 인해 발생한 에러는 아직까지 없었습니다!))
