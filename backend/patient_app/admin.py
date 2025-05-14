from django.contrib import admin
from .models import PatientProfile, Appointment, MedicalRecord, PatientLabTestOrder

admin.site.register(PatientProfile)
admin.site.register(Appointment)
admin.site.register(MedicalRecord)
admin.site.register(PatientLabTestOrder)
