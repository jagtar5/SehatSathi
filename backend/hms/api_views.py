from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Patient, Appointment, Doctor, Receptionist
from .serializers import PatientSerializer, AppointmentSerializer, UserSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user_type = request.data.get('userType')

    if not username or not password:
        return Response({'error': 'Please provide both username and password'},
                      status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)

    if user is not None:
        # Check user type matches
        if user_type == 'Doctor' and hasattr(user, 'doctor'):
            login(request, user)
            # Get or create token
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'fullName': f"Dr. {user.first_name} {user.last_name}",
                'userType': 'Doctor',
                'token': token.key
            })
        elif user_type == 'Patient' and hasattr(user, 'patient'):
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'fullName': f"{user.first_name} {user.last_name}",
                'userType': 'Patient',
                'token': token.key
            })
        elif user_type == 'Receptionist' and hasattr(user, 'receptionist'):
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'fullName': f"{user.first_name} {user.last_name}",
                'userType': 'Receptionist',
                'token': token.key
            })
        elif user_type == 'Admin' and user.is_staff:
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'fullName': f"{user.first_name} {user.last_name}",
                'userType': 'Admin',
                'token': token.key
            })
        else:
            return Response({'error': 'Invalid user type for this account'},
                          status=status.HTTP_403_FORBIDDEN)
    else:
        return Response({'error': 'Invalid credentials'},
                      status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def logout_view(request):
    # Delete the token
    if hasattr(request.user, 'auth_token'):
        request.user.auth_token.delete()
    logout(request)
    return Response({'message': 'Successfully logged out'},
                   status=status.HTTP_200_OK)

// ... existing code ...

@api_view(['GET'])
def user_info(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'},
                      status=status.HTTP_401_UNAUTHORIZED)
    
    user_data = {
        'username': request.user.username,
        'fullName': f"{request.user.first_name} {request.user.last_name}",
    }
    
    # Determine user type
    if hasattr(request.user, 'doctor'):
        user_data['userType'] = 'Doctor'
    elif hasattr(request.user, 'patient'):
        user_data['userType'] = 'Patient'
    elif hasattr(request.user, 'receptionist'):
        user_data['userType'] = 'Receptionist'
    elif request.user.is_staff:
        user_data['userType'] = 'Admin'
    
    return Response(user_data)
