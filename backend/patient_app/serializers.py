from rest_framework import serializers
from .models import PatientProfile, Appointment, MedicalRecord, PatientLabTestOrder
from django.contrib.auth.models import User
from hms.models import Doctor
from hms.serializers import DoctorSerializer

class PatientProfileSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True
    )
    
    def get_user_details(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name,
            }
        return None

    class Meta:
        model = PatientProfile
        fields = ('user', 'user_details', 'date_of_birth', 'address', 'contact_number')

class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = PatientProfileSerializer(source='patient', read_only=True)
    patient = serializers.PrimaryKeyRelatedField(queryset=PatientProfile.objects.all(), write_only=True, required=False)
    doctor_details = serializers.SerializerMethodField()
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=Doctor.objects.all(),
        write_only=True
    )
    
    def get_doctor_details(self, obj):
        if obj.doctor:
            return {
                'doctor_id': obj.doctor.doctor_id,
                'first_name': obj.doctor.first_name,
                'last_name': obj.doctor.last_name,
                'specialization': obj.doctor.specialization,
                'department': obj.doctor.department,
                'contact_number': obj.doctor.contact_number,
                'email': obj.doctor.email,
            }
        return None

    class Meta:
        model = Appointment
        fields = (
            'id', 
            'patient', 'patient_details', 
            'doctor', 'doctor_details', 
            'appointment_datetime', 
            'reason', 
            'status', 
            'created_at', 
            'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at', 'status')

class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_details = PatientProfileSerializer(source='patient', read_only=True)
    patient = serializers.PrimaryKeyRelatedField(queryset=PatientProfile.objects.all(), write_only=True)
    doctor_details = serializers.SerializerMethodField()
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=Doctor.objects.all(),
        allow_null=True, 
        required=False,
        write_only=True
    )
    
    def get_doctor_details(self, obj):
        if obj.doctor:
            return {
                'doctor_id': obj.doctor.doctor_id,
                'first_name': obj.doctor.first_name,
                'last_name': obj.doctor.last_name,
                'specialization': obj.doctor.specialization,
                'department': obj.doctor.department,
                'contact_number': obj.doctor.contact_number,
                'email': obj.doctor.email,
            }
        return None

    class Meta:
        model = MedicalRecord
        fields = (
            'id', 
            'patient', 'patient_details',
            'doctor', 'doctor_details',
            'record_type', 
            'description', 
            'document', 
            'created_at', 
            'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at')

class PatientLabTestOrderSerializer(serializers.ModelSerializer):
    patient_details = PatientProfileSerializer(source='patient', read_only=True)
    patient = serializers.PrimaryKeyRelatedField(
        queryset=PatientProfile.objects.all(),
        write_only=True
    )
    ordered_by_doctor_details = serializers.SerializerMethodField()
    ordered_by_doctor = serializers.PrimaryKeyRelatedField(
        queryset=Doctor.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    
    def get_ordered_by_doctor_details(self, obj):
        if obj.ordered_by_doctor:
            return {
                'doctor_id': obj.ordered_by_doctor.doctor_id,
                'first_name': obj.ordered_by_doctor.first_name,
                'last_name': obj.ordered_by_doctor.last_name,
                'specialization': obj.ordered_by_doctor.specialization,
                'department': obj.ordered_by_doctor.department,
                'contact_number': obj.ordered_by_doctor.contact_number,
                'email': obj.ordered_by_doctor.email,
            }
        return None

    class Meta:
        model = PatientLabTestOrder
        fields = (
            'id',
            'patient', 'patient_details',
            'ordered_by_doctor', 'ordered_by_doctor_details',
            'test_name',
            'order_datetime',
            'status',
            'result_summary',
            'results_ready_datetime',
            'notes_by_doctor',
            'result_document',
            'sample_collection_datetime',
            'actual_cost',
            'updated_at'
        )
        read_only_fields = ('order_datetime', 'updated_at', 'results_ready_datetime')
