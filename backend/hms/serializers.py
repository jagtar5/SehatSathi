from rest_framework import serializers
from .models import Appointment, Doctor, Patient, LabTestOrder, Billing, Receptionist

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ('doctor_id', 'first_name', 'last_name', 'specialization', 'department', 'contact_number', 'email')

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ('patient_id', 'reg_num', 'first_name', 'last_name', 'gender', 'date_of_birth', 
                  'contact_number', 'email', 'registration_date')

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = ['appointment_id', 'doctor', 'doctor_name', 'patient', 'patient_name', 'appointment_date', 'reason', 'status']
    
    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.first_name} {obj.doctor.last_name}"
    
    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

class LabTestOrderSerializer(serializers.ModelSerializer):
    doctor_details = DoctorSerializer(source='doctor', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)
    
    class Meta:
        model = LabTestOrder
        fields = ('id', 'doctor', 'doctor_details', 'patient', 'patient_details', 
                  'test_name', 'notes', 'status', 'requested_at')

class BillingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Billing
        fields = ('bill_id', 'patient', 'appointment', 'bill_date', 'amount', 'status', 
                  'payment_date', 'payment_method', 'invoice_number', 'notes')

class ReceptionistSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Receptionist
        fields = ('receptionist_id', 'first_name', 'last_name', 'contact_number', 
                  'email', 'address', 'date_of_birth', 'join_date', 'is_active', 'user_details')
    
    def get_user_details(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name
            }
        return None
