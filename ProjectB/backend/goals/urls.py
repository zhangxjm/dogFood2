from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HealthGoalViewSet, ReminderViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'goals', HealthGoalViewSet, basename='goal')
router.register(r'reminders', ReminderViewSet, basename='reminder')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
