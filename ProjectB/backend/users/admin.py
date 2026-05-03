from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()

class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'phone', 'age', 'gender', 'is_staff', 'created_at']
    list_filter = ['gender', 'is_staff', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'phone']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('个人信息', {'fields': ('phone', 'age', 'gender', 'height', 'weight')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('个人信息', {'fields': ('phone', 'age', 'gender', 'height', 'weight')}),
    )

admin.site.register(User, UserAdmin)
