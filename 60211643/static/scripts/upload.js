const fileInput = document.getElementById('fileInput');
const uploadName = document.querySelector('.upload-name');

fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    if (files.length > 0) {
        const fileNameList = Array.from(files).map(file => file.name).join(', ');
        uploadName.value = fileNameList;
    } else {
        uploadName.value = '첨부파일';
    }
});

document.getElementById("uploadForm").onsubmit = function (event) {
    event.preventDefault();  // 폼 기본 제출 방지

    let formData = new FormData(this);  // 폼 데이터 생성

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                // 서버에서 오류가 반환된 경우 alert로 표시
                alert("업로드의 문제가 있습니다. 다시 시도해주세요" + data.error);
            } else {
                // 성공 시 페이지 이동만 함
                window.location.href = '/query';  // 업로드 후 페이지 이동
            }
        })
        .catch(error => {
            // 네트워크 오류 등 예외 처리
            alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
        });
};
