from django.contrib import admin
from .models import Patient, Doctor, Appointment, Billing,LabTestOrder
from auditlog.registry import auditlog
import csv
from django.http import HttpResponse
from django.urls import path
from django.shortcuts import render
from django.db.models import Count, Sum
from django.utils.html import format_html
from django.urls import reverse

# Auditlog registrations
auditlog.register(Patient)
auditlog.register(Appointment)

@admin.register(LabTestOrder)
class LabTestOrderAdmin(admin.ModelAdmin):
    list_display = ('test_name', 'patient', 'doctor', 'status', 'requested_at')
    list_filter = ('status', 'requested_at')
    actions = ['approve_tests', 'reject_tests']

    def approve_tests(self, request, queryset):
        updated = queryset.update(status='approved')
        self.message_user(request, f"{updated} test(s) approved.")
    approve_tests.short_description = "Approve selected lab tests"

    def reject_tests(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f"{updated} test(s) rejected.")
    reject_tests.short_description = "Reject selected lab tests"


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    change_list_template = 'admin/appointments_change_list.html'
    actions = ['export_as_csv', 'generate_report']
    
    def changelist_view(self, request, extra_context=None):
        # Add report generation URL to context
        extra_context = extra_context or {}
        extra_context['report_url'] = reverse('admin:appointment_report')
        return super().changelist_view(request, extra_context=extra_context)
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('report/', self.admin_site.admin_view(self.report_view), 
                 name='appointment_report'),
        ]
        return custom_urls + urls
    
    def report_view(self, request):
        # Generate comprehensive report data
        report_data = {
            'patients': Patient.objects.count(),
            'doctors': Doctor.objects.count(),
            'appointments': Appointment.objects.count(),
            'revenue': Billing.objects.aggregate(Sum('amount'))['amount__sum'] or 0,
            'appointments_by_status': list(
                Appointment.objects.values('status')
                .annotate(count=Count('status'))
                .order_by('-count')
            ),
            'top_doctors': list(
                Doctor.objects.annotate(appointment_count=Count('appointments'))
                .order_by('-appointment_count')[:5]
            ),
            'recent_bills': Billing.objects.select_related('patient')
                               .order_by('-bill_date')[:10]
        }
        return render(request, 'admin/appointment_report.html', report_data)
    
    def generate_report(self, request, queryset):
        # PDF generation would go here
        self.message_user(request, "Report generation started")
    generate_report.short_description = "Generate PDF report"

    def export_as_csv(self, request, queryset):
        # Your existing CSV export code
        pass

# Standard registrations
admin.site.register(Patient)
admin.site.register(Doctor)
admin.site.register(Billing)