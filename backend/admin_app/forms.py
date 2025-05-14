from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from patient_app.models import PatientProfile
from hms.models import Doctor
from receptionist_app.models import Receptionist

class AdminUserRegistrationForm(forms.ModelForm):
    """Base form for admin to register users with username and password"""
    username = forms.CharField(max_length=150, help_text="Required. Username for user login.")
    password = forms.CharField(widget=forms.PasswordInput, help_text="Required. Password for user login.")
    confirm_password = forms.CharField(widget=forms.PasswordInput, help_text="Enter the same password for verification.")
    email = forms.EmailField(required=True, help_text="User's email address.")
    first_name = forms.CharField(max_length=150, help_text="User's first name.")
    last_name = forms.CharField(max_length=150, help_text="User's last name.")
    
    class Meta:
        model = User
        fields = ['username', 'password', 'confirm_password', 'email', 'first_name', 'last_name']
    
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')
        
        if password and confirm_password and password != confirm_password:
            self.add_error('confirm_password', "Passwords don't match")
        
        username = cleaned_data.get('username')
        if username and User.objects.filter(username=username).exists():
            self.add_error('username', "This username is already taken.")
            
        return cleaned_data
    
    def create_user(self):
        """Create and return a User instance (without saving to database)"""
        user_data = {
            'username': self.cleaned_data['username'],
            'email': self.cleaned_data['email'],
            'first_name': self.cleaned_data['first_name'],
            'last_name': self.cleaned_data['last_name']
        }
        
        user = User(
            username=user_data['username'],
            email=user_data['email'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name']
        )
        user.set_password(self.cleaned_data['password'])
        return user

class AdminPatientRegistrationForm(AdminUserRegistrationForm):
    """Form for admin to register patients"""
    date_of_birth = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}), 
                                   help_text="Patient's date of birth.")
    gender = forms.ChoiceField(choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], 
                              help_text="Patient's gender.")
    contact_number = forms.CharField(max_length=15, required=False, help_text="Patient's contact number.")
    address = forms.CharField(widget=forms.Textarea, required=False, help_text="Patient's address.")
    
    class Meta:
        model = PatientProfile
        fields = AdminUserRegistrationForm.Meta.fields + ['date_of_birth', 'gender', 'contact_number', 'address']
    
    def save(self, commit=True):
        user = self.create_user()
        if commit:
            user.save()
        
        patient = PatientProfile(
            user=user,
            date_of_birth=self.cleaned_data.get('date_of_birth'),
            gender=self.cleaned_data.get('gender'),
            contact_number=self.cleaned_data.get('contact_number'),
            address=self.cleaned_data.get('address')
        )
        
        if commit:
            patient.save()
        
        return patient

class AdminDoctorRegistrationForm(AdminUserRegistrationForm):
    """Form for admin to register doctors"""
    doctor_id = forms.CharField(max_length=20, help_text="Doctor's ID/License number")
    specialization = forms.CharField(max_length=100, help_text="Doctor's specialization")
    department = forms.CharField(max_length=100, help_text="Doctor's department")
    contact_number = forms.CharField(max_length=15, required=False, help_text="Doctor's contact number")
    date_of_birth = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}), required=False,
                                   help_text="Doctor's date of birth")
    
    class Meta:
        model = Doctor
        fields = AdminUserRegistrationForm.Meta.fields + [
            'doctor_id', 'specialization', 'department', 
            'contact_number', 'date_of_birth'
        ]
    
    def save(self, commit=True):
        user = self.create_user()
        if commit:
            user.save()
        
        doctor = Doctor(
            user=user,
            first_name=user.first_name,
            last_name=user.last_name,
            specialization=self.cleaned_data['specialization'],
            department=self.cleaned_data['department'],
            contact_number=self.cleaned_data.get('contact_number')
        )
        
        if commit:
            doctor.save()
        
        return doctor

class AdminReceptionistRegistrationForm(AdminUserRegistrationForm):
    """Form for admin to register receptionists"""
    contact_number = forms.CharField(max_length=15, required=False, help_text="Receptionist's contact number")
    address = forms.CharField(widget=forms.Textarea, required=False, help_text="Receptionist's address")
    date_of_birth = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}), required=False,
                                   help_text="Receptionist's date of birth")
    
    class Meta:
        model = Receptionist
        fields = AdminUserRegistrationForm.Meta.fields + [
            'contact_number', 'address', 'date_of_birth'
        ]
    
    def save(self, commit=True):
        user = self.create_user()
        if commit:
            user.save()
        
        receptionist = Receptionist(
            user=user,
            contact_number=self.cleaned_data.get('contact_number'),
            address=self.cleaned_data.get('address'),
            date_of_birth=self.cleaned_data.get('date_of_birth')
        )
        
        if commit:
            receptionist.save()
        
        return receptionist 