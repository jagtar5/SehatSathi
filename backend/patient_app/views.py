from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import PatientProfile, Appointment, MedicalRecord, PatientLabTestOrder
from .serializers import PatientProfileSerializer, AppointmentSerializer, MedicalRecordSerializer, PatientLabTestOrderSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from hms.models import Doctor

# Define custom permission classes
class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class IsAdministratorRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff

class IsPatientRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

class IsDoctorRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

class IsReceptionistRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

class IsDoctorOrReceptionistRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

class IsPatientOfRecord(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, 'patientprofile'):
            return obj.patient == request.user.patientprofile
        return False

class IsDoctorOfRecord(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, 'doctor'):
            return obj.doctor == request.user.doctor
        return False

class IsPatientOwnerOfOrder(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, 'patientprofile'):
            return obj.patient == request.user.patientprofile
        return False

class IsDoctorWhoOrdered(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, 'doctor'):
            return obj.ordered_by_doctor == request.user.doctor
        return False

# Create your views here.

class PatientProfileViewSet(viewsets.ModelViewSet):
    queryset = PatientProfile.objects.all()
    serializer_class = PatientProfileSerializer
    # permission_classes = [permissions.IsAdminUser] # Default to admin for all actions

    def get_permissions(self):
        if self.action == 'create': # Changed condition
            self.permission_classes = [IsAdministratorRole | IsReceptionistRole] # Added IsReceptionistRole
        elif self.action == 'list' or self.action == 'destroy': # Separated list and destroy
            self.permission_classes = [IsAdministratorRole]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            # IsOwner checks obj.user == request.user
            self.permission_classes = [IsAdministratorRole | IsOwner]
        else:
            self.permission_classes = [IsAdministratorRole] # Default
        return [permission() for permission in self.permission_classes]

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    # queryset = Appointment.objects.all() # Queryset will be filtered by get_queryset
    # permission_classes = [permissions.IsAuthenticated] # Placeholder, refine later

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Appointment.objects.none()

        if user.role == "ADMIN" or user.role == "RECEPTIONIST":
            return Appointment.objects.all().order_by('-appointment_datetime') # Corrected ordering
        elif user.role == "DOCTOR":
            # Get the Doctor instance for this user
            try:
                doctor = Doctor.objects.get(user=user)
                return Appointment.objects.filter(doctor=doctor).order_by('-appointment_datetime')
            except Doctor.DoesNotExist:
                return Appointment.objects.none()
        elif user.role == "PATIENT":
            # Assuming PatientProfile is linked to the user and Appointment has a 'patient' FK
            if hasattr(user, 'patientprofile'):
                return Appointment.objects.filter(patient=user.patientprofile).order_by('-appointment_datetime') # Corrected ordering
            return Appointment.objects.none()
        return Appointment.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            # Only Patients can request/create new appointments for themselves using this endpoint.
            # Admin/Receptionist will use other mechanisms or update status of requested appointments.
            self.permission_classes = [IsPatientRole]
        elif self.action == 'list':
            self.permission_classes = [permissions.IsAuthenticated] # Queryset handles filtering
        elif self.action in ['retrieve', 'update', 'partial_update']:
            # Admin/Receptionist can manage. Patient can manage their own. Doctor can manage their own.
            self.permission_classes = [
                IsAdministratorRole | IsReceptionistRole | IsPatientOfRecord | IsDoctorOfRecord
            ]
        elif self.action == 'destroy':
            self.permission_classes = [IsAdministratorRole | IsReceptionistRole | IsPatientOfRecord ] # Patient can cancel
        elif self.action == 'cancel': # Permissions for the new cancel action
            self.permission_classes = [IsAdministratorRole | IsReceptionistRole | IsPatientOfRecord]
        else:
            self.permission_classes = [IsAdministratorRole] # Default
        return [permission() for permission in self.permission_classes]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == "PATIENT":
            # Patients can only create appointments for themselves
            if hasattr(user, 'patientprofile'):
                # Status will default to 'REQUESTED' as per model definition
                serializer.save(patient=user.patientprofile)
            else:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Patient profile not found for the current user.")
        # Removed Admin/Receptionist block for creating 'REQUESTED' appointments via this specific patient-facing endpoint.
        # They would typically update a 'REQUESTED' appointment to 'SCHEDULED' or use a different interface.
        else:
            # This case should ideally not be reached if permissions are set correctly for 'create' action
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to request an appointment.")

    @action(detail=True, methods=['patch'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        Allows a patient, admin, or receptionist to cancel an appointment.
        Sets the appointment status to 'Cancelled'.
        """
        appointment = self.get_object()
        
        # Check if appointment can be cancelled (e.g., not already completed or cancelled)
        if appointment.status in ['Completed', 'Cancelled']:
            return Response(
                {'detail': f'Appointment is already {appointment.status.lower()} and cannot be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment.status = 'Cancelled'
        appointment.save()
        serializer = self.get_serializer(appointment)
        return Response(serializer.data, status=status.HTTP_200_OK)

class MedicalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalRecordSerializer
    # queryset = MedicalRecord.objects.all() # Default queryset

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return MedicalRecord.objects.none()

        # For list actions, apply role-based filtering
        if self.action == 'list':
            if user.role == "ADMIN":
                return MedicalRecord.objects.all()
            elif user.role == "DOCTOR":
                try:
                    doctor = Doctor.objects.get(user=user)
                    return MedicalRecord.objects.filter(doctor=doctor)
                except Doctor.DoesNotExist:
                    return MedicalRecord.objects.none()
            elif user.role == "PATIENT":
                if hasattr(user, 'patientprofile'):
                    return MedicalRecord.objects.filter(patient=user.patientprofile)
                return MedicalRecord.objects.none()
            return MedicalRecord.objects.none()
        else:
            # For detail actions (retrieve, update, partial_update, destroy),
            # return all records. Object-level permissions will handle access control.
            # This allows get_object to find the record, so that has_object_permission
            # can correctly return a 403 if access is denied for that specific object.
            return MedicalRecord.objects.all()

    def get_permissions(self):
        if self.action == 'create':
            # Doctors or Admins can create medical records
            self.permission_classes = [IsDoctorRole | IsAdministratorRole]
        elif self.action == 'list':
            self.permission_classes = [permissions.IsAuthenticated] # Queryset handles filtering
        elif self.action == 'retrieve':
            # Admin, or associated Doctor, or associated Patient
            self.permission_classes = [IsAdministratorRole | IsDoctorOfRecord | IsPatientOfRecord]
        elif self.action in ['update', 'partial_update']:
            # Admin, or associated Doctor (who created/manages it)
            self.permission_classes = [IsAdministratorRole | IsDoctorOfRecord]
        elif self.action == 'destroy':
            self.permission_classes = [IsAdministratorRole]
        else:
            self.permission_classes = [IsAdministratorRole] # Default
        return [permission() for permission in self.permission_classes]

    def perform_create(self, serializer):
        user = self.request.user
        # Set the doctor field to the creating doctor
        if user.role == "DOCTOR":
            try:
                doctor = Doctor.objects.get(user=user)
                serializer.save(doctor=doctor)
            except Doctor.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Doctor profile not found for the current user.")
        elif user.role == "ADMIN":
            # Admin might need to specify the doctor if not themselves
            # For now, let's assume admin can create records, doctor field might be optional or set via payload
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create medical records.")

class PatientLabTestOrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing patient lab test orders.
    - Admins: Full CRUD.
    - Doctors: Can create orders, list/retrieve orders they made or for their patients, update orders they made.
    - Patients: Can list/retrieve their own orders.
    """
    serializer_class = PatientLabTestOrderSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return PatientLabTestOrder.objects.none()

        # For list actions, apply role-based filtering
        if self.action == 'list':
            if user.role == "ADMIN":
                return PatientLabTestOrder.objects.all()
            elif user.role == "DOCTOR":
                try:
                    doctor = Doctor.objects.get(user=user)
                    # Doctors can see orders they created
                    return PatientLabTestOrder.objects.filter(ordered_by_doctor=doctor)
                except Doctor.DoesNotExist:
                    return PatientLabTestOrder.objects.none()
            elif user.role == "PATIENT":
                if hasattr(user, 'patientprofile'):
                    return PatientLabTestOrder.objects.filter(patient=user.patientprofile)
                return PatientLabTestOrder.objects.none()
            # For other roles like RECEPTIONIST, return none for list action by default
            return PatientLabTestOrder.objects.none()
        else:
            # For detail actions (retrieve, update, partial_update, destroy),
            # return all records. Object-level permissions will handle access control.
            return PatientLabTestOrder.objects.all()

    def get_permissions(self):
        if self.action == 'create':
            # Admins or Doctors can create lab test orders
            self.permission_classes = [IsAdministratorRole | IsDoctorRole]
        elif self.action == 'list':
            # Permissions for list are now more aligned with get_queryset logic
            # Allowing Admin, Doctor, Patient to list (filtered by get_queryset)
            # Other authenticated roles (like Receptionist) will get an empty list due to get_queryset
            # If a 403 is strictly needed for Receptionist list, add specific role check here.
            self.permission_classes = [IsAdministratorRole | IsDoctorRole | IsPatientRole ]
        elif self.action == 'retrieve':
            # User must be authenticated, and then be Admin, or the Doctor who ordered, or the Patient who owns the order
            self.permission_classes = [permissions.IsAuthenticated, (IsAdministratorRole | IsDoctorWhoOrdered | IsPatientOwnerOfOrder)]
        elif self.action in ['update', 'partial_update']:
            # User must be authenticated, and then be Admin, or the Doctor who ordered
            self.permission_classes = [permissions.IsAuthenticated, (IsAdministratorRole | IsDoctorWhoOrdered)]
        elif self.action == 'destroy':
            # User must be authenticated, and then be Admin (destroy is often more restrictive)
            self.permission_classes = [permissions.IsAuthenticated, IsAdministratorRole]
        else:
            self.permission_classes = [IsAdministratorRole] # Default
        return [permission() for permission in self.permission_classes]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == "DOCTOR":
            try:
                doctor = Doctor.objects.get(user=user)
                serializer.save(ordered_by_doctor=doctor)
            except Doctor.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Doctor profile not found for the current user.")
        elif user.role == "ADMIN" or user.role == "RECEPTIONIST":
            # Admin may create on behalf of a doctor
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create lab test orders.")
