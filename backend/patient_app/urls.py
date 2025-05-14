from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientProfileViewSet, AppointmentViewSet, MedicalRecordViewSet, PatientLabTestOrderViewSet  # Added PatientLabTestOrderViewSet

router = DefaultRouter()
router.register(r'patient-profiles', PatientProfileViewSet, basename='patientprofile')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'medical-records', MedicalRecordViewSet, basename='medicalrecord')
router.register(r'lab-test-orders', PatientLabTestOrderViewSet, basename='patientlabtestorder')  # Added route for PatientLabTestOrder

urlpatterns = [
    path('', include(router.urls)),
]
