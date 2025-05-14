from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

app_name = 'admin_app'

# Debugging endpoint to list all URLs
@csrf_exempt
def list_endpoints(request):
    endpoints = [
        {
            "path": "/api/admin/register/patient/",
            "method": "POST",
            "description": "API endpoint to register a patient"
        },
        {
            "path": "/api/admin/register/doctor/",
            "method": "POST",
            "description": "API endpoint to register a doctor"
        },
        {
            "path": "/api/admin/register/receptionist/",
            "method": "POST",
            "description": "API endpoint to register a receptionist"
        }
    ]
    return JsonResponse({"endpoints": endpoints})

# API endpoints
urlpatterns = [
    # API info
    path('endpoints/', list_endpoints, name='list_endpoints'),
    
    # Original endpoints
    path('statistics/', views.system_statistics, name='system_statistics'),
    path('logs/', views.system_logs, name='system_logs'),
    
    # Web routes for admin registration forms
    path('register/patient/', views.admin_register_patient_view, name='admin_register_patient'),
    path('register/doctor/', views.admin_register_doctor_view, name='admin_register_doctor'),
    path('register/receptionist/', views.admin_register_receptionist_view, name='admin_register_receptionist'),
    
    # API routes for admin registration
    path('api/register/patient/', views.admin_api_register_patient, name='admin_api_register_patient'),
    path('register/patient/api/', csrf_exempt(views.admin_api_register_patient), name='admin_api_register_patient_alt'),
    # Simple endpoint for patient registration without CSRF
    path('patient-register/', views.patient_register_no_csrf, name='patient_register_simple'),
    path('no-csrf-patient-register/', views.patient_register_no_csrf, name='patient_register_no_csrf'),
    path('api/register/doctor/', views.admin_api_register_doctor, name='admin_api_register_doctor'),
    path('api/register/receptionist/', views.admin_api_register_receptionist, name='admin_api_register_receptionist'),
    path('no-csrf-doctor-register/', views.doctor_register_no_csrf, name='no_csrf_doctor_register'),
    path('no-csrf-receptionist-register/', views.receptionist_register_no_csrf, name='no_csrf_receptionist_register'),
] 