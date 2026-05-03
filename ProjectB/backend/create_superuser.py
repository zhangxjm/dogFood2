import os
import sys
import subprocess

print("=" * 50)
print("创建超级用户")
print("=" * 50)

os.chdir(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'health_platform.settings')

import django
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

username = 'admin'
email = 'admin@example.com'
password = 'admin123456'

if User.objects.filter(username=username).exists():
    print(f"用户 '{username}' 已存在，跳过创建")
else:
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    print(f"✓ 超级用户创建成功！")
    print(f"  用户名: {username}")
    print(f"  密码: {password}")

print("\n" + "=" * 50)
print("创建测试用户")
print("=" * 50)

test_username = 'testuser'
test_email = 'testuser@example.com'
test_password = 'test123456'

if User.objects.filter(username=test_username).exists():
    print(f"用户 '{test_username}' 已存在，跳过创建")
else:
    user = User.objects.create_user(
        username=test_username,
        email=test_email,
        password=test_password,
        phone='13800138000',
        age=30,
        gender='M',
        height=175,
        weight=70
    )
    print(f"✓ 测试用户创建成功！")
    print(f"  用户名: {test_username}")
    print(f"  密码: {test_password}")

print("\n" + "=" * 50)
print("用户创建完成！")
print("=" * 50)
