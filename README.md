서버 실행하시고 http://localhost:5000/upload로 접속하시면 csv 파일 업로드할 수 있는 화면이 나옵니다.
50070 포트와 50075 포트를 포워딩하시고 사용하셔야됩니다.

아무 csv 파일이나 드래그 앤 드랍이나 클릭을 통해 넣어주시면 작동되도록 만들었습니다.
경로는 /user/maria_dev/term_project 폴더에 들어가도록 설정을 해놨습니다.
createparent=true 옵션을 줘서 term_project라는 폴더가 없어도 자동으로 생성하고 csv 파일을 넣을 수 있도록 만들었습니다.
overwrite=true 옵션을 줘서 기존에 같은 이름의 파일이 있으면 덮어쓰도록 만들었습니다.
