#!/usr/bin/env python
import os
import django
from django.utils import timezone
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'health_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from devices.models import Device
from health_data.models import HeartRateData, StepData, SleepData
from goals.models import HealthGoal

User = get_user_model()

def generate_test_data():
    print("=" * 50)
    print("生成测试数据")
    print("=" * 50)
    
    print("\n[1/5] 创建测试用户...")
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'testuser@example.com',
            'phone': '13800138000',
            'age': 30,
            'gender': 'M',
            'height': 175,
            'weight': 70,
        }
    )
    if created:
        user.set_password('test123456')
        user.save()
        print(f"  创建用户: {user.username} (密码: test123456)")
    else:
        print(f"  用户已存在: {user.username}")
    
    print("\n[2/5] 创建测试设备...")
    device, created = Device.objects.get_or_create(
        user=user,
        mac_address='00:11:22:33:44:55',
        defaults={
            'name': '我的智能手环',
            'device_type': 'SMART_BAND',
            'serial_number': 'SN-TEST-001',
            'firmware_version': 'v2.1.0',
            'battery_level': 85,
            'status': 'PAIRED',
        }
    )
    if created:
        print(f"  创建设备: {device.name}")
    else:
        print(f"  设备已存在: {device.name}")
    
    print("\n[3/5] 生成心率数据 (最近7天)...")
    HeartRateData.objects.filter(user=user).delete()
    
    now = timezone.now()
    heart_rate_records = []
    
    for day in range(7):
        day_date = now - timedelta(days=day)
        for hour in range(24):
            if 6 <= hour <= 22:
                base_hr = random.randint(65, 85)
                if 12 <= hour <= 14:
                    base_hr += random.randint(10, 25)
                elif 18 <= hour <= 20:
                    base_hr += random.randint(5, 15)
            else:
                base_hr = random.randint(55, 70)
            
            for minute in range(0, 60, 15):
                hr = base_hr + random.randint(-5, 5)
                confidence = round(random.uniform(0.8, 1.0), 2)
                
                record_time = day_date.replace(
                    hour=hour, minute=minute, second=0, microsecond=0
                )
                
                heart_rate_records.append(HeartRateData(
                    user=user,
                    device=device,
                    recorded_at=record_time,
                    heart_rate=hr,
                    confidence=confidence
                ))
    
    HeartRateData.objects.bulk_create(heart_rate_records)
    print(f"  生成了 {len(heart_rate_records)} 条心率记录")
    
    print("\n[4/5] 生成步数数据 (最近7天)...")
    StepData.objects.filter(user=user).delete()
    
    step_records = []
    for day in range(7):
        day_date = now - timedelta(days=day)
        weekday = day_date.weekday()
        
        if weekday < 5:
            total_steps = random.randint(6000, 12000)
        else:
            total_steps = random.randint(8000, 15000)
        
        for hour in range(6, 23, 3):
            hour_steps = int(total_steps / 6 * random.uniform(0.7, 1.3))
            distance = hour_steps * 0.7
            calories = hour_steps * 0.04
            
            record_time = day_date.replace(
                hour=hour, minute=0, second=0, microsecond=0
            )
            
            step_records.append(StepData(
                user=user,
                device=device,
                recorded_at=record_time,
                steps=hour_steps,
                distance=distance,
                calories=calories
            ))
    
    StepData.objects.bulk_create(step_records)
    print(f"  生成了 {len(step_records)} 条步数记录")
    
    print("\n[5/5] 生成睡眠数据 (最近7天)...")
    SleepData.objects.filter(user=user).delete()
    
    sleep_records = []
    sleep_stages = ['DEEP', 'LIGHT', 'REM', 'LIGHT']
    
    for day in range(7):
        day_date = now - timedelta(days=day)
        sleep_start = day_date.replace(hour=23, minute=0, second=0, microsecond=0)
        
        for stage_idx in range(8):
            stage = sleep_stages[stage_idx % 4]
            if stage == 'DEEP':
                duration = random.randint(30, 60)
            elif stage == 'REM':
                duration = random.randint(20, 40)
            else:
                duration = random.randint(40, 90)
            
            respiratory_rate = random.randint(12, 18) if stage != 'AWAKE' else random.randint(16, 20)
            
            record_time = sleep_start + timedelta(minutes=stage_idx * 60)
            
            sleep_records.append(SleepData(
                user=user,
                device=device,
                recorded_at=record_time,
                stage=stage,
                duration=duration,
                respiratory_rate=respiratory_rate
            ))
    
    SleepData.objects.bulk_create(sleep_records)
    print(f"  生成了 {len(sleep_records)} 条睡眠记录")
    
    print("\n[额外] 创建健康目标...")
    HealthGoal.objects.filter(user=user).delete()
    
    goals = [
        {
            'goal_type': 'STEPS',
            'target_value': 10000,
            'unit': '步',
            'start_date': (now - timedelta(days=7)).date(),
        },
        {
            'goal_type': 'CALORIES',
            'target_value': 500,
            'unit': 'kcal',
            'start_date': (now - timedelta(days=7)).date(),
        },
        {
            'goal_type': 'SLEEP',
            'target_value': 480,
            'unit': '分钟',
            'start_date': (now - timedelta(days=7)).date(),
        },
    ]
    
    for goal_data in goals:
        HealthGoal.objects.create(
            user=user,
            **goal_data,
            is_active=True
        )
    
    print(f"  创建了 {len(goals)} 个健康目标")
    
    print("\n" + "=" * 50)
    print("测试数据生成完成！")
    print("=" * 50)
    print(f"\n测试账号:")
    print(f"  用户名: testuser")
    print(f"  密码: test123456")
    print(f"\n数据范围:")
    print(f"  - 心率数据: 最近7天，每15分钟一条")
    print(f"  - 步数数据: 最近7天，每3小时一条")
    print(f"  - 睡眠数据: 最近7天，每晚8个阶段")
    print(f"  - 健康目标: 步数、卡路里、睡眠")

if __name__ == '__main__':
    generate_test_data()
