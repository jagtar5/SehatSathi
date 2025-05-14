from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User, Group
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .forms import (
    AdminPatientRegistrationForm, 
    AdminDoctorRegistrationForm, 
    AdminReceptionistRegistrationForm
)
from .serializers import (
    AdminPatientRegistrationSerializer,
    AdminDoctorRegistrationSerializer,
    AdminReceptionistRegistrationSerializer
)

# Helper function to check if user is admin
def is_admin(user):
    return user.is_staff or user.is_superuser

# Web views for admin to register users
@login_required
@user_passes_test(is_admin)
def admin_register_patient_view(request):
    if request.method == 'POST':
        form = AdminPatientRegistrationForm(request.POST)
        if form.is_valid():
            patient = form.save()
            # Optional: Add user to 'Patient' group if you have it
            try:
                patient_group = Group.objects.get(name='Patient')
                patient.user.groups.add(patient_group)
            except Group.DoesNotExist:
                pass  # If group doesn't exist, just continue
                
            messages.success(request, f"Patient {patient.user.first_name} {patient.user.last_name} registered successfully with username: {patient.user.username}")
            return redirect('admin_app:admin_register_patient')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = AdminPatientRegistrationForm()
    
    return render(request, 'admin_app/register_patient.html', {
        'form': form,
        'title': 'Register Patient'
    })

@login_required
@user_passes_test(is_admin)
def admin_register_doctor_view(request):
    if request.method == 'POST':
        form = AdminDoctorRegistrationForm(request.POST)
        if form.is_valid():
            doctor = form.save()
            # Optional: Add user to 'Doctor' group if you have it
            try:
                doctor_group = Group.objects.get(name='Doctor')
                doctor.user.groups.add(doctor_group)
            except Group.DoesNotExist:
                pass  # If group doesn't exist, just continue
                
            messages.success(request, f"Doctor {doctor.first_name} {doctor.last_name} registered successfully with username: {doctor.user.username}")
            return redirect('admin_app:admin_register_doctor')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = AdminDoctorRegistrationForm()
    
    return render(request, 'admin_app/register_doctor.html', {
        'form': form,
        'title': 'Register Doctor'
    })

@login_required
@user_passes_test(is_admin)
def admin_register_receptionist_view(request):
    if request.method == 'POST':
        form = AdminReceptionistRegistrationForm(request.POST)
        if form.is_valid():
            receptionist = form.save()
            # Optional: Add user to 'Receptionist' group if you have it
            try:
                receptionist_group = Group.objects.get(name='Receptionist')
                receptionist.user.groups.add(receptionist_group)
            except Group.DoesNotExist:
                pass  # If group doesn't exist, just continue
                
            messages.success(request, f"Receptionist {receptionist.user.first_name} {receptionist.user.last_name} registered successfully with username: {receptionist.user.username}")
            return redirect('admin_app:admin_register_receptionist')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = AdminReceptionistRegistrationForm()
    
    return render(request, 'admin_app/register_receptionist.html', {
        'form': form,
        'title': 'Register Receptionist'
    })

