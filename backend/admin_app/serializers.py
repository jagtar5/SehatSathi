from rest_framework import serializers
from django.contrib.auth.models import User
from patient_app.models import PatientProfile
from hms.models import Doctor, Patient
from receptionist_app.models import Receptionist

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class AdminUserRegistrationSerializer(serializers.Serializer):
    """Base serializer for admin to register users with username and password"""
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match."})
        
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
        
        return data
    
    def create_user(self, validated_data):
        """Create and return User instance"""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        return user

class AdminPatientRegistrationSerializer(AdminUserRegistrationSerializer):
    """Serializer for admin to register patients"""
    date_of_birth = serializers.DateField()
    gender = serializers.ChoiceField(choices=[
        ('Male', 'Male'), 
        ('Female', 'Female'), 
        ('Other', 'Other'),
        ('M', 'Male'),    # For backward compatibility
        ('F', 'Female'),  # For backward compatibility
        ('O', 'Other')    # For backward compatibility
    ])
    reg_num = serializers.CharField(max_length=20, required=True)
    contact_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    blood_group = serializers.CharField(max_length=5, required=False, allow_blank=True)
    medical_history = serializers.CharField(required=False, allow_blank=True)
    
    def create(self, validated_data):
        """Create User, PatientProfile, and HMS Patient"""
        # Remove confirm_password since it's not needed anymore
        validated_data.pop('confirm_password')
        
        # Extract extra fields that don't belong to User model
        blood_group = validated_data.pop('blood_group', '')
        medical_history = validated_data.pop('medical_history', '')
        reg_num = validated_data.pop('reg_num')
        date_of_birth = validated_data.pop('date_of_birth')
        gender = validated_data.pop('gender')
        contact_number = validated_data.pop('contact_number', '')
        address = validated_data.pop('address', '')
        
        print(f"Processing patient registration with gender: {gender}")
        
        # Standardize gender value to match HMS Patient model choices
        # Make sure gender is one of 'Male', 'Female', 'Other'
        if gender in ['M', 'm']:
            gender = 'Male'
        elif gender in ['F', 'f']:
            gender = 'Female'
        elif gender in ['O', 'o']:
            gender = 'Other'
        
        # Save basic user info for later
        first_name = validated_data.get('first_name')
        last_name = validated_data.get('last_name')
        email = validated_data.get('email')
        
        # Create User instance with remaining validated_data
        user = self.create_user(validated_data)
        
        # Create PatientProfile instance
        patient_profile = PatientProfile.objects.create(
            user=user,
            date_of_birth=date_of_birth,
            gender=gender,
            contact_number=contact_number,
            address=address
        )
        
        # Create HMS Patient instance
        from hms.models import Patient
        try:
            hms_patient = Patient.objects.create(
                reg_num=reg_num,
                first_name=first_name,
                last_name=last_name,
                gender=gender,
                date_of_birth=date_of_birth,
                contact_number=contact_number,
                email=email
            )
            print(f"Created HMS Patient: {hms_patient.patient_id} - {hms_patient.first_name} {hms_patient.last_name}")
        except Exception as e:
            print(f"ERROR creating HMS Patient: {str(e)}")
            # Log all field values for debugging
            print(f"reg_num: {reg_num}, first_name: {first_name}, last_name: {last_name}")
            print(f"gender: {gender}, date_of_birth: {date_of_birth}")
            print(f"contact_number: {contact_number}, email: {email}")
            # Still return the patient_profile even if HMS Patient creation fails
        
        print(f"Created User {user.id}, PatientProfile {patient_profile.user_id}")
        
        return patient_profile
    
    def to_representation(self, instance):
        """Return combined data from User, PatientProfile, and HMS Patient"""
        user_data = {
            'id': instance.user.id,
            'username': instance.user.username,
            'email': instance.user.email,
            'first_name': instance.user.first_name,
            'last_name': instance.user.last_name,
        }
        
        patient_data = {
            'patient_id': instance.pk,
            'date_of_birth': instance.date_of_birth,
            'gender': instance.gender,
            'contact_number': instance.contact_number,
            'address': instance.address
        }
        
        # Get the associated HMS Patient record
        try:
            # Try to find by reg_num using username, name match as fallback
            hms_patient = Patient.objects.get(
                reg_num=instance.user.username,
                first_name=instance.user.first_name,
                last_name=instance.user.last_name
            )
            patient_data['hms_patient_id'] = hms_patient.patient_id
            patient_data['reg_num'] = hms_patient.reg_num
        except Patient.DoesNotExist:
            try:
                # Try by name only as last resort
                hms_patient = Patient.objects.filter(
                    first_name=instance.user.first_name,
                    last_name=instance.user.last_name
                ).first()
                if hms_patient:
                    patient_data['hms_patient_id'] = hms_patient.patient_id
                    patient_data['reg_num'] = hms_patient.reg_num
                else:
                    patient_data['hms_patient_id'] = None
                    patient_data['reg_num'] = None
            except Exception as e:
                print(f"Error finding HMS Patient: {e}")
                patient_data['hms_patient_id'] = None
                patient_data['reg_num'] = None
        
        return {**user_data, **patient_data}

class AdminDoctorRegistrationSerializer(AdminUserRegistrationSerializer):
    """Serializer for admin to register doctors"""
    doctor_id = serializers.CharField(max_length=20, required=False)
    specialization = serializers.CharField(max_length=100)
    department = serializers.CharField(max_length=100)
    contact_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    
    def create(self, validated_data):
        # Remove confirm_password since it's not needed anymore
        validated_data.pop('confirm_password')
        
        # Create User instance
        user = self.create_user(validated_data)
        
        # Create Doctor instance
        doctor = Doctor.objects.create(
            user=user,
            first_name=user.first_name,  # Use the user's first_name
            last_name=user.last_name,    # Use the user's last_name
            specialization=validated_data['specialization'],
            department=validated_data['department'],
            contact_number=validated_data.get('contact_number', '')
        )
        
        return doctor
    
    def to_representation(self, instance):
        # Return user and doctor data
        user_data = {
            'id': instance.user.id,
            'username': instance.user.username,
            'email': instance.user.email,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
        }
        
        doctor_data = {
            'doctor_id': instance.doctor_id,
            'specialization': instance.specialization,
            'department': instance.department,
            'contact_number': instance.contact_number
        }
        
        # Add email if it exists in the Doctor model
        if hasattr(instance, 'email') and instance.email:
            doctor_data['email'] = instance.email
        
        return {**user_data, **doctor_data}

class AdminReceptionistRegistrationSerializer(AdminUserRegistrationSerializer):
    """Serializer for admin to register receptionists"""
    contact_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False)
    
    def create(self, validated_data):
        # Remove confirm_password since it's not needed anymore
        validated_data.pop('confirm_password')
        
        # Create User instance
        user = self.create_user(validated_data)
        
        # Create Receptionist instance
        receptionist = Receptionist.objects.create(
            user=user,
            contact_number=validated_data.get('contact_number', ''),
            address=validated_data.get('address', ''),
            date_of_birth=validated_data.get('date_of_birth')
        )
        
        return receptionist
    
    def to_representation(self, instance):
        # Return user and receptionist data
        user_data = {
            'id': instance.user.id,
            'username': instance.user.username,
            'email': instance.user.email,
            'first_name': instance.user.first_name,
            'last_name': instance.user.last_name,
        }
        
        receptionist_data = {
            'receptionist_id': instance.pk,
            'contact_number': instance.contact_number,
            'address': instance.address,
            'date_of_birth': instance.date_of_birth,
            'join_date': instance.join_date
        }
        
        return {**user_data, **receptionist_data} 