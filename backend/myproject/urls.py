from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.views import LoginView, LogoutView
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view
from rest_framework.response import Response
import json
import django
from datetime import datetime

# Import ViewSets
from patient_app.views import PatientViewSet
from hms.views import AppointmentViewSet, LabTestViewSet
from doctor_app.views import DoctorProfileViewSet, ScheduleViewSet, DoctorScheduleViewSet

class LogoutAllowGET(LogoutView):
    def get(self, request, *args, **kwargs):
        return self.post(request, *args, **kwargs)

# Create & register the router
router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'doctors', DoctorProfileViewSet, basename='doctor')
router.register(r'schedules', ScheduleViewSet, basename='schedule')
router.register(r'doctor-schedules', DoctorScheduleViewSet, basename='doctor-schedule')
router.register(r'lab-tests', LabTestViewSet, basename='lab-test')

# Custom API views for authentication
@csrf_exempt
@api_view(['POST'])
def api_login(request):
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')
    user_type = data.get('userType')
    
    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=400)
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        
        # Basic user info
        user_data = {
            'username': user.username,
            'email': user.email,
            'fullName': f"{user.first_name} {user.last_name}"
        }

        # Check if the user is an admin (staff or superuser)
        if user.is_staff or user.is_superuser:
            user_data.update({
                'userType': 'Admin',
                'isStaff': user.is_staff,
                'isSuperuser': user.is_superuser,
            })
            # Admin case takes precedence over other roles
        # If not admin, check if user is associated with a doctor
        elif hasattr(user, 'doctor'):
            try:
                doctor = user.doctor
                user_data.update({
                    'userType': 'Doctor',
                    'doctorId': doctor.doctor_id,
                    'fullName': f"{doctor.first_name} {doctor.last_name}",
                    'specialization': doctor.specialization,
                    'department': doctor.department
                })
            except Exception as e:
                pass  # Silently ignore if doctor relation doesn't exist
        else:
            # If user type was provided and user is not an admin or doctor
            user_data['userType'] = user_type
            
        return Response(user_data, status=200)
    else:
        return Response({'error': 'Invalid credentials'}, status=401)
        
@csrf_exempt
@api_view(['POST'])
def api_logout(request):
    logout(request)
    return Response({'message': 'Logged out successfully'}, status=200)

@api_view(['GET'])
def current_user(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=401)
    
    user = request.user
    data = {
        'username': user.username,
        'email': user.email,
        'fullName': f"{user.first_name} {user.last_name}",
    }
    
    # Check if user is an admin (staff or superuser)
    if user.is_staff or user.is_superuser:
        data.update({
            'userType': 'Admin',
            'isStaff': user.is_staff,
            'isSuperuser': user.is_superuser,
        })
    # If not admin, check if user is associated with a doctor
    elif hasattr(user, 'doctor'):
        try:
            doctor = user.doctor
            data.update({
                'userType': 'Doctor',
                'doctorId': doctor.doctor_id,
                'fullName': f"{doctor.first_name} {doctor.last_name}",
                'specialization': doctor.specialization,
                'department': doctor.department
            })
        except Exception as e:
            pass
        
    return Response(data)

@api_view(['GET'])
def api_root(request):
    """
    Root API endpoint to check server status and get basic info
    """
    data = {
        'status': 'online',
        'server_version': django.get_version(),
        'server_time': datetime.now().isoformat(),
        'api_endpoints': {
            'auth': {
                'login': '/api/login/',
                'logout': '/api/logout/',
                'current_user': '/api/current-user/',
            },
            'data': {
                'doctors': '/api/doctors/',
                'patients': '/api/patients/',
                'appointments': '/api/appointments/',
                'lab_tests': '/api/lab-tests/',
                'schedules': '/api/schedules/',
                'doctor_schedules': '/api/doctor-schedules/',
            },
            'admin': {
                'statistics': '/api/statistics/',
                'logs': '/api/logs/',
            }
        }
    }
    return Response(data)

urlpatterns = [
    path('admin/',    admin.site.urls),

    # your existing app routes
    path('doctor/',       include('doctor_app.urls',       namespace='doctor_app')),
    path('patient/',      include('patient_app.urls')),
    path('receptionist/', include('receptionist_app.urls')),
    path('admin-app/',    include('admin_app.urls',        namespace='admin_app')),
    path('login/',        LoginView.as_view(),  name='login'),
    path('logout/',       LogoutAllowGET.as_view(next_page='login'), name='logout'),

    # 2) API routes
    path('api/', include(router.urls)),
    
    # 3) API auth routes
    path('api/login/', api_login, name='api_login'),
    path('api/logout/', api_logout, name='api_logout'),
    path('api/current-user/', current_user, name='current_user'),
    
    # 4) Admin statistics and logs
    path('api/', include('admin_app.urls')),
    
    # 5) API root endpoint
    path('api/', api_root, name='api_root'),
]
