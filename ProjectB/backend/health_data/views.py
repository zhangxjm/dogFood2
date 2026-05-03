from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Max, Min, Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
import pandas as pd
from .models import HeartRateData, StepData, SleepData
from .serializers import (
    HeartRateDataSerializer, HeartRateDataCreateSerializer,
    StepDataSerializer, StepDataCreateSerializer,
    SleepDataSerializer, SleepDataCreateSerializer,
    BatchDataSerializer
)

class HeartRateDataViewSet(viewsets.ModelViewSet):
    queryset = HeartRateData.objects.all()
    serializer_class = HeartRateDataSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return HeartRateDataCreateSerializer
        return HeartRateDataSerializer
    
    def get_queryset(self):
        return HeartRateData.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = self.get_queryset()
        if start_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            queryset = queryset.filter(recorded_at__gte=start)
        if end_date:
            end = datetime.strptime(end_date, '%Y-%m-%d')
            queryset = queryset.filter(recorded_at__lte=end + timedelta(days=1))
        
        stats = queryset.aggregate(
            avg_heart_rate=Avg('heart_rate'),
            max_heart_rate=Max('heart_rate'),
            min_heart_rate=Min('heart_rate'),
            total_records=Count('id')
        )
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def daily_average(self, request):
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        data = HeartRateData.objects.filter(
            user=request.user,
            recorded_at__gte=start_date,
            recorded_at__lte=end_date
        )
        
        if not data:
            return Response([])
        
        df = pd.DataFrame(list(data.values('recorded_at', 'heart_rate')))
        df['date'] = df['recorded_at'].dt.date
        daily_stats = df.groupby('date')['heart_rate'].agg(['mean', 'min', 'max']).reset_index()
        daily_stats['mean'] = daily_stats['mean'].round(1)
        
        result = daily_stats.to_dict('records')
        return Response(result)

class StepDataViewSet(viewsets.ModelViewSet):
    queryset = StepData.objects.all()
    serializer_class = StepDataSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StepDataCreateSerializer
        return StepDataSerializer
    
    def get_queryset(self):
        return StepData.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def daily_total(self, request):
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        data = StepData.objects.filter(
            user=request.user,
            recorded_at__gte=start_date,
            recorded_at__lte=end_date
        )
        
        if not data:
            return Response([])
        
        df = pd.DataFrame(list(data.values('recorded_at', 'steps', 'distance', 'calories')))
        df['date'] = df['recorded_at'].dt.date
        daily_stats = df.groupby('date').agg({
            'steps': 'sum',
            'distance': 'sum',
            'calories': 'sum'
        }).reset_index()
        
        result = daily_stats.to_dict('records')
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def weekly_summary(self, request):
        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)
        
        data = StepData.objects.filter(
            user=request.user,
            recorded_at__gte=start_date,
            recorded_at__lte=end_date
        )
        
        summary = data.aggregate(
            total_steps=Sum('steps'),
            total_distance=Sum('distance'),
            total_calories=Sum('calories'),
            avg_steps=Avg('steps')
        )
        
        return Response(summary)

