import os
import sys
import subprocess

print("=" * 50)
print("运行Django数据库迁移")
print("=" * 50)

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'health_platform.settings')

import django
django.setup()

print("\n[1/3] 运行 makemigrations...")
result = subprocess.run([sys.executable, 'manage.py', 'makemigrations', 'users', 'devices', 'health_data', 'reports', 'goals'])
if result.returncode != 0:
    print(f"makemigrations 失败: {result.returncode}")

print("\n[2/3] 运行 migrate...")
result = subprocess.run([sys.executable, 'manage.py', 'migrate'])
if result.returncode != 0:
    print(f"migrate 失败: {result.returncode}")

print("\n[3/3] 检查数据库表...")
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"数据库表数量: {len(tables)}")
    print(f"表名: {tables}")

print("\n" + "=" * 50)
print("迁移完成！")
print("=" * 50)
