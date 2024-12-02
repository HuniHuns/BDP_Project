## 진행 상황
- ec2에 환경 설정함. -> port foward, web server 구축 등.
- public ip => `3.83.214.76`, 아직 서버 안켜서 `404` 뜨는게 정상. 아직 안킨 이유는 아래 spark error때문에 안킴
- hdfs로 파일 올림(connection abort error 해결)
```python
df = spark.read.option("header", "true") \
            .option("inferSchema", "true") \
            .csv(hdfs_file_path)
```킴
- 위 부분에서 no live node error 발생 -> 해결중


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
![image](https://github.com/user-attachments/assets/ece8af14-5535-4c98-b035-b3000d9c566a)
- 이동 후 sql query문을 ui 조작을 통해 만들어냄
  <br>
  from 테이블 선택 시 select 할 수 있는 컬럼 나옴 -> 아무것도 클릭 안하면 * 로 간주함
![image](https://github.com/user-attachments/assets/2a55eccd-e630-4683-a2bc-afaf7881373a)
  <br>
  join할 테이블 선택 시 초기 -> inner join으로 선택됨
![image](https://github.com/user-attachments/assets/7446d2cf-9a91-44bc-972e-f6b2f2f9a5ce)
  <br>
  outer join 등으로 바꾸면 그에 해당하는 세션이 열림
![image](https://github.com/user-attachments/assets/f952e372-70c5-4c51-9844-ce107619eadb)

- 쿼리 생성 버튼을 누르면 다운로드 버튼이 나옴
![image](https://github.com/user-attachments/assets/f35baa87-b702-478e-a263-daef67864562)

- 다운로드 버튼 누르면 csv 파일 다운
![image](https://github.com/user-attachments/assets/d0959b4e-491a-4935-80f4-9911fcba9dcd)

## 에러 관련 경고창
- /upload -> hdfs csv 파일 올리는데 문제 발생하거나 파일을 선택하지 않으면 경고창 뜸
- /query -> query문 잘못 만들었을 때

## 실행단계에서 오류가 발생하는 경우 확인해봐야할 것
pyspark가 install되어 있어야함 
<br>-> 환경 생성할 때 pyspark도 같이 install을 해주지 않았다면 추가로 pip install pyspark를 해줘 pyspark.sql을 사용할 수 있도록 해야함
- 버전 호환의 문제
<br>Flask와 Werkzeug 패키지의 버전이 서로 호환되지 않아 발생하는 문제가 발생할 수 있음
<br>-> pip install --upgrade Flask Werkzeug 을 해주면 정상적으로 실행이 됨

<br>((이것 이외로 인해 발생한 에러는 아직까지 없었습니다!))
