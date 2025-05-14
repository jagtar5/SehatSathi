from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date # Added date
from patient.models import Appointment # Corrected import
from administrator.models import SystemLog # Corrected import

class Command(BaseCommand):
    help = 'Sends appointment reminders to patients for appointments scheduled for the next day.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulates sending reminders without actually sending them or logging to SystemLog.',
        )
        parser.add_argument(
            '--date',
            type=str,
            help='Specify a date (YYYY-MM-DD) to send reminders for, instead of tomorrow. Useful for testing.'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        specified_date_str = options['date']
        
        reminders_sent_count = 0
        appointments_found_count = 0

        if specified_date_str:
            try:
                target_date = date.fromisoformat(specified_date_str)
                self.stdout.write(self.style.NOTICE(f"Using specified date for reminders: {target_date.strftime('%Y-%m-%d')}"))
            except ValueError:
                self.stderr.write(self.style.ERROR("Invalid date format. Please use YYYY-MM-DD."))
                return
        else:
            target_date = timezone.localdate() + timedelta(days=1)
            self.stdout.write(self.style.NOTICE(f"Checking for appointments on: {target_date.strftime('%Y-%m-%d')} (Tomorrow)"))

        # Query for appointments scheduled for the target_date and are still 'SCHEDULED'
        appointments_to_remind = Appointment.objects.filter(
            appointment_datetime__date=target_date,
            status='SCHEDULED'
        ).select_related('patient__user', 'doctor__user') # Optimize query

        appointments_found_count = appointments_to_remind.count()

        if not appointments_to_remind.exists():
            self.stdout.write(self.style.SUCCESS(f"No appointments found for {target_date.strftime('%Y-%m-%d')} that require reminders."))
            return

        self.stdout.write(f"Found {appointments_found_count} appointments for {target_date.strftime('%Y-%m-%d')}.")

        for appointment in appointments_to_remind:
            patient_name = appointment.patient.user.get_full_name() or appointment.patient.user.username
            doctor_name = f"Dr. {appointment.doctor.user.last_name}"
            appointment_time = appointment.appointment_datetime.strftime('%I:%M %p')
            
            reminder_message = (
                f"Reminder for {patient_name}: Appointment with {doctor_name} "
                f"on {target_date.strftime('%A, %B %d, %Y')} at {appointment_time}."
            )

            if dry_run:
                self.stdout.write(f"[DRY RUN] Would send: {reminder_message}")
            else:
                # Actual sending logic (e.g., email) would go here
                # For now, we just print to stdout as if it were sent
                self.stdout.write(self.style.SUCCESS(f"SENT: {reminder_message}"))
                
                # Log the reminder action
                log_description = (
                    f"Sent appointment reminder for appointment ID {appointment.id} "
                    f"(Patient: {appointment.patient.user.username}, "
                    f"Doctor: {appointment.doctor.user.username}, "
                    f"Time: {appointment.appointment_datetime.strftime('%Y-%m-%d %H:%M')})"
                )
                try:
                    SystemLog.objects.create(
                        user=None, # System action, no specific user initiated this directly
                        level='INFO', # Corrected: Use 'level' field
                        message=log_description # Corrected: Use 'message' field
                    )
                    reminders_sent_count += 1
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"Failed to log reminder for appointment ID {appointment.id}: {e}"))
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"Dry run complete. Would have processed {appointments_found_count} appointments."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Appointment reminder process finished. {reminders_sent_count} reminders logged."))
