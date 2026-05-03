from django.db import models
from django.conf import settings

class HealthReport(models.Model):
    REPORT_TYPES = [
        ('DAILY', '日报'),
        ('WEEKLY', '周报'),
        ('MONTHLY', '月报'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', '待生成'),
        ('GENERATING', '生成中'),
        ('COMPLETED', '已完成'),
        ('FAILED', '生成失败'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports')
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    report_date = models.DateField()
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    health_score = models.FloatField(default=0.0, help_text='健康评分(0-100)')
    heart_rate_summary = models.JSONField(default=dict, null=True, blank=True)
    step_summary = models.JSONField(default=dict, null=True, blank=True)
    sleep_summary = models.JSONField(default=dict, null=True, blank=True)
    
    suggestions = models.TextField(blank=True, null=True)
    warnings = models.TextField(blank=True, null=True)
    
    generated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'health_reports'
        verbose_name = '健康报告'
        verbose_name_plural = '健康报告'
        ordering = ['-report_date']
        unique_together = ['user', 'report_type', 'report_date']
    
    def __str__(self):
        return f"{self.get_report_type_display()} - {self.report_date} ({self.user.username})"
