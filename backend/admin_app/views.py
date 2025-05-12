from django.shortcuts import render
from django.db.models import Count, Avg, Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from hms.models import Doctor, Patient, Appointment, LabTestOrder
from datetime import datetime, timedelta

@api_view(['GET'])
def system_statistics(request):
    """
    Generate comprehensive system statistics for the admin dashboard.
    """
    # Basic counts
    statistics = {
        'total_doctors': Doctor.objects.count(),
        'total_patients': Patient.objects.count(),
        'total_appointments': Appointment.objects.count(),
        'total_lab_tests': LabTestOrder.objects.count(),
    }
    
    # Get current date for time-based filters
    today = datetime.now().date()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)
    
    # Appointments statistics
    statistics['appointments'] = {
        'today': Appointment.objects.filter(appointment_date__date=today).count(),
        'this_week': Appointment.objects.filter(appointment_date__date__gte=start_of_week).count(),
        'this_month': Appointment.objects.filter(appointment_date__date__gte=start_of_month).count(),
        'status_distribution': dict(Appointment.objects.values_list('status').annotate(count=Count('status')).order_by()),
    }
    
    # Department statistics (doctors per department)
    department_stats = Doctor.objects.values('department').annotate(
        count=Count('doctor_id')
    ).order_by('-count')
    statistics['departments'] = list(department_stats)
    
    # Lab test statistics
    lab_test_stats = LabTestOrder.objects.values('status').annotate(
        count=Count('id')
    ).order_by('-count')
    statistics['lab_tests'] = list(lab_test_stats)
    
    # Gender distribution of patients
    gender_stats = Patient.objects.values('gender').annotate(
        count=Count('patient_id')
    ).order_by('-count')
    statistics['patient_gender_distribution'] = list(gender_stats)
    
    # Recent patient registrations (trend over last 6 months)
    months_ago_6 = today - timedelta(days=180)
    recent_patients = []
    for i in range(6):
        month_start = months_ago_6 + timedelta(days=30*i)
        month_end = month_start + timedelta(days=30)
        count = Patient.objects.filter(
            registration_date__date__gte=month_start,
            registration_date__date__lt=month_end
        ).count()
        month_name = month_start.strftime("%b")
        recent_patients.append({
            'month': month_name,
            'count': count
        })
    statistics['patient_registration_trend'] = recent_patients
    
    return Response(statistics)

@api_view(['GET'])
def system_logs(request):
    """
    Get system logs for the admin dashboard.
    In a real implementation, this would fetch from a logging database or file.
    For demo purposes, we're generating mock logs.
    """
    # In a real system, you'd implement actual logging retrieval here
    # For now, we'll return mock log data
    
    logs = generate_mock_logs()
    
    # Filter logs by level if requested
    level_filter = request.query_params.get('level')
    if level_filter and level_filter != 'all':
        logs = [log for log in logs if log['level'] == level_filter]
    
    return Response(logs)

def generate_mock_logs(count=50):
    """Generate mock log entries for demonstration"""
    import random
    from datetime import datetime, timedelta
    
    levels = ['info', 'warning', 'error']
    sources = ['system', 'auth', 'database', 'api']
    messages = [
        'User login successful',
        'User login failed',
        'Database connection established',
        'Database query error',
        'API request received',
        'API request failed',
        'Patient record updated',
        'Doctor record created',
        'Appointment scheduled',
        'Appointment cancelled',
        'System backup completed',
        'File upload failed',
        'Email notification sent',
        'Password reset requested',
        'User session expired'
    ]
    
    logs = []
    now = datetime.now()
    
    for i in range(count):
        # Generate random timestamp within the last 7 days
        random_hours = random.randint(0, 7 * 24)
        timestamp = (now - timedelta(hours=random_hours)).isoformat()
        
        level = random.choice(levels)
        source = random.choice(sources)
        message = random.choice(messages)
        
        # Generate more specific details based on the message
        details = {}
        if 'login' in message:
            details['user'] = f'user{random.randint(1, 100)}'
            details['ip'] = f'192.168.1.{random.randint(1, 255)}'
        elif 'database' in message:
            details['query'] = 'SELECT * FROM table WHERE condition = value'
            details['duration'] = f'{random.randint(1, 500)}ms'
        elif 'record' in message:
            details['record_id'] = random.randint(1, 1000)
            details['changes'] = ['field1', 'field2']
        
        logs.append({
            'id': f'log-{i+1}',
            'timestamp': timestamp,
            'level': level,
            'source': source,
            'message': message,
            'details': details
        })
    
    # Sort by timestamp (newest first)
    logs.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return logs
