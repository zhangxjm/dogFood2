from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
from .models import Device
from .serializers import DeviceSerializer, DeviceCreateSerializer, DeviceUpdateSerializer

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DeviceCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DeviceUpdateSerializer
        return DeviceSerializer
    
    def get_queryset(self):
        return Device.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def pair(self, request, pk=None):
        device = self.get_object()
        device.status = 'PAIRED'
        device.save()
        return Response({'status': '设备配对成功'})
    
    @action(detail=True, methods=['post'])
    def unpair(self, request, pk=None):
        device = self.get_object()
        device.status = 'UNPAIRED'
        device.save()
        return Response({'status': '设备取消配对成功'})
    
    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        device = self.get_object()
        device.last_sync_time = datetime.now()
        device.save()
        return Response({'status': '设备同步成功', 'last_sync_time': device.last_sync_time})
    
    @action(detail=False, methods=['get'])
    def my_devices(self, request):
        devices = self.get_queryset()
        serializer = self.get_serializer(devices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active_devices(self, request):
        devices = Device.objects.filter(user=self.request.user, status='ACTIVE')
        serializer = self.get_serializer(devices, many=True)
        return Response(serializer.data)
