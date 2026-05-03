from rest_framework import serializers
from .models import Device

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['id', 'user', 'name', 'device_type', 'mac_address', 'serial_number', 
                  'firmware_version', 'battery_level', 'status', 'last_sync_time', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'last_sync_time']

class DeviceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['name', 'device_type', 'mac_address', 'serial_number', 'firmware_version']

class DeviceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['name', 'status', 'battery_level']
