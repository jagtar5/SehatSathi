from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.contrib.auth.views import LogoutView
from rest_framework.routers import DefaultRouter

# Import ViewSets
from patient_app.views import PatientViewSet
from hms.views import AppointmentViewSet
from doctor_app.views import DoctorProfileViewSet, ScheduleViewSet
from hms.api_views import login_view, logout_view, user_info

class LogoutAllowGET(LogoutView):
    def get(self, request, *args, **kwargs):
        return self.post(request, *args, **kwargs)

# Create & register the router
router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'doctors', DoctorProfileViewSet, basename='doctor')
router.register(r'schedules', ScheduleViewSet, basename='schedule')

urlpatterns = [
    path('admin/',    admin.site.urls),

    # your existing app routes
    path('doctor/',       include('doctor_app.urls',       namespace='doctor_app')),
    path('patient/',      include('patient_app.urls')),
    path('receptionist/', include('receptionist_app.urls')),

    # API authentication endpoints
    path('api/login/',    login_view,  name='api_login'),
    path('api/logout/',   logout_view, name='api_logout'),
    path('api/user/',     user_info,   name='api_user_info'),

    # Keep the existing auth views for browser-based login
    path('login/',        auth_views.LoginView.as_view(),  name='login'),
    path('logout/',       LogoutAllowGET.as_view(next_page='login'), name='logout'),

    # 2) API routes
    path('api/', include(router.urls)),
]
