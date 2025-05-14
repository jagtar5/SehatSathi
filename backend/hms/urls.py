from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PatientViewSet, 
    DoctorViewSet, 
    AppointmentViewSet, 
    BillingViewSet,
    LabTestViewSet,
    ReceptionistViewSet
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'doctors', DoctorViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'billings', BillingViewSet)
router.register(r'lab-tests', LabTestViewSet)
router.register(r'receptionists', ReceptionistViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 