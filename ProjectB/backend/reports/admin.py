from django.contrib import admin
from .models import HealthReport

class HealthReportAdmin(admin.ModelAdmin):
    list_display = ['user', 'report_type', 'report_date', 'health_score', 'status', 'generated_at']
    list_filter = ['report_type', 'status', 'report_date']
    search_fields = ['user__username']
    readonly_fields = ['user', 'health_score', 'heart_rate_summary', 'step_summary',
                       'sleep_summary', 'suggestions', 'warnings', 'generated_at',
                       'created_at', 'updated_at']
    date_hierarchy = 'report_date'
    
    fieldsets = (
        ('基本信息', {'fields': ('user', 'report_type', 'report_date', 'start_date', 'end_date')}),
        ('状态信息', {'fields': ('status', 'health_score')}),
        ('详细数据', {'fields': ('heart_rate_summary', 'step_summary', 'sleep_summary')}),
        ('建议与警告', {'fields': ('suggestions', 'warnings')}),
        ('时间戳', {'fields': ('generated_at', 'created_at', 'updated_at')}),
    )

admin.site.register(HealthReport, HealthReportAdmin)
