from django.db import models
from django.conf import settings

class Device(models.Model):
    DEVICE_TYPES = [
        ('SMART_BAND', '智能手环'),
        ('SMART_WATCH', '智能手表'),
        ('HEART_RATE_MONITOR', '心率监测仪'),
        ('SLEEP_TRACKER', '睡眠追踪器'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', '激活'),
        ('INACTIVE', '未激活'),
        ('PAIRED', '已配对'),
        ('UNPAIRED', '未配对'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='devices')
    name = models.CharField(max_length=100)
    device_type = models.CharField(max_length=50, choices=DEVICE_TYPES, default='SMART_BAND')
    mac_address = models.CharField(max_length=20, unique=True)
    serial_number = models.CharField(max_length=50, blank=True, null=True)
    firmware_version = models.CharField(max_length=20, blank=True, null=True)
    battery_level = models.IntegerField(default=100, help_text='电量百分比')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INACTIVE')
    last_sync_time = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'devices'
        verbose_name = '设备'
        verbose_name_plural = '设备'
    
    def __str__(self):
        return f"{self.name} ({self.mac_address})"
