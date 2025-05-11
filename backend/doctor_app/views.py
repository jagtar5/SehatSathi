from django.shortcuts import render,redirect
from hms.models import Appointment,Patient,LabTestOrder  # Import the Appointment model
from django.contrib.auth.decorators import login_required # Import login_required
from .forms import DoctorProfileForm,LabTestOrderForm
from rest_framework import viewsets
from hms.models import Doctor
from .serializers import DoctorProfileSerializer, ScheduleSerializer

@login_required
def doctor_index(request):
    # Optional: redirect to profile or schedule
   return redirect('login')


@login_required 
def doctor_daily_schedule_view(request):
    """View to display a doctor's daily schedule (initially showing all appointments)."""
    appointments = Appointment.objects.all()  # Fetch all appointments for now
    context = {'appointments': appointments}
    return render(request, 'doctor_app/doctor_daily_schedule.html', context)

   

@login_required
def doctor_profile_view(request):
    # request.user is the logged-in User; .doctor is the linked Doctor profile
    doctor = request.user.doctor
    return render(request, 'doctor_app/doctor_profile.html', {'doctor': doctor})

@login_required
def doctor_patient_list(request):
    patients = Patient.objects.filter(appointments__doctor=request.user.doctor).distinct()
    return render(request, 'doctor_app/doctor_patient_list.html', {'patients': patients})


def edit_profile(request):
    doctor = request.user.doctor  # assumes one-to-one link between User and Doctor
    if request.method == 'POST':
        form = DoctorProfileForm(request.POST, instance=doctor)
        if form.is_valid():
            form.save()
            return redirect('doctor_app:doctor_profile')
    else:
        form = DoctorProfileForm(instance=doctor)
    return render(request, 'doctor_app/edit_profile.html', {'form': form})


@login_required
def order_lab_test(request):
    doctor = request.user.doctor
    if request.method == 'POST':
        form = LabTestOrderForm(request.POST)
        if form.is_valid():
            lab_order = form.save(commit=False)
            lab_order.doctor = doctor
            lab_order.save()
            return redirect('doctor_app:doctor_profile')
    else:
        form = LabTestOrderForm()
    return render(request, 'doctor_app/order_lab_test.html', {'form': form})

class DoctorProfileViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorProfileSerializer

class ScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleSerializer
    
    def get_queryset(self):
        return Appointment.objects.all().order_by('appointment_date')