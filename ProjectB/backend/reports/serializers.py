from rest_framework import serializers
from .models import HealthReport

class HealthReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthReport
        fields = ['id', 'user', 'report_type', 'report_date', 'start_date', 'end_date',
                  'status', 'health_score', 'heart_rate_summary', 'step_summary',
                  'sleep_summary', 'suggestions', 'warnings', 'generated_at',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'status', 'health_score', 'heart_rate_summary',
                           'step_summary', 'sleep_summary', 'suggestions', 'warnings',
                           'generated_at', 'created_at', 'updated_at']

class HealthReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthReport
        fields = ['report_type', 'report_date']
