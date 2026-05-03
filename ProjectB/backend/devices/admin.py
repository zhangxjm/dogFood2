from django.contrib import admin
from .models import Device

class DeviceAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'device_type', 'mac_address', 'status', 'battery_level', 'last_sync_time']
    list_filter = ['device_type', 'status']
    search_fields = ['name', 'mac_address', 'serial_number']
    ordering = ['-created_at']
    readonly_fields = ['user', 'created_at', 'updated_at']
    
    fieldsets = (
        ('基本信息', {'fields': ('user', 'name', 'device_type', 'mac_address')}),
        ('设备详情', {'fields': ('serial_number', 'firmware_version', 'battery_level')}),
        ('状态信息', {'fields': ('status', 'last_sync_time')}),
        ('时间戳', {'fields': ('created_at', 'updated_at')}),
    )

admin.site.register(Device, DeviceAdmin)
