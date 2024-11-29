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