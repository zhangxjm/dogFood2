from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Max, Min, Sum
from django.utils import timezone
from datetime import datetime, timedelta
import pandas as pd
from .models import HealthReport
from .serializers import HealthReportSerializer, HealthReportCreateSerializer
from health_data.models import HeartRateData, StepData, SleepData

class HealthReportViewSet(viewsets.ModelViewSet):
    queryset = HealthReport.objects.all()
    serializer_class = HealthReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return HealthReportCreateSerializer
        return HealthReportSerializer
    
    def get_queryset(self):
        return HealthReport.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        report = serializer.save(user=self.request.user)
        self._generate_report(report)
    
    def _generate_report(self, report):
        user = report.user
        start_date = report.start_date
        end_date = report.end_date
        
        report.status = 'GENERATING'
        report.save()
        
        try:
            heart_rate_stats = self._calculate_heart_rate_stats(user, start_date, end_date)
            step_stats = self._calculate_step_stats(user, start_date, end_date)
            sleep_stats = self._calculate_sleep_stats(user, start_date, end_date)
            
            health_score = self._calculate_health_score(heart_rate_stats, step_stats, sleep_stats)
            suggestions = self._generate_suggestions(heart_rate_stats, step_stats, sleep_stats)
            warnings = self._generate_warnings(heart_rate_stats, step_stats, sleep_stats)
            
            report.heart_rate_summary = heart_rate_stats
            report.step_summary = step_stats
            report.sleep_summary = sleep_stats
            report.health_score = health_score
            report.suggestions = suggestions
            report.warnings = warnings
            report.status = 'COMPLETED'
            report.generated_at = timezone.now()
            report.save()
            
        except Exception as e:
            report.status = 'FAILED'
            report.warnings = f'报告生成失败: {str(e)}'
            report.save()
    
    def _calculate_heart_rate_stats(self, user, start_date, end_date):
        data = HeartRateData.objects.filter(
            user=user,
            recorded_at__gte=start_date,
            recorded_at__lte=end_date + timedelta(days=1)
        )
        
        if not data:
            return {'available': False, 'message': '暂无心率数据'}
        
        stats = {
            'available': True,
            'avg': round(data.aggregate(Avg('heart_rate'))['heart_rate__avg'], 1),
            'max': data.aggregate(Max('heart_rate'))['heart_rate__max'],
            'min': data.aggregate(Min('heart_rate'))['heart_rate__min'],
            'count': data.count()
        }
        
        high_heart_rate = data.filter(heart_rate__gt=100).count()
        low_heart_rate = data.filter(heart_rate__lt=60).count()
        stats['high_count'] = high_heart_rate
        stats['low_count'] = low_heart_rate
        
        return stats
    
    def _calculate_step_stats(self, user, start_date, end_date):
        data = StepData.objects.filter(
            user=user,
            recorded_at__gte=start_date,
            recorded_at__lte=end_date + timedelta(days=1)
        )
        
        if not data:
            return {'available': False, 'message': '暂无步数数据'}
        
        df = pd.DataFrame(list(data.values('recorded_at', 'steps', 'distance', 'calories')))
        df['date'] = df['recorded_at'].dt.date
        
        daily_stats = df.groupby('date').agg({
            'steps': 'sum',
            'distance': 'sum',
            'calories': 'sum'
        }).reset_index()
        
        stats = {
            'available': True,
            'total_steps': int(daily_stats['steps'].sum()),
            'avg_daily_steps': int(daily_stats['steps'].mean()),
            'max_daily_steps': int(daily_stats['steps'].max()),
            'min_daily_steps': int(daily_stats['steps'].min()),
            'total_distance': round(daily_stats['distance'].sum(), 2),
            'total_calories': round(daily_stats['calories'].sum(), 1),
            'active_days': len(daily_stats)
        }
        
        return stats
    
    def _calculate_sleep_stats(self, user, start_date, end_date):
        data = SleepData.objects.filter(
            user=user,
            recorded_at__gte=start_date,
            recorded_at__lte=end_date + timedelta(days=1)
        )
        
        if not data:
            return {'available': False, 'message': '暂无睡眠数据'}
        
        df = pd.DataFrame(list(data.values('recorded_at', 'stage', 'duration')))
        df['date'] = df['recorded_at'].dt.date
        
        daily_sleep = df.groupby(['date', 'stage'])['duration'].sum().unstack(fill_value=0)
        daily_sleep['total'] = daily_sleep.sum(axis=1)
        
        stats = {
            'available': True,
            'avg_total_sleep_minutes': int(daily_sleep['total'].mean()),
            'avg_deep_sleep_minutes': int(daily_sleep.get('DEEP', pd.Series([0])).mean()),
            'avg_light_sleep_minutes': int(daily_sleep.get('LIGHT', pd.Series([0])).mean()),
            'avg_rem_sleep_minutes': int(daily_sleep.get('REM', pd.Series([0])).mean()),
            'avg_awake_minutes': int(daily_sleep.get('AWAKE', pd.Series([0])).mean()),
            'sleep_days': len(daily_sleep)
        }
        
        if 'DEEP' in daily_sleep.columns and 'total' in daily_sleep.columns:
            deep_ratio = daily_sleep['DEEP'] / daily_sleep['total']
            stats['avg_deep_sleep_ratio'] = round(deep_ratio.mean() * 100, 1)
        
        return stats
    
    def _calculate_health_score(self, heart_rate_stats, step_stats, sleep_stats):
        score = 0
        total_weights = 0
        
        if heart_rate_stats.get('available'):
            avg_hr = heart_rate_stats['avg']
            if 60 <= avg_hr <= 80:
                hr_score = 100
            elif 50 <= avg_hr < 60 or 80 < avg_hr <= 100:
                hr_score = 70
            else:
                hr_score = 40
            score += hr_score * 0.3
            total_weights += 0.3
        
        if step_stats.get('available'):
            avg_steps = step_stats['avg_daily_steps']
            if avg_steps >= 10000:
                step_score = 100
            elif 7000 <= avg_steps < 10000:
                step_score = 85
            elif 5000 <= avg_steps < 7000:
                step_score = 60
            else:
                step_score = 30
            score += step_score * 0.35
            total_weights += 0.35
        
        if sleep_stats.get('available'):
            avg_sleep_hours = sleep_stats['avg_total_sleep_minutes'] / 60
            if 7 <= avg_sleep_hours <= 9:
                sleep_score = 100
            elif 6 <= avg_sleep_hours < 7 or 9 < avg_sleep_hours <= 10:
                sleep_score = 75
            else:
                sleep_score = 40
            
            deep_ratio = sleep_stats.get('avg_deep_sleep_ratio', 0)
            if deep_ratio >= 20:
                quality_score = 100
            elif 15 <= deep_ratio < 20:
                quality_score = 80
            elif 10 <= deep_ratio < 15:
                quality_score = 60
            else:
                quality_score = 40
            
            combined_sleep_score = (sleep_score + quality_score) / 2
            score += combined_sleep_score * 0.35
            total_weights += 0.35
        
        if total_weights > 0:
            final_score = round(score / total_weights, 1)
        else:
            final_score = 0
        
        return final_score
    
    def _generate_suggestions(self, heart_rate_stats, step_stats, sleep_stats):
        suggestions = []
        
        if heart_rate_stats.get('available'):
            avg_hr = heart_rate_stats['avg']
            if avg_hr > 85:
                suggestions.append('您的心率偏高，建议减少咖啡因摄入，保持充足睡眠，避免过度劳累。')
            elif avg_hr < 60:
                suggestions.append('您的心率偏低，如果没有不适症状通常是健康的，但建议定期监测。')
            else:
                suggestions.append('您的心率处于正常范围，继续保持良好的生活习惯。')
        
        if step_stats.get('available'):
            avg_steps = step_stats['avg_daily_steps']
            if avg_steps < 5000:
                suggestions.append(f'您的日均步数({avg_steps}步)偏低，建议每天增加步行时间，目标达到7000步以上。')
            elif avg_steps < 8000:
                suggestions.append(f'您的日均步数({avg_steps}步)表现不错，可以尝试增加到10000步以获得更多健康益处。')
            else:
                suggestions.append(f'您的日均步数({avg_steps}步)非常优秀，继续保持规律运动！')
        
        if sleep_stats.get('available'):
            avg_sleep = sleep_stats['avg_total_sleep_minutes'] / 60
            deep_ratio = sleep_stats.get('avg_deep_sleep_ratio', 0)
            
            if avg_sleep < 6:
                suggestions.append(f'您的平均睡眠时间({avg_sleep:.1f}小时)不足，建议每晚保证7-9小时的睡眠时间。')
            elif avg_sleep > 10:
                suggestions.append(f'您的平均睡眠时间({avg_sleep:.1f}小时)偏长，建议保持规律的作息时间，每晚7-9小时为宜。')
            
            if deep_ratio < 15:
                suggestions.append(f'您的深睡比例({deep_ratio}%)较低，建议睡前避免使用电子设备，保持卧室安静黑暗。')
        
        if not suggestions:
            suggestions.append('暂无足够数据生成个性化建议，请继续使用设备记录健康数据。')
        
        return '\n\n'.join(suggestions)
    
    def _generate_warnings(self, heart_rate_stats, step_stats, sleep_stats):
        warnings = []
        
        if heart_rate_stats.get('available'):
            high_count = heart_rate_stats.get('high_count', 0)
            low_count = heart_rate_stats.get('low_count', 0)
            
            if high_count > 5:
                warnings.append(f'检测到{high_count}次心率偏高记录(>100bpm)，如果频繁出现建议咨询医生。')
            if low_count > 5:
                warnings.append(f'检测到{low_count}次心率偏低记录(<60bpm)，如果伴随头晕等症状建议咨询医生。')
        
        if step_stats.get('available'):
            active_days = step_stats.get('active_days', 0)
            if active_days < 5:
                warnings.append(f'报告周期内仅有{active_days}天有运动记录，建议保持每日运动习惯。')
        
        if sleep_stats.get('available'):
            avg_awake = sleep_stats.get('avg_awake_minutes', 0)
            if avg_awake > 60:
                warnings.append(f'您每晚平均清醒时间({avg_awake}分钟)较长，可能存在睡眠中断问题。')
        
        if not warnings:
            return '暂无健康警告，继续保持良好的生活习惯。'
        
        return '\n\n'.join(warnings)
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        report = HealthReport.objects.filter(user=request.user, status='COMPLETED').first()
        if report:
            serializer = self.get_serializer(report)
            return Response(serializer.data)
        return Response({'message': '暂无可用报告'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        report_type = request.data.get('report_type', 'DAILY')
        report_date_str = request.data.get('report_date')
        
        if report_date_str:
            report_date = datetime.strptime(report_date_str, '%Y-%m-%d').date()
        else:
            report_date = timezone.now().date()
        
        if report_type == 'DAILY':
            start_date = report_date
            end_date = report_date
        elif report_type == 'WEEKLY':
            start_date = report_date - timedelta(days=report_date.weekday())
            end_date = start_date + timedelta(days=6)
        elif report_type == 'MONTHLY':
            start_date = report_date.replace(day=1)
            if start_date.month == 12:
                end_date = start_date.replace(year=start_date.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end_date = start_date.replace(month=start_date.month + 1, day=1) - timedelta(days=1)
        else:
            return Response({'error': '无效的报告类型'}, status=status.HTTP_400_BAD_REQUEST)
        
        existing_report = HealthReport.objects.filter(
            user=request.user,
            report_type=report_type,
            report_date=report_date
        ).first()
        
        if existing_report:
            existing_report.start_date = start_date
            existing_report.end_date = end_date
            existing_report.status = 'PENDING'
            existing_report.save()
            self._generate_report(existing_report)
            serializer = self.get_serializer(existing_report)
            return Response(serializer.data)
        
        report = HealthReport.objects.create(
            user=request.user,
            report_type=report_type,
            report_date=report_date,
            start_date=start_date,
            end_date=end_date
        )
        
        self._generate_report(report)
        serializer = self.get_serializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
