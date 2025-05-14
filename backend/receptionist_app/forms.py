from django import forms
from patient_app.models import PatientProfile
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

class PatientRegistrationForm(forms.ModelForm):
    """Form for patient registration through receptionist"""
    # User account fields
    username = forms.CharField(max_length=150, help_text="Required. Username for patient login.")
    password = forms.CharField(widget=forms.PasswordInput, help_text="Required. Password for patient login.")
    email = forms.EmailField(required=False, help_text="Optional. Patient's email address.")
    first_name = forms.CharField(max_length=150, help_text="Patient's first name.")
    last_name = forms.CharField(max_length=150, help_text="Patient's last name.")
    
    # Additional patient fields (these should match fields in the PatientProfile model)
    date_of_birth = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}), 
                                   help_text="Patient's date of birth.")
    gender = forms.ChoiceField(choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], 
                              help_text="Patient's gender.")
    contact_number = forms.CharField(max_length=15, help_text="Patient's contact number.")
    address = forms.CharField(widget=forms.Textarea, help_text="Patient's address.")
    
    class Meta:
        model = PatientProfile
        fields = ['date_of_birth', 'contact_number', 'address']
        
    def save(self, commit=True):
        # Create User instance first
        user = User.objects.create_user(
            username=self.cleaned_data['username'],
            password=self.cleaned_data['password'],
            email=self.cleaned_data['email'],
            first_name=self.cleaned_data['first_name'],
            last_name=self.cleaned_data['last_name']
        )
        
        # Create and save PatientProfile instance
        patient = super().save(commit=False)
        patient.user = user
        
        if commit:
            patient.save()
            
        return patient 