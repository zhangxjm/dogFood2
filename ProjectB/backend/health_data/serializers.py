from rest_framework import serializers
from .models import HeartRateData, StepData, SleepData

class HeartRateDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeartRateData
        fields = ['id', 'user', 'device', 'recorded_at', 'heart_rate', 'confidence', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class HeartRateDataCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeartRateData
        fields = ['device', 'recorded_at', 'heart_rate', 'confidence']

class StepDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = StepData
        fields = ['id', 'user', 'device', 'recorded_at', 'steps', 'distance', 'calories', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class StepDataCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StepData
        fields = ['device', 'recorded_at', 'steps', 'distance', 'calories']

class SleepDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepData
        fields = ['id', 'user', 'device', 'recorded_at', 'stage', 'duration', 'respiratory_rate', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class SleepDataCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepData
        fields = ['device', 'recorded_at', 'stage', 'duration', 'respiratory_rate']

class BatchDataSerializer(serializers.Serializer):
    heart_rate = HeartRateDataCreateSerializer(many=True, required=False)
    steps = StepDataCreateSerializer(many=True, required=False)
    sleep = SleepDataCreateSerializer(many=True, required=False)