# API views for admin to register users
@csrf_exempt  # Apply csrf_exempt first
@api_view(['POST'])
def admin_api_register_patient(request):
    """Register a new patient and create associated user account"""
    try:
        print("Patient registration request data:", request.data)
        print("Request headers:", {k: v for k, v in request.headers.items()})
        print("Request cookies:", request.COOKIES)
        print("Request method:", request.method)
        
        # Check for existing username to provide a clear error
        username = request.data.get('username', '')
        if username and User.objects.filter(username=username).exists():
            return Response({
                'status': 'error',
                'message': 'Username already exists',
                'errors': {'username': ['This username is already taken. Please choose another one.']}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate gender field explicitly to avoid database errors
        gender = request.data.get('gender', '')
        if gender not in ['Male', 'Female', 'Other', 'M', 'F', 'O']:
            return Response({
                'status': 'error',
                'message': 'Invalid gender value',
                'errors': {'gender': [f"Gender must be 'Male', 'Female', or 'Other'. Got '{gender}'"]}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = AdminPatientRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                patient = serializer.save()
                print(f"Patient registration successful: {patient.user.username}")
                
                # Optional: Add user to 'Patient' group if you have it
                try:
                    patient_group = Group.objects.get(name='Patient')
                    patient.user.groups.add(patient_group)
                except Group.DoesNotExist:
                    pass  # If group doesn't exist, just continue
                
                return Response({
                    'status': 'success',
                    'message': f"Patient registered successfully with username: {patient.user.username}",
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                import traceback
                print(f"Exception during patient save: {str(e)}")
                print(traceback.format_exc())
                return Response({
                    'status': 'error',
                    'message': 'Server error during patient creation',
                    'detail': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Print validation errors for debugging
        print("Patient validation errors:", serializer.errors)
        
        return Response({
            'status': 'error',
            'message': 'Invalid data provided',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        print(f"Exception in patient registration: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'status': 'error',
            'message': 'Server error during registration',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@csrf_exempt
# Temporarily removed authentication for testing
# @permission_classes([IsAuthenticated, IsAdminUser])
def admin_api_register_doctor(request):
    try:
        print("Doctor registration request data:", request.data)
        serializer = AdminDoctorRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            doctor = serializer.save()
            # Optional: Add user to 'Doctor' group if you have it
            try:
                doctor_group = Group.objects.get(name='Doctor')
                doctor.user.groups.add(doctor_group)
            except Group.DoesNotExist:
                pass  # If group doesn't exist, just continue
                
            return Response({
                'status': 'success',
                'message': f"Doctor registered successfully with username: {doctor.user.username}",
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        # Print validation errors for debugging
        print("Validation errors:", serializer.errors)
        
        return Response({
            'status': 'error',
            'message': 'Invalid data provided',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Exception in doctor registration: {str(e)}")
        return Response({
            'status': 'error',
            'message': 'Server error during registration',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@csrf_exempt
# Temporarily removed authentication for testing
# @permission_classes([IsAuthenticated, IsAdminUser])
def admin_api_register_receptionist(request):
    try:
        print("Receptionist registration request data:", request.data)
        serializer = AdminReceptionistRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            receptionist = serializer.save()
            # Optional: Add user to 'Receptionist' group if you have it
            try:
                receptionist_group = Group.objects.get(name='Receptionist')
                receptionist.user.groups.add(receptionist_group)
            except Group.DoesNotExist:
                pass  # If group doesn't exist, just continue
                
            return Response({
                'status': 'success',
                'message': f"Receptionist registered successfully with username: {receptionist.user.username}",
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        # Print validation errors for debugging
        print("Receptionist validation errors:", serializer.errors)
        
        return Response({
            'status': 'error',
            'message': 'Invalid data provided',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Exception in receptionist registration: {str(e)}")
        return Response({
            'status': 'error',
            'message': 'Server error during registration',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Dashboard views
@login_required
@user_passes_test(is_admin)
def system_statistics(request):
    """
    View for displaying system statistics in the admin dashboard
    """
    # Here you would typically gather statistics data
    # For now, we'll just render the template
    return render(request, 'admin_app/hms_dashboard.html', {
        'active_tab': 'statistics',
        'page_title': 'System Statistics'
    })

@login_required
@user_passes_test(is_admin)
def system_logs(request):
    """
    View for displaying system logs in the admin dashboard
    """
    # Here you would typically gather log data
    # For now, we'll just render the template
    return render(request, 'admin_app/hms_dashboard.html', {
        'active_tab': 'logs',
        'page_title': 'System Logs'
    })

@csrf_exempt
def patient_register_no_csrf(request):
    """
    Special endpoint for patient registration with no CSRF protection for frontend compatibility.
    This function handles the POST request directly without DRF's APIView wrappers.
    """
    if request.method != 'POST':
        return JsonResponse({
            'status': 'error',
            'message': 'Only POST method is allowed'
        }, status=405)
    
    try:
        print("CSRF-free patient registration endpoint called")
        print("Request headers:", {k: v for k, v in request.headers.items()})
        
        # First, try a raw SQL ALTER TABLE to fix the gender column
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                # Check the current column definition
                cursor.execute("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'hms_patient' AND column_name = 'gender';")
                column_info = cursor.fetchall()
                print("Current gender column definition:", column_info)
                
                # Only try to alter if it's varchar(1)
                if column_info and len(column_info) > 0:
                    col, dtype, length = column_info[0]
                    if dtype == 'character varying' and length == 1:
                        # Try to alter the column if needed
                        print("Altering gender column from varchar(1) to varchar(10)...")
                        cursor.execute("ALTER TABLE hms_patient ALTER COLUMN gender TYPE varchar(10);")
                        print("Successfully altered gender column to varchar(10)")
                    else:
                        print(f"No need to alter gender column - current type: {dtype}({length})")
                else:
                    print("Could not find gender column in hms_patient table")
        except Exception as e:
            print("Error altering gender column:", str(e))
            print("Will attempt to use single-letter gender codes as fallback")
        
        # Parse JSON body
        import json
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON in request body'
            }, status=400)
        
        print("Patient registration request data:", data)
        
        # Check for existing username
        username = data.get('username', '')
        if username and User.objects.filter(username=username).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Username already exists',
                'errors': {'username': ['This username is already taken. Please choose another one.']}
            }, status=400)
        
        # Validate gender field
        gender = data.get('gender', '')
        if gender not in ['Male', 'Female', 'Other', 'M', 'F', 'O']:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid gender value',
                'errors': {'gender': [f"Gender must be 'Male', 'Female', or 'Other'. Got '{gender}'"]}
            }, status=400)
        
        # Use our existing serializer for validation and creation
        serializer = AdminPatientRegistrationSerializer(data=data)
        if serializer.is_valid():
            try:
                patient = serializer.save()
                print(f"Patient registration successful: {patient.user.username}")
                
                # Optional: Add user to 'Patient' group if you have it
                try:
                    patient_group = Group.objects.get(name='Patient')
                    patient.user.groups.add(patient_group)
                except Group.DoesNotExist:
                    pass  # If group doesn't exist, just continue
                
                return JsonResponse({
                    'status': 'success',
                    'message': f"Patient registered successfully with username: {patient.user.username}",
                    'data': serializer.data
                }, status=201)
            except Exception as e:
                import traceback
                print(f"Exception during patient save: {str(e)}")
                print(traceback.format_exc())
                return JsonResponse({
                    'status': 'error',
                    'message': 'Server error during patient creation',
                    'detail': str(e)
                }, status=500)
        
        # Return validation errors
        print("Patient validation errors:", serializer.errors)
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid data provided',
            'errors': serializer.errors
        }, status=400)
    
    except Exception as e:
        import traceback
        print(f"Exception in patient registration: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'status': 'error',
            'message': 'Server error during registration',
            'detail': str(e)
        }, status=500)

@csrf_exempt
def doctor_register_no_csrf(request):
    """
    Special endpoint for doctor registration with no CSRF protection for frontend compatibility.
    This function handles the POST request directly without DRF's APIView wrappers.
    """
    if request.method != 'POST':
        return JsonResponse({
            'status': 'error',
            'message': 'Only POST method is allowed'
        }, status=405)
    
    try:
        print("CSRF-free doctor registration endpoint called")
        print("Request headers:", {k: v for k, v in request.headers.items()})
        
        # Parse JSON body
        import json
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON in request body'
            }, status=400)
        
        print("Doctor registration request data:", data)
        
        # Check for existing username
        username = data.get('username', '')
        if username and User.objects.filter(username=username).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Username already exists',
                'errors': {'username': ['This username is already taken. Please choose another one.']}
            }, status=400)
        
        # Use our existing serializer for validation and creation
        serializer = AdminDoctorRegistrationSerializer(data=data)
        if serializer.is_valid():
            try:
                doctor = serializer.save()
                print(f"Doctor registration successful: {doctor.user.username}")
                
                # Optional: Add user to 'Doctor' group if you have it
                try:
                    doctor_group = Group.objects.get(name='Doctor')
                    doctor.user.groups.add(doctor_group)
                except Group.DoesNotExist:
                    pass  # If group doesn't exist, just continue
                
                return JsonResponse({
                    'status': 'success',
                    'message': f"Doctor registered successfully with username: {doctor.user.username}",
                    'data': serializer.data
                }, status=201)
            except Exception as e:
                import traceback
                print(f"Exception during doctor save: {str(e)}")
                print(traceback.format_exc())
                return JsonResponse({
                    'status': 'error',
                    'message': 'Server error during doctor creation',
                    'detail': str(e)
                }, status=500)
        
        # Return validation errors
        print("Doctor validation errors:", serializer.errors)
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid data provided',
            'errors': serializer.errors
        }, status=400)
    
    except Exception as e:
        import traceback
        print(f"Exception in doctor registration: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'status': 'error',
            'message': 'Server error during registration',
            'detail': str(e)
        }, status=500)

@csrf_exempt
def receptionist_register_no_csrf(request):
    """
    Special endpoint for receptionist registration with no CSRF protection for frontend compatibility.
    This function handles the POST request directly without DRF's APIView wrappers.
    """
    if request.method != 'POST':
        return JsonResponse({
            'status': 'error',
            'message': 'Only POST method is allowed'
        }, status=405)
    
    try:
        print("CSRF-free receptionist registration endpoint called")
        print("Request headers:", {k: v for k, v in request.headers.items()})
        
        # Parse JSON body
        import json
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON in request body'
            }, status=400)
        
        print("Receptionist registration request data:", data)
        
        # Check for existing username
        username = data.get('username', '')
        if username and User.objects.filter(username=username).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Username already exists',
                'errors': {'username': ['This username is already taken. Please choose another one.']}
            }, status=400)
        
        # Use our existing serializer for validation
        serializer = AdminReceptionistRegistrationSerializer(data=data)
        if serializer.is_valid():
            try:
                # Create a user with minimal information
                user = User.objects.create_user(
                    username=data['username'],
                    password=data['password'],
                    email=data.get('email', ''),
                    # Only store username/email in auth_user, not personal details
                    first_name='',
                    last_name=''
                )
                
                print(f"User created: {user.username}")
                
                # Create HMS Receptionist record with all the details
                from hms.models import Receptionist as HMSReceptionist
                try:
                    hms_receptionist = HMSReceptionist.objects.create(
                        user=user,
                        first_name=data.get('first_name', ''),
                        last_name=data.get('last_name', ''),
                        contact_number=data.get('contact_number', ''),
                        email=data.get('email', ''),
                        address=data.get('address', ''),
                        date_of_birth=data.get('date_of_birth')
                    )
                    print(f"Created HMS Receptionist: {hms_receptionist.receptionist_id} - {hms_receptionist.first_name} {hms_receptionist.last_name}")
                except Exception as e:
                    import traceback
                    print(f"ERROR creating HMS Receptionist: {str(e)}")
                    print(traceback.format_exc())
                    # If HMS Receptionist creation fails, delete the user
                    user.delete()
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Error creating receptionist record',
                        'detail': str(e)
                    }, status=500)
                
                # Also create the receptionist_app Receptionist for compatibility
                from receptionist_app.models import Receptionist
                app_receptionist = Receptionist.objects.create(
                    user=user,
                    contact_number=data.get('contact_number', ''),
                    address=data.get('address', ''),
                    date_of_birth=data.get('date_of_birth')
                )
                
                # Optional: Add user to 'Receptionist' group if you have it
                try:
                    from django.contrib.auth.models import Group
                    receptionist_group = Group.objects.get(name='Receptionist')
                    user.groups.add(receptionist_group)
                except Group.DoesNotExist:
                    pass  # If group doesn't exist, just continue
                
                # Prepare response data
                response_data = {
                    'id': hms_receptionist.receptionist_id,
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': hms_receptionist.first_name,
                    'last_name': hms_receptionist.last_name,
                    'contact_number': hms_receptionist.contact_number,
                    'address': hms_receptionist.address,
                    'date_of_birth': hms_receptionist.date_of_birth.isoformat() if hms_receptionist.date_of_birth else None,
                    'join_date': hms_receptionist.join_date.isoformat() if hms_receptionist.join_date else None,
                    'is_active': hms_receptionist.is_active
                }
                
                return JsonResponse({
                    'status': 'success',
                    'message': f"Receptionist registered successfully with username: {user.username}",
                    'data': response_data
                }, status=201)
            except Exception as e:
                import traceback
                print(f"Exception during receptionist save: {str(e)}")
                print(traceback.format_exc())
                return JsonResponse({
                    'status': 'error',
                    'message': 'Server error during receptionist creation',
                    'detail': str(e)
                }, status=500)
        
        # Return validation errors
        print("Receptionist validation errors:", serializer.errors)
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid data provided',
            'errors': serializer.errors
        }, status=400)
    
    except Exception as e:
        import traceback
        print(f"Exception in receptionist registration: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'status': 'error',
            'message': 'Server error during registration',
            'detail': str(e)
        }, status=500)
