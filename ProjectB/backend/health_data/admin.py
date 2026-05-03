from django.contrib import admin
from .models import HeartRateData, StepData, SleepData

class HeartRateDataAdmin(admin.ModelAdmin):
    list_display = ['user', 'heart_rate', 'confidence', 'recorded_at', 'device']
    list_filter = ['recorded_at']
    search_fields = ['user__username']
    readonly_fields = ['user', 'created_at', 'updated_at']
    date_hierarchy = 'recorded_at'

class StepDataAdmin(admin.ModelAdmin):
    list_display = ['user', 'steps', 'distance', 'calories', 'recorded_at', 'device']
    list_filter = ['recorded_at']
    search_fields = ['user__username']
    readonly_fields = ['user', 'created_at', 'updated_at']
    date_hierarchy = 'recorded_at'

class SleepDataAdmin(admin.ModelAdmin):
    list_display = ['user', 'stage', 'duration', 'respiratory_rate', 'recorded_at', 'device']
    list_filter = ['stage', 'recorded_at']
    search_fields = ['user__username']
    readonly_fields = ['user', 'created_at', 'updated_at']
    date_hierarchy = 'recorded_at'

admin.site.register(HeartRateData, HeartRateDataAdmin)
admin.site.register(StepData, StepDataAdmin)
admin.site.register(SleepData, SleepDataAdmin)
