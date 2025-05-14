from django.db import models
from django.contrib.auth.models import User
from patient_app.models import PatientProfile

class Receptionist(models.Model):
    """
    Receptionist profile model linked to a Django User
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='receptionist')
    contact_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    join_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Receptionist: {self.user.first_name} {self.user.last_name}"

class Bill(models.Model):
    """
    Model to represent a bill/invoice in the system.
    This is a placeholder model for the BillViewSet to use.
    """
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='bills')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    date = models.DateField(auto_now_add=True)
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Bill #{self.id} - {self.patient.user.get_full_name()} - {self.amount}"
