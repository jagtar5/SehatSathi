from rest_framework import serializers
from hms.models import Doctor, Appointment
from django.contrib.auth.models import User

class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['doctor_id', 'first_name', 'last_name', 'specialization', 'department', 'contact_number', 'email']

class ScheduleSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = ['appointment_id', 'patient', 'patient_name', 'appointment_date', 'reason', 'status']
        
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}" 