class SleepDataViewSet(viewsets.ModelViewSet):
    queryset = SleepData.objects.all()
    serializer_class = SleepDataSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SleepDataCreateSerializer
        return SleepDataSerializer
    
    def get_queryset(self):
        return SleepData.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def daily_sleep(self, request):
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        data = SleepData.objects.filter(
            user=request.user,
            recorded_at__gte=start_date,
            recorded_at__lte=end_date
        )
        
        if not data:
            return Response([])
        
        df = pd.DataFrame(list(data.values('recorded_at', 'stage', 'duration')))
        df['date'] = df['recorded_at'].dt.date
        
        daily_sleep = df.groupby(['date', 'stage'])['duration'].sum().unstack(fill_value=0)
        daily_sleep['total'] = daily_sleep.sum(axis=1)
        daily_sleep = daily_sleep.reset_index()
        
        result = daily_sleep.to_dict('records')
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def sleep_quality(self, request):
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        data = SleepData.objects.filter(
            user=request.user,
            recorded_at__gte=start_date,
            recorded_at__lte=end_date
        )
        
        if not data:
            return Response({'quality_score': 0, 'message': '暂无睡眠数据'})
        
        df = pd.DataFrame(list(data.values('recorded_at', 'stage', 'duration')))
        df['date'] = df['recorded_at'].dt.date
        
        daily_summary = df.groupby(['date', 'stage'])['duration'].sum().unstack(fill_value=0)
        daily_summary['total'] = daily_summary.sum(axis=1)
        
        quality_scores = []
        for _, row in daily_summary.iterrows():
            total = row['total']
            if total == 0:
                continue
            
            deep_ratio = row.get('DEEP', 0) / total
            light_ratio = row.get('LIGHT', 0) / total
            rem_ratio = row.get('REM', 0) / total
            awake_ratio = row.get('AWAKE', 0) / total
            
            score = (deep_ratio * 0.4 + rem_ratio * 0.3 + light_ratio * 0.2 - awake_ratio * 0.5) * 100
            score = max(0, min(100, score))
            quality_scores.append(score)
        
        avg_score = sum(quality_scores) / len(quality_scores) if quality_scores else 0
        
        return Response({
            'quality_score': round(avg_score, 1),
            'total_days': len(quality_scores),
            'message': '睡眠质量评估完成'
        })

class HealthDataBatchViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        serializer = BatchDataSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        results = {}
        
        heart_rate_data = serializer.validated_data.get('heart_rate', [])
        if heart_rate_data:
            heart_rate_instances = [HeartRateData(user=user, **item) for item in heart_rate_data]
            HeartRateData.objects.bulk_create(heart_rate_instances)
            results['heart_rate'] = {'count': len(heart_rate_instances), 'status': 'success'}
        
        step_data = serializer.validated_data.get('steps', [])
        if step_data:
            step_instances = [StepData(user=user, **item) for item in step_data]
            StepData.objects.bulk_create(step_instances)
            results['steps'] = {'count': len(step_instances), 'status': 'success'}
        
        sleep_data = serializer.validated_data.get('sleep', [])
        if sleep_data:
            sleep_instances = [SleepData(user=user, **item) for item in sleep_data]
            SleepData.objects.bulk_create(sleep_instances)
            results['sleep'] = {'count': len(sleep_instances), 'status': 'success'}
        
        return Response({'message': '数据上传成功', 'results': results}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        user = request.user
        
        heart_rate_data = HeartRateData.objects.filter(
            user=user, recorded_at__gte=start_date, recorded_at__lte=end_date
        )
        step_data = StepData.objects.filter(
            user=user, recorded_at__gte=start_date, recorded_at__lte=end_date
        )
        sleep_data = SleepData.objects.filter(
            user=user, recorded_at__gte=start_date, recorded_at__lte=end_date
        )
        
        dashboard_data = {
            'period': {'start': start_date, 'end': end_date, 'days': days},
            'heart_rate': {
                'avg': heart_rate_data.aggregate(Avg('heart_rate'))['heart_rate__avg'],
                'max': heart_rate_data.aggregate(Max('heart_rate'))['heart_rate__max'],
                'min': heart_rate_data.aggregate(Min('heart_rate'))['heart_rate__min'],
                'count': heart_rate_data.count()
            },
            'steps': {
                'total': step_data.aggregate(Sum('steps'))['steps__sum'],
                'avg': step_data.aggregate(Avg('steps'))['steps__avg'],
                'distance': step_data.aggregate(Sum('distance'))['distance__sum'],
                'calories': step_data.aggregate(Sum('calories'))['calories__sum']
            },
            'sleep': {
                'total_duration': sleep_data.aggregate(Sum('duration'))['duration__sum'],
                'count': sleep_data.count()
            }
        }
        
        return Response(dashboard_data)
