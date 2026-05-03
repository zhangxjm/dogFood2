from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HeartRateDataViewSet, StepDataViewSet, SleepDataViewSet,
    HealthDataBatchViewSet
)

router = DefaultRouter()
router.register(r'heart-rate', HeartRateDataViewSet, basename='heart-rate')
router.register(r'steps', StepDataViewSet, basename='steps')
router.register(r'sleep', SleepDataViewSet, basename='sleep')
router.register(r'batch', HealthDataBatchViewSet, basename='batch')

urlpatterns = [
    path('', include(router.urls)),
]
