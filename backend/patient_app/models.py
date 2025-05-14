from django.db import models
from django.contrib.auth.models import User
from hms.models import Doctor, LabTestOrder  # Updated to use the actual models from hms

class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    gender = models.CharField(
        max_length=10, 
        choices=[
            ('Male', 'Male'), 
            ('Female', 'Female'), 
            ('Other', 'Other'),
            ('M', 'Male'),    # For backward compatibility
            ('F', 'Female'),  # For backward compatibility
            ('O', 'Other')    # For backward compatibility
        ], 
        blank=True, 
        null=True
    )
    # Add other patient-specific fields here if needed, e.g., blood_group, medical_history_summary

    def __str__(self):
        return f"Patient: {self.user.first_name} {self.user.last_name} (Reg: {self.user.username})"

class Appointment(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='patient_appointments')
    appointment_datetime = models.DateTimeField()
    reason = models.TextField(blank=True, null=True)
    STATUS_CHOICES = (
        ('REQUESTED', 'Requested'), # New status
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REQUESTED') # Changed default
    # Add created_at and updated_at fields for tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Appointment for {self.patient.user.username} with Dr. {self.doctor.last_name} on {self.appointment_datetime.strftime('%Y-%m-%d %H:%M')}"

class MedicalRecord(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='medical_records')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_medical_records') # Doctor who created/updated
    record_type = models.CharField(max_length=100, help_text="e.g., Consultation, Lab Report, Prescription") # Type of record
    description = models.TextField()
    document = models.FileField(upload_to='medical_records/', blank=True, null=True) # For uploading reports, images, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Record for {self.patient.user.username} - {self.record_type} ({self.created_at.strftime('%Y-%m-%d')})"

class PatientLabTestOrder(models.Model):
    TEST_ORDER_STATUS_CHOICES = [
        ('PENDING_SAMPLE', 'Pending Sample Collection'),
        ('SAMPLE_COLLECTED', 'Sample Collected'),
        ('IN_PROGRESS', 'In Progress'),
        ('PENDING_REVIEW', 'Pending Review'), # Results are ready, doctor needs to review
        ('COMPLETED', 'Completed & Reviewed'),
        ('CANCELLED', 'Cancelled'),
    ]

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='lab_test_orders')
    ordered_by_doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='lab_tests_ordered')
    # If an appointment is directly associated with this lab order
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='lab_test_orders')
    
    # Instead of using LabTestDefinition which doesn't exist, use a simple CharField
    test_name = models.CharField(max_length=100)
    
    order_datetime = models.DateTimeField(auto_now_add=True)
    # Date when the sample was actually collected, can be different from order_datetime
    sample_collection_datetime = models.DateTimeField(null=True, blank=True)
    # Date when results are expected or were ready
    results_expected_datetime = models.DateTimeField(null=True, blank=True)
    results_ready_datetime = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=TEST_ORDER_STATUS_CHOICES, default='PENDING_SAMPLE')
    result_summary = models.TextField(blank=True, null=True, help_text="Brief summary of results, if applicable.")
    # Could be a link to a more detailed record in MedicalRecord or a direct file upload
    result_document = models.FileField(upload_to='lab_results/', blank=True, null=True) 
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Actual cost, might differ from default.")
    notes_by_doctor = models.TextField(blank=True, null=True, help_text="Instructions or notes from the doctor regarding this test.")
    # notes_by_lab = models.TextField(blank=True, null=True, help_text="Notes from the lab technician.")

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Lab Test '{self.test_name}' for {self.patient.user.username} - Status: {self.get_status_display()}"

    class Meta:
        ordering = ['-order_datetime']
