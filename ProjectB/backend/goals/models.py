from django.db import models
from django.conf import settings

class HealthGoal(models.Model):
    GOAL_TYPES = [
        ('STEPS', '步数目标'),
        ('CALORIES', '卡路里目标'),
        ('DISTANCE', '距离目标'),
        ('SLEEP', '睡眠目标'),
        ('HEART_RATE', '心率目标'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='goals')
    goal_type = models.CharField(max_length=30, choices=GOAL_TYPES)
    target_value = models.FloatField(help_text='目标值')
    current_value = models.FloatField(default=0.0, help_text='当前值')
    unit = models.CharField(max_length=20, help_text='单位')
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_achieved = models.BooleanField(default=False)
    achieved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'health_goals'
        verbose_name = '健康目标'
        verbose_name_plural = '健康目标'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_goal_type_display()} - {self.target_value}{self.unit}"
    
    @property
    def progress_percentage(self):
        if self.target_value == 0:
            return 0
        return min(100, round((self.current_value / self.target_value) * 100, 1))

class Reminder(models.Model):
    REMINDER_TYPES = [
        ('SEDENTARY', '久坐提醒'),
        ('WATER', '饮水提醒'),
        ('MEDICATION', '服药提醒'),
        ('EXERCISE', '运动提醒'),
        ('SLEEP', '睡眠提醒'),
        ('CUSTOM', '自定义提醒'),
    ]
    
    REPEAT_CHOICES = [
        ('ONCE', '一次'),
        ('DAILY', '每天'),
        ('WEEKLY', '每周'),
        ('WEEKDAYS', '工作日'),
        ('WEEKENDS', '周末'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=30, choices=REMINDER_TYPES)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    reminder_time = models.TimeField(help_text='提醒时间')
    repeat = models.CharField(max_length=20, choices=REPEAT_CHOICES, default='DAILY')
    active_days = models.JSONField(default=list, help_text='活动日期列表，如[1,2,3,4,5]表示周一至周五')
    
    is_active = models.BooleanField(default=True)
    last_triggered = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reminders'
        verbose_name = '提醒'
        verbose_name_plural = '提醒'
        ordering = ['reminder_time']
    
    def __str__(self):
        return f"{self.get_reminder_type_display()} - {self.title} @ {self.reminder_time}"

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('GOAL_ACHIEVED', '目标达成'),
        ('REMINDER', '提醒通知'),
        ('HEALTH_ALERT', '健康警报'),
        ('DEVICE_ALERT', '设备提醒'),
        ('SYSTEM', '系统通知'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=100)
    message = models.TextField()
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    related_goal = models.ForeignKey(HealthGoal, on_delete=models.SET_NULL, null=True, blank=True)
    related_reminder = models.ForeignKey(Reminder, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = '通知'
        verbose_name_plural = '通知'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_notification_type_display()} - {self.title}"
