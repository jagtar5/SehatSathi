from django.shortcuts import render
from rest_framework import viewsets
from .models import Appointment, LabTestOrder
from .serializers import AppointmentSerializer, LabTestOrderSerializer

# Create your views here.

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

class LabTestViewSet(viewsets.ModelViewSet):
    queryset = LabTestOrder.objects.all()
    serializer_class = LabTestOrderSerializer
