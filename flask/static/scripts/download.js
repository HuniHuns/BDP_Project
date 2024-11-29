document.getElementById('download-btn')?.addEventListener('click', function () {
    event.preventDefault();
    const filePath = this.getAttribute('data-file-path');
    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ file_path: filePath })
    })
        .then(response => {
            if (!response.ok) {
                alert('Failed to download query result!');
                return;
            }
            return response.blob();
        })
        .then(blob => {
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'query_result.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
        })
        .catch(error => {
            console.error('Error downloading query result:', error);
            alert('An error occurred while downloading the query result.');
        });
});
