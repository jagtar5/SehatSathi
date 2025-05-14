from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillViewSet, register_patient_api, receptionist_patient_registration_view

router = DefaultRouter()
router.register(r'bills', BillViewSet, basename='bill')

urlpatterns = [
    path('', include(router.urls)),
    path('register-patient/', register_patient_api, name='register_patient_api'),
    path('patient-registration/', receptionist_patient_registration_view, name='receptionist_patient_registration'),
]
