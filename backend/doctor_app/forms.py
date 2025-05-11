from django import forms
from hms.models import Doctor,LabTestOrder

class DoctorProfileForm(forms.ModelForm):
    class Meta:
        model = Doctor
        fields = ['first_name', 'last_name', 'specialization', 'department', 'contact_number', 'email']


class LabTestOrderForm(forms.ModelForm):
    class Meta:
        model = LabTestOrder
        fields = ['patient', 'test_name', 'notes']


