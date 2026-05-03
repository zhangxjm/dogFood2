import MySQLdb

print("连接MySQL数据库...")
try:
    conn = MySQLdb.connect(
        host='127.0.0.1',
        port=3307,
        user='root',
        password='root',
        charset='utf8mb4'
    )
    cursor = conn.cursor()
    
    print("创建数据库 health_platform...")
    cursor.execute("CREATE DATABASE IF NOT EXISTS health_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    
    print("检查数据库...")
    cursor.execute("SHOW DATABASES")
    databases = [db[0] for db in cursor.fetchall()]
    print(f"现有数据库: {databases}")
    
    if 'health_platform' in databases:
        print("✓ 数据库创建成功！")
    else:
        print("✗ 数据库创建失败")
    
    cursor.close()
    conn.close()
    print("连接已关闭")
    
except Exception as e:
    print(f"错误: {e}")
    import traceback
    traceback.print_exc()
