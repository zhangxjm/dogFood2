from django.contrib import admin
from .models import HealthGoal, Reminder, Notification

class HealthGoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'goal_type', 'target_value', 'current_value', 'unit', 
                    'progress_percentage', 'is_active', 'is_achieved', 'start_date', 'end_date']
    list_filter = ['goal_type', 'is_active', 'is_achieved']
    search_fields = ['user__username']
    readonly_fields = ['user', 'current_value', 'progress_percentage', 'is_achieved', 
                       'achieved_at', 'created_at', 'updated_at']
    date_hierarchy = 'start_date'

class ReminderAdmin(admin.ModelAdmin):
    list_display = ['user', 'reminder_type', 'title', 'reminder_time', 'repeat', 'is_active', 'last_triggered']
    list_filter = ['reminder_type', 'repeat', 'is_active']
    search_fields = ['user__username', 'title']
    readonly_fields = ['user', 'last_triggered', 'created_at', 'updated_at']

class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'notification_type', 'title', 'is_read', 'read_at', 'created_at']
    list_filter = ['notification_type', 'is_read']
    search_fields = ['user__username', 'title', 'message']
    readonly_fields = ['user', 'notification_type', 'title', 'message', 
                       'related_goal', 'related_reminder', 'created_at']
    date_hierarchy = 'created_at'

admin.site.register(HealthGoal, HealthGoalAdmin)
admin.site.register(Reminder, ReminderAdmin)
admin.site.register(Notification, NotificationAdmin)
