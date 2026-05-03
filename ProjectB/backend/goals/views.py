from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Sum
from .models import HealthGoal, Reminder, Notification
from .serializers import (
    HealthGoalSerializer, HealthGoalCreateSerializer,
    ReminderSerializer, ReminderCreateSerializer,
    NotificationSerializer
)
from health_data.models import StepData, SleepData, HeartRateData

class HealthGoalViewSet(viewsets.ModelViewSet):
    queryset = HealthGoal.objects.all()
    serializer_class = HealthGoalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return HealthGoalCreateSerializer
        return HealthGoalSerializer
    
    def get_queryset(self):
        return HealthGoal.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        goal = serializer.save(user=self.request.user)
        self._update_goal_progress(goal)
    
    def _update_goal_progress(self, goal):
        user = goal.user
        start_date = goal.start_date
        end_date = goal.end_date if goal.end_date else timezone.now().date()
        
        if goal.goal_type == 'STEPS':
            step_data = StepData.objects.filter(
                user=user,
                recorded_at__gte=start_date,
                recorded_at__lte=end_date + timedelta(days=1)
            )
            total_steps = step_data.aggregate(total=Sum('steps'))['total'] or 0
            goal.current_value = total_steps
            goal.unit = '步'
        
        elif goal.goal_type == 'CALORIES':
            step_data = StepData.objects.filter(
                user=user,
                recorded_at__gte=start_date,
                recorded_at__lte=end_date + timedelta(days=1)
            )
            total_calories = step_data.aggregate(total=Sum('calories'))['total'] or 0
            goal.current_value = total_calories
            goal.unit = '千卡'
        
        elif goal.goal_type == 'DISTANCE':
            step_data = StepData.objects.filter(
                user=user,
                recorded_at__gte=start_date,
                recorded_at__lte=end_date + timedelta(days=1)
            )
            total_distance = step_data.aggregate(total=Sum('distance'))['total'] or 0
            goal.current_value = total_distance
            goal.unit = '米'
        
        elif goal.goal_type == 'SLEEP':
            sleep_data = SleepData.objects.filter(
                user=user,
                recorded_at__gte=start_date,
                recorded_at__lte=end_date + timedelta(days=1)
            )
            total_sleep = sleep_data.aggregate(total=Sum('duration'))['total'] or 0
            goal.current_value = total_sleep
            goal.unit = '分钟'
        
        elif goal.goal_type == 'HEART_RATE':
            heart_rate_data = HeartRateData.objects.filter(
                user=user,
                recorded_at__gte=start_date,
                recorded_at__lte=end_date + timedelta(days=1)
            )
            avg_heart_rate = heart_rate_data.aggregate(avg=Sum('heart_rate'))['avg']
            if avg_heart_rate and heart_rate_data.count() > 0:
                avg_heart_rate = avg_heart_rate / heart_rate_data.count()
                goal.current_value = avg_heart_rate
            goal.unit = 'bpm'
        
        if goal.current_value >= goal.target_value and not goal.is_achieved:
            goal.is_achieved = True
            goal.achieved_at = timezone.now()
            self._create_achievement_notification(goal)
        
        goal.save()
    
    def _create_achievement_notification(self, goal):
        Notification.objects.create(
            user=goal.user,
            notification_type='GOAL_ACHIEVED',
            title=f'恭喜！目标达成',
            message=f'您已成功完成{goal.get_goal_type_display()}：{goal.target_value}{goal.unit}',
            related_goal=goal
        )
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        goal = self.get_object()
        self._update_goal_progress(goal)
        serializer = self.get_serializer(goal)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        goals = HealthGoal.objects.filter(user=request.user, is_active=True)
        for goal in goals:
            self._update_goal_progress(goal)
        serializer = self.get_serializer(goals, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def achieved(self, request):
        goals = HealthGoal.objects.filter(user=request.user, is_achieved=True)
        serializer = self.get_serializer(goals, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        goal = self.get_object()
        goal.is_active = True
        goal.save()
        serializer = self.get_serializer(goal)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        goal = self.get_object()
        goal.is_active = False
        goal.save()
        serializer = self.get_serializer(goal)
        return Response(serializer.data)

class ReminderViewSet(viewsets.ModelViewSet):
    queryset = Reminder.objects.all()
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ReminderCreateSerializer
        return ReminderSerializer
    
    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        reminder = serializer.save(user=self.request.user)
        if reminder.reminder_type == 'SEDENTARY':
            reminder.title = reminder.title or '久坐提醒'
            reminder.description = reminder.description or '您已经坐了一段时间了，起来活动一下吧！'
        elif reminder.reminder_type == 'WATER':
            reminder.title = reminder.title or '饮水提醒'
            reminder.description = reminder.description or '记得多喝水，保持身体健康！'
        elif reminder.reminder_type == 'EXERCISE':
            reminder.title = reminder.title or '运动提醒'
            reminder.description = reminder.description or '是时候开始今天的运动了！'
        elif reminder.reminder_type == 'SLEEP':
            reminder.title = reminder.title or '睡眠提醒'
            reminder.description = reminder.description or '该睡觉了，保持充足的睡眠对健康很重要！'
        reminder.save()
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        weekday = today.weekday()
        
        reminders = Reminder.objects.filter(user=request.user, is_active=True)
        today_reminders = []
        
        for reminder in reminders:
            if reminder.repeat == 'DAILY':
                today_reminders.append(reminder)
            elif reminder.repeat == 'WEEKDAYS' and weekday < 5:
                today_reminders.append(reminder)
            elif reminder.repeat == 'WEEKENDS' and weekday >= 5:
                today_reminders.append(reminder)
            elif reminder.repeat == 'WEEKLY' and weekday in reminder.active_days:
                today_reminders.append(reminder)
        
        serializer = self.get_serializer(today_reminders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        reminder = self.get_object()
        reminder.is_active = not reminder.is_active
        reminder.save()
        serializer = self.get_serializer(reminder)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_default_sedentary(self, request):
        user = request.user
        existing = Reminder.objects.filter(
            user=user,
            reminder_type='SEDENTARY'
        ).first()
        
        if existing:
            return Response({'message': '已存在久坐提醒', 'reminder': ReminderSerializer(existing).data})
        
        reminder = Reminder.objects.create(
            user=user,
            reminder_type='SEDENTARY',
            title='久坐提醒',
            description='您已经坐了1小时了，起来活动一下吧！建议站立或行走5分钟。',
            reminder_time='10:00',
            repeat='WEEKDAYS',
            is_active=True
        )
        
        serializer = self.get_serializer(reminder)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def create_default_water(self, request):
        user = request.user
        existing = Reminder.objects.filter(
            user=user,
            reminder_type='WATER'
        ).first()
        
        if existing:
            return Response({'message': '已存在饮水提醒', 'reminder': ReminderSerializer(existing).data})
        
        reminder = Reminder.objects.create(
            user=user,
            reminder_type='WATER',
            title='饮水提醒',
            description='记得喝水！建议每天饮用8杯水（约2000ml）。',
            reminder_time='09:00',
            repeat='DAILY',
            is_active=True
        )
        
        serializer = self.get_serializer(reminder)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put', 'delete']
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        notifications = Notification.objects.filter(user=request.user, is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response({
            'count': notifications.count(),
            'notifications': serializer.data
        })
    
    @action(detail=True, methods=['put'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'])
    def mark_all_read(self, request):
        notifications = Notification.objects.filter(user=request.user, is_read=False)
        count = notifications.update(is_read=True, read_at=timezone.now())
        return Response({'marked_count': count, 'message': f'已标记{count}条通知为已读'})
