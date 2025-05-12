from django.urls import path
from . import views

app_name = 'admin_app'

urlpatterns = [
    path('statistics/', views.system_statistics, name='system_statistics'),
    path('logs/', views.system_logs, name='system_logs'),
] 