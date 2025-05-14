from rest_framework import serializers
from django.contrib.auth.models import User
from patient_app.models import PatientProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class PatientRegistrationSerializer(serializers.Serializer):
    # User account fields
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    
    # Patient profile fields
    date_of_birth = serializers.DateField()
    gender = serializers.ChoiceField(choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')])
    contact_number = serializers.CharField(max_length=15)
    address = serializers.CharField()
    
    def create(self, validated_data):
        # Create User instance
        user_data = {
            'username': validated_data.pop('username'),
            'password': validated_data.pop('password'),
            'email': validated_data.pop('email', ''),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name')
        }
        
        user = User.objects.create_user(
            username=user_data['username'],
            email=user_data['email'],
            password=user_data['password'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name']
        )
        
        # Create PatientProfile instance
        patient = PatientProfile.objects.create(
            user=user,
            date_of_birth=validated_data.get('date_of_birth'),
            address=validated_data.get('address'),
            contact_number=validated_data.get('contact_number')
        )
        
        return patient
    
    def to_representation(self, instance):
        # Return the registered patient data
        user_data = {
            'id': instance.user.id,
            'username': instance.user.username,
            'email': instance.user.email,
            'first_name': instance.user.first_name,
            'last_name': instance.user.last_name
        }
        
        patient_data = {
            'date_of_birth': instance.date_of_birth,
            'address': instance.address,
            'contact_number': instance.contact_number
        }
        
        return {**user_data, **patient_data}

class BillSerializer(serializers.Serializer):
    # This is a placeholder. In a real implementation, you would create a Bill model
    # and use a ModelSerializer instead.
    patient_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField()
    date = serializers.DateField()
    status = serializers.ChoiceField(choices=[
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled')
    ])
    
    def create(self, validated_data):
        # In a real implementation, you would create a Bill model instance here
        return validated_data 