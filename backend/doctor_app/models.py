from django.db import models
from django.contrib.auth.models import User

# Create your models here.

# Add the DoctorSchedule model for availability
class DoctorSchedule(models.Model):
    DAY_CHOICES = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]
    
    schedule_id = models.AutoField(primary_key=True)
    doctor = models.ForeignKey('hms.Doctor', on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    max_appointments = models.IntegerField(default=10)
    is_available = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('doctor', 'day_of_week')
        
    def __str__(self):
        return f"{self.doctor.first_name} - {self.get_day_of_week_display()} ({self.start_time} - {self.end_time})"
