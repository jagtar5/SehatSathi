from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.views import LoginView, LogoutView
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view
from rest_framework.response import Response
import json
import django
from datetime import datetime
from django.utils import timezone

# Import ViewSets
from patient_app.views import PatientProfileViewSet, AppointmentViewSet, MedicalRecordViewSet, PatientLabTestOrderViewSet
from hms.views import LabTestViewSet, PatientViewSet, DoctorViewSet, ReceptionistViewSet
from doctor_app.views import DoctorProfileViewSet, ScheduleViewSet, DoctorScheduleViewSet

class LogoutAllowGET(LogoutView):
    def get(self, request, *args, **kwargs):
        return self.post(request, *args, **kwargs)

# Create & register the router
router = DefaultRouter()
router.register(r'patients', PatientProfileViewSet, basename='patient')
router.register(r'hms-patients', PatientViewSet, basename='hms-patient')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'doctors', DoctorProfileViewSet, basename='doctor')
router.register(r'schedules', ScheduleViewSet, basename='schedule')
router.register(r'doctor-schedules', DoctorScheduleViewSet, basename='doctor-schedule')
router.register(r'lab-tests', LabTestViewSet, basename='lab-test')
router.register(r'medical-records', MedicalRecordViewSet, basename='medical-record')
router.register(r'patient-lab-tests', PatientLabTestOrderViewSet, basename='patient-lab-test')
router.register(r'receptionists', ReceptionistViewSet, basename='receptionist')

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
                'diagnostics': '/api/diagnostics/', 
            }
        }
    }
    return Response(data)

@api_view(['GET'])
def api_diagnostics(request):
    """
    API endpoint to check system and database connectivity
    """
    from django.db import connection
    from django.db.utils import OperationalError
    from django.contrib.auth.models import User
    from hms.models import Doctor, Patient, Appointment
    from receptionist_app.models import Receptionist
    import django
    from datetime import datetime
    
    # Check database connectivity
    db_connected = True
    db_error = None
    try:
        # Try to execute a simple query
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except OperationalError as e:
        db_connected = False
        db_error = str(e)
    
    # Count model instances
    try:
        user_count = User.objects.count()
        doctor_count = Doctor.objects.count()
        patient_count = Patient.objects.count()
        appointment_count = Appointment.objects.count()
        receptionist_count = Receptionist.objects.count()
        
        # Get user type counts
        staff_users = User.objects.filter(is_staff=True).count()
        superusers = User.objects.filter(is_superuser=True).count()
        regular_users = user_count - staff_users
        
        # Get sample data for verification
        doctors_sample = list(Doctor.objects.all()[:3].values('doctor_id', 'first_name', 'last_name', 'specialization'))
        patients_sample = list(Patient.objects.all()[:3].values('patient_id', 'first_name', 'last_name'))
        
        model_counts = {
            "doctors": doctor_count,
            "patients": patient_count,
            "appointments": appointment_count,
            "receptionists": receptionist_count
        }
        
        # Check if models have data
        models_have_data = all([
            doctor_count > 0,
            patient_count > 0
        ])
        
    except Exception as e:
        db_connected = False
        db_error = str(e)
        user_count = 0
        model_counts = {"error": str(e)}
        models_have_data = False
        doctors_sample = []
        patients_sample = []
    
    # Build response data
    data = {
        "system_status": "healthy" if db_connected else "database_error",
        "timestamp": datetime.now().isoformat(),
        "server_version": django.get_version(),
        "database": {
            "connected": db_connected,
            "error": db_error,
            "models_have_data": models_have_data
        },
        "users": {
            "total": user_count,
            "types": {
                "staff_users": staff_users if 'staff_users' in locals() else 0,
                "superusers": superusers if 'superusers' in locals() else 0,
                "regular_users": regular_users if 'regular_users' in locals() else 0
            }
        },
        "models": model_counts,
        "samples": {
            "doctors": doctors_sample,
            "patients": patients_sample
        }
    }
    
    return Response(data)

@ensure_csrf_cookie
@api_view(['GET'])
def get_csrf_token(request):
    """
    Endpoint that simply returns a success message and ensures the CSRF cookie is set
    with appropriate attributes for proper cross-domain cookies.
    """
    response = Response({"success": "CSRF cookie set"})
    
    # Log the existing cookies coming in with the request
    print("Request cookies:", request.COOKIES)
    
    # Set specific attributes for the CSRF cookie to ensure it works properly
    # Get the value of the csrftoken cookie which ensure_csrf_cookie middleware just set
    csrf_token = request.COOKIES.get('csrftoken')
    if csrf_token:
        # Add the cookie again with more explicit attributes
        response.set_cookie(
            'csrftoken',
            csrf_token,
            max_age=3600,  # 1 hour
            path='/',
            secure=False,  # Set to True in production with HTTPS
            httponly=False,  # CSRF token needs to be readable by JavaScript
            samesite='Lax'  # 'Lax' is more permissive than 'Strict'
        )
        print(f"Set CSRF cookie with value: {csrf_token[:10]}...")
    else:
        print("No CSRF token found in cookies to enhance")
    
    return response

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
    
    # 4) Admin API routes - use a specific path to avoid conflicts
    path('api/admin/', include('admin_app.urls', namespace='admin_app_api')),
    
    # 5) API root endpoint
    path('api/', api_root, name='api_root'),
    
    # 6) Diagnostics endpoint - accessible without authentication
    path('api/diagnostics/', api_diagnostics, name='api_diagnostics'),
    
    # 7) CSRF token endpoint
    path('api/csrf-token/', get_csrf_token, name='get_csrf_token'),
]
