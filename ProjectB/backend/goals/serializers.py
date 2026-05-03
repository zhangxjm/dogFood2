from rest_framework import serializers
from .models import HealthGoal, Reminder, Notification

class HealthGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = HealthGoal
        fields = ['id', 'user', 'goal_type', 'target_value', 'current_value', 'unit',
                  'start_date', 'end_date', 'is_active', 'is_achieved', 'achieved_at',
                  'progress_percentage', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'current_value', 'is_achieved', 'achieved_at',
                           'progress_percentage', 'created_at', 'updated_at']

class HealthGoalCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthGoal
        fields = ['goal_type', 'target_value', 'unit', 'start_date', 'end_date']

class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = ['id', 'user', 'reminder_type', 'title', 'description',
                  'reminder_time', 'repeat', 'active_days', 'is_active',
                  'last_triggered', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'last_triggered', 'created_at', 'updated_at']

class ReminderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = ['reminder_type', 'title', 'description', 'reminder_time', 'repeat', 'active_days']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'notification_type', 'title', 'message',
                  'is_read', 'read_at', 'related_goal', 'related_reminder', 'created_at']
        read_only_fields = ['id', 'user', 'notification_type', 'title', 'message',
                           'related_goal', 'related_reminder', 'created_at']
