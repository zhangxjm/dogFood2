from django.db import models
from django.conf import settings
from devices.models import Device

class HealthData(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='%(class)s_data')
    device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, blank=True, related_name='%(class)s_data')
    recorded_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class HeartRateData(HealthData):
    heart_rate = models.IntegerField(help_text='心率(次/分钟)')
    confidence = models.FloatField(default=1.0, help_text='数据置信度(0-1)')
    
    class Meta:
        db_table = 'heart_rate_data'
        verbose_name = '心率数据'
        verbose_name_plural = '心率数据'
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"心率: {self.heart_rate} BPM @ {self.recorded_at}"

class StepData(HealthData):
    steps = models.IntegerField(help_text='步数')
    distance = models.FloatField(default=0.0, help_text='距离(米)')
    calories = models.FloatField(default=0.0, help_text='消耗卡路里(千卡)')
    
    class Meta:
        db_table = 'step_data'
        verbose_name = '步数数据'
        verbose_name_plural = '步数数据'
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"步数: {self.steps} 步 @ {self.recorded_at}"

class SleepData(HealthData):
    SLEEP_STAGES = [
        ('AWAKE', '清醒'),
        ('LIGHT', '浅睡'),
        ('DEEP', '深睡'),
        ('REM', 'REM'),
    ]
    
    stage = models.CharField(max_length=20, choices=SLEEP_STAGES, default='LIGHT')
    duration = models.IntegerField(help_text='持续时间(分钟)')
    respiratory_rate = models.FloatField(null=True, blank=True, help_text='呼吸频率(次/分钟)')
    
    class Meta:
        db_table = 'sleep_data'
        verbose_name = '睡眠数据'
        verbose_name_plural = '睡眠数据'
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"睡眠: {self.stage} ({self.duration}分钟) @ {self.recorded_at}"
