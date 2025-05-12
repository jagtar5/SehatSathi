from rest_framework import serializers
from hms.models import Doctor, Appointment
from django.contrib.auth.models import User
from .models import DoctorSchedule

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class DoctorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Doctor
        fields = ['doctor_id', 'user', 'first_name', 'last_name', 'specialization', 'department', 'contact_number', 'email']

class ScheduleSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = ['appointment_id', 'patient', 'patient_name', 'appointment_date', 'reason', 'status']
        
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}" 

# Add the new serializer for doctor schedules
class DoctorScheduleSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DoctorSchedule
        fields = ['schedule_id', 'doctor', 'doctor_name', 'day_of_week', 'start_time', 'end_time', 'max_appointments', 'is_available']
    
    def get_doctor_name(self, obj):
        return f"{obj.doctor.first_name} {obj.doctor.last_name}" 