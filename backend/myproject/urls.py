from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.views import LoginView, LogoutView
from rest_framework.routers import DefaultRouter

# Import ViewSets
from patient_app.views import PatientViewSet
from hms.views import AppointmentViewSet
from doctor_app.views import DoctorProfileViewSet, ScheduleViewSet

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
    path('login/',        LoginView.as_view(),  name='login'),
    path('logout/',       LogoutAllowGET.as_view(next_page='login'), name='logout'),

    # 2) API routes
    path('api/', include(router.urls)),
]
