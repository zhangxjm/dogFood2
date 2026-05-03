import os
import sys
import subprocess

print("=" * 50)
print("启动Django后端服务")
print("=" * 50)

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("\n后端服务将在以下地址启动:")
print("  http://localhost:8000")
print("  管理后台: http://localhost:8000/admin")
print("\n登录账号:")
print("  管理员: admin / admin123456")
print("  测试用户: testuser / test123456")
print("\n按 Ctrl+C 停止服务")
print("=" * 50)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'health_platform.settings')

subprocess.run([sys.executable, 'manage.py', 'runserver', '0.0.0.0:8000'])
