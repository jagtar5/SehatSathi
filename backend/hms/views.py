from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Appointment, LabTestOrder, Patient, Doctor, Billing, Receptionist
from .serializers import (
    AppointmentSerializer, 
    LabTestOrderSerializer, 
    PatientSerializer,
    DoctorSerializer,
    BillingSerializer,
    ReceptionistSerializer
)

# Create your views here.

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class LabTestViewSet(viewsets.ModelViewSet):
    queryset = LabTestOrder.objects.all()
    serializer_class = LabTestOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

class BillingViewSet(viewsets.ModelViewSet):
    queryset = Billing.objects.all()
    serializer_class = BillingSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReceptionistViewSet(viewsets.ModelViewSet):
    queryset = Receptionist.objects.all()
    serializer_class = ReceptionistSerializer
    permission_classes = [permissions.IsAuthenticated]
