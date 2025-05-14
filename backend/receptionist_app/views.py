from django.shortcuts import render, redirect
from .forms import PatientRegistrationForm
from django.contrib import messages # Import messages framework for feedback
from django.contrib.auth.decorators import login_required, permission_required # Import login_required
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .serializers import PatientRegistrationSerializer, BillSerializer

@login_required # Apply login_required decorator
@permission_required('hms.add_patient', raise_exception=True) # Require 'hms.add_patient' permission
def receptionist_patient_registration_view(request):
    """View for receptionists to register new patients, handling form submission."""
    if request.method == 'POST': # Check if the request is a POST request (form submission)
        form = PatientRegistrationForm(request.POST) # Create form instance with submitted data
        if form.is_valid(): # Validate the form data
            patient = form.save() # Save the form data to the database (creates a Patient object)
            messages.success(request, f"Patient '{patient.user.first_name} {patient.user.last_name}' registered successfully with username: {patient.user.username}") # Success message
            return redirect('receptionist_patient_registration') # Redirect to the same registration page (or another page if you prefer)
        else: # Form is invalid
            messages.error(request, "Please correct the errors below.") # Error message
            # Form will be re-rendered with errors automatically
    else: # Request is a GET request (initial form load)
        form = PatientRegistrationForm() # Create an empty form instance

    context = {'form': form}
    return render(request, 'receptionist_app/receptionist_patient_registration.html', context)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_patient_api(request):
    """API endpoint for patient registration by receptionist."""
    serializer = PatientRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        patient = serializer.save()
        return Response(
            {
                'status': 'success',
                'message': f"Patient registered successfully with username: {patient.user.username}",
                'data': serializer.data
            }, 
            status=status.HTTP_201_CREATED
        )
    return Response(
        {
            'status': 'error',
            'message': 'Invalid data provided',
            'errors': serializer.errors
        }, 
        status=status.HTTP_400_BAD_REQUEST
    )

class BillViewSet(viewsets.ViewSet):
    """
    ViewSet for billing operations.
    This is a placeholder implementation. In a real implementation, you would
    create a Bill model and use ModelViewSet instead.
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        # In a real implementation, you would query the database for bills
        # For now, return an empty list
        return Response([])

    def create(self, request):
        serializer = BillSerializer(data=request.data)
        if serializer.is_valid():
            # In a real implementation, you would save the bill to the database
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        # In a real implementation, you would query the database for the bill
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, pk=None):
        # In a real implementation, you would update the bill in the database
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, pk=None):
        # In a real implementation, you would delete the bill from the database
        return Response(status=status.HTTP_204_NO_CONTENT)