from pyspark import SparkConf, SparkContext
from datetime import datetime, timedelta
import subprocess

HDFS_DIR = "/user/maria_dev/term_project"
RETENTION_DAYS = 0

def delete_old_files():
    try:
        result = subprocess.run(["hdfs", "dfs", "-ls", "-R", HDFS_DIR], capture_output=True, text=True)

        if result.returncode != 0:
            print("Error fetching HDFS file list")
            return;
        cutoff_time = datetime.now() - timedelta(days=RETENTION_DAYS)

        for line in result.stdout.splitlines():
            parts = line.split()
            if len(parts) < 8:
                continue
            file_date = parts[5]
            file_time = parts[6]
            file_path = parts[7]
            full_datetime = f"{file_date} {file_time}"
            try:
                file_datetime = datetime.strptime(full_datetime, "%Y-%m-%d %H:%M")
                print(f"File: {file_path}, Created on: {file_datetime}")
            except ValueError as e:
                print(f"Error parsing datetime for {file_path}: {e}")
                continue
            if isinstance(file_datetime, datetime) and file_datetime < cutoff_time:
                print(f"Attempting to delete file: {file_path}")
                delete_result = subprocess.run(["hdfs", "dfs", "-rm", file_path], capture_output=True, text=True)
                if delete_result.returncode == 0:
                    print(f"Successfully deleted: {file_path}")
                else:
                    print(f"Failed to delete: {file_path}, Error: {delete_result.stderr}")
            else:
                print(f"File {file_path} is newer than {cutoff_time}, skipping deletion.")
    except Exception as e:
        print(f"Error during cleanup: {e}")

if __name__ == "__main__":
    conf = SparkConf().setAppName("HDFS File Cleanup")
    sc = SparkContext(conf=conf)
    delete_old_files()
    sc.stop()
