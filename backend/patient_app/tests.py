from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from hms.models import Doctor
from .models import PatientProfile, Appointment, MedicalRecord, PatientLabTestOrder
from datetime import datetime, timedelta, timezone # Ensure timezone is imported for datetime.timezone.utc
# from .serializers import PatientProfileSerializer # Not directly needed

class PatientProfileReceptionistTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            username='testadmin_pp', password='password123', email='testadmin_pp@example.com', role='ADMIN'
        )
        cls.receptionist_user = User.objects.create_user(
            username='testrecep_pp', password='password123', email='testrecep_pp@example.com', role='RECEPTIONIST'
        )
        cls.patient_user_for_profile = User.objects.create_user(
            username='patientforprofile', password='password123', email='patient_pp@example.com', role='PATIENT'
        )
        cls.doctor_user_no_profile = User.objects.create_user( # User with non-patient role
            username='doctornoforprofile', password='password123', email='doctor_pp@example.com', role='DOCTOR'
        )

        cls.profile_list_create_url = reverse('patientprofile-list') # Make sure 'patientprofile-list' is correct

    def test_receptionist_can_create_patient_profile(self):
        self.client.force_authenticate(user=self.receptionist_user)
        data = {
            "user": self.patient_user_for_profile.pk,
            "date_of_birth": "1990-01-01",
            "address": "123 Main St",
            "contact_number": "555-1234"
        }
        response = self.client.post(self.profile_list_create_url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print("Receptionist create profile error:", response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PatientProfile.objects.filter(user=self.patient_user_for_profile).exists())
        profile = PatientProfile.objects.get(user=self.patient_user_for_profile)
        self.assertEqual(str(profile.date_of_birth), "1990-01-01")

    def test_receptionist_cannot_create_profile_for_non_patient_user(self):
        self.client.force_authenticate(user=self.receptionist_user)
        data = {
            "user": self.doctor_user_no_profile.pk, # Trying to create profile for a doctor
            "date_of_birth": "1985-05-05",
            "address": "456 Oak Ave",
            "contact_number": "555-5678"
        }
        response = self.client.post(self.profile_list_create_url, data, format='json')
        # This should fail at serializer validation because PatientProfileSerializer's
        # 'user' field queryset is filtered by role='PATIENT'
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("user", response.data) # Error should be related to the user field
        self.assertFalse(PatientProfile.objects.filter(user=self.doctor_user_no_profile).exists())

    def test_patient_cannot_create_patient_profile(self): # Assuming we want to restrict this
        self.client.force_authenticate(user=self.patient_user_for_profile)
        data = {
            "user": self.patient_user_for_profile.pk,
            "date_of_birth": "1990-01-01",
            "address": "123 Main St",
            "contact_number": "555-1234"
        }
        response = self.client.post(self.profile_list_create_url, data, format='json')
        # Based on current PatientProfileViewSet permissions, this should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from doctor.models import DoctorProfile, LabTestDefinition
from .models import PatientProfile, Appointment, MedicalRecord, PatientLabTestOrder
from datetime import datetime, timedelta, timezone # Ensure timezone is imported for datetime.timezone.utc
# Add new imports
from io import StringIO
from django.core.management import call_command
from django.utils import timezone as django_timezone 
from administrator.models import SystemLog

class PatientProfileAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            username='admin_patient_test', password='adminpassword', 
            email='admin_patient@example.com', role="ADMIN"
        )
        cls.patient_user_one_data = {
            "username": "patient_one_profile", "password": "password123", 
            "first_name": "Patient", "last_name": "One", "role": "PATIENT"
        }
        cls.patient_user_one = User.objects.create_user(**cls.patient_user_one_data)
        
        cls.patient_user_two_data = {
            "username": "patient_two_profile", "password": "password123", 
            "first_name": "Patient", "last_name": "Two", "role": "PATIENT"
        }
        cls.patient_user_two = User.objects.create_user(**cls.patient_user_two_data)

        cls.patient_profile_one = PatientProfile.objects.create(
            user=cls.patient_user_one, date_of_birth="2000-01-01", 
            address="123 Test St", contact_number="03001234567"
        )

        cls.list_create_url = reverse('patientprofile-list')
        cls.detail_url_one = reverse('patientprofile-detail', kwargs={'pk': cls.patient_profile_one.pk})

    def setUp(self):
        self.client.force_authenticate(user=self.admin_user)

    def test_admin_create_patient_profile(self):
        """Ensure ADMIN can create a patient profile for an existing PATIENT user."""
        data = {
            "user": self.patient_user_two.pk, 
            "date_of_birth": "1995-05-05", 
            "address": "456 New Ave", 
            "contact_number": "03112233445"
        }
        response = self.client.post(self.list_create_url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Admin Create Patient Profile Error: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PatientProfile.objects.count(), 2)
        self.assertTrue(PatientProfile.objects.filter(user=self.patient_user_two).exists())

    def test_admin_list_patient_profiles(self):
        """Ensure ADMIN can list all patient profiles."""
        # Create a second profile for patient_user_two
        PatientProfile.objects.create(user=self.patient_user_two, date_of_birth="1998-08-08")
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_admin_retrieve_patient_profile(self):
        """Ensure ADMIN can retrieve a specific patient profile."""
        response = self.client.get(self.detail_url_one)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_details']['id'], self.patient_user_one.pk) # Changed 'user' to 'user_details'['id']

    def test_admin_update_patient_profile(self):
        """Ensure ADMIN can update any patient profile."""
        update_data = {"address": "789 Updated Rd", "contact_number": "03334455667"}
        response = self.client.patch(self.detail_url_one, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.patient_profile_one.refresh_from_db()
        self.assertEqual(self.patient_profile_one.address, "789 Updated Rd")

    def test_admin_delete_patient_profile(self):
        """Ensure ADMIN can delete a patient profile."""
        response = self.client.delete(self.detail_url_one)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PatientProfile.objects.filter(pk=self.patient_profile_one.pk).exists())

    def test_patient_retrieve_own_profile(self):
        """Ensure PATIENT can retrieve their own profile."""
        self.client.force_authenticate(user=self.patient_user_one)
        response = self.client.get(self.detail_url_one)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_details']['id'], self.patient_user_one.pk) # Changed 'user' to 'user_details'['id']

    def test_patient_update_own_profile(self):
        """Ensure PATIENT can update their own profile."""
        self.client.force_authenticate(user=self.patient_user_one)
        update_data = {"address": "My New Home Updated"}
        response = self.client.patch(self.detail_url_one, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.patient_profile_one.refresh_from_db()
        self.assertEqual(self.patient_profile_one.address, "My New Home Updated")

    def test_patient_cannot_list_all_profiles(self):
        """Ensure PATIENT cannot list all patient profiles."""
        self.client.force_authenticate(user=self.patient_user_one)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_cannot_create_profile_via_endpoint(self):
        """Ensure PATIENT cannot create a patient profile (handled by Admin/System)."""
        self.client.force_authenticate(user=self.patient_user_one)
        data = {"user": self.patient_user_two.pk, "date_of_birth": "1990-01-01"}
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_patient_cannot_delete_own_profile_via_endpoint(self):
        """Ensure PATIENT cannot delete their own profile (handled by Admin)."""
        self.client.force_authenticate(user=self.patient_user_one)
        response = self.client.delete(self.detail_url_one)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_cannot_access_other_patient_profile(self):
        """Ensure PATIENT cannot retrieve or update another patient's profile."""
        other_profile = PatientProfile.objects.create(user=self.patient_user_two, date_of_birth="1999-09-09")
        other_detail_url = reverse('patientprofile-detail', kwargs={'pk': other_profile.pk})
        
        self.client.force_authenticate(user=self.patient_user_one)
        response_get = self.client.get(other_detail_url)
        self.assertEqual(response_get.status_code, status.HTTP_403_FORBIDDEN) # Or 404 if hidden
        
        response_patch = self.client.patch(other_detail_url, {"address": "Attempted Update"}, format='json')
        self.assertEqual(response_patch.status_code, status.HTTP_403_FORBIDDEN)


class AppointmentAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            username='admin_appt_test', password='adminpassword', 
            email='admin_appt@example.com', role="ADMIN"
        )
        cls.doctor_user = User.objects.create_user(
            username='doctor_appt_test', password='docpassword', 
            email='doc_appt@example.com', role="DOCTOR"
        )
        cls.doctor_profile = DoctorProfile.objects.create(
            user=cls.doctor_user, specialization="GP", department="General"
        )
        cls.patient_user = User.objects.create_user(
            username='patient_appt_test', password='patpassword', 
            email='pat_appt@example.com', role="PATIENT"
        )
        cls.patient_profile = PatientProfile.objects.create(
            user=cls.patient_user, date_of_birth="1990-01-01"
        )
        
        cls.other_patient_user = User.objects.create_user(
            username='otherpat_appt', password='password', 
            email='otherpat_appt@example.com', role="PATIENT")
        cls.other_patient_profile = PatientProfile.objects.create(user=cls.other_patient_user, date_of_birth="1992-02-02")

        cls.receptionist_user = User.objects.create_user(
            username='recep_appt_test', password='recpassword', 
            email='rec_appt@example.com', role="RECEPTIONIST"
        )

        # Use django_timezone for consistency if it's available and preferred,
        # otherwise ensure datetime.timezone is properly imported and used.
        # The original error was NameError for 'timezone', implying datetime.timezone was intended.
        cls.appointment_time = django_timezone.now() + timedelta(days=5) # Corrected to use django_timezone.now() or ensure datetime.timezone.utc is used
        # If using django_timezone.now(), it's already aware.
        # If using datetime.now(timezone.utc), ensure 'from datetime import timezone'
        
        cls.appointment = Appointment.objects.create(
            patient=cls.patient_profile,
            doctor=cls.doctor_profile,
            appointment_datetime=cls.appointment_time,
            reason="Initial Checkup",
            status="SCHEDULED"
        )

        cls.list_create_url = reverse('appointment-list')
        cls.detail_url = reverse('appointment-detail', kwargs={'pk': cls.appointment.pk})

    def setUp(self):
        self.client.force_authenticate(user=self.admin_user)

    def test_admin_create_appointment(self):
        data = {
            "patient": self.other_patient_profile.pk,
            "doctor": self.doctor_profile.pk,
            "appointment_datetime": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "reason": "Follow-up by Admin",
            "status": "SCHEDULED"  # Corrected
        }
        response = self.client.post(self.list_create_url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Admin Create Appointment Error: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 2)

    def test_admin_list_all_appointments(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), Appointment.objects.count())

    def test_patient_create_own_appointment(self):
        self.client.force_authenticate(user=self.patient_user)
        data = {
            "doctor": self.doctor_profile.pk,
            "appointment_datetime": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(),
            "reason": "My new appointment by patient",
            # Status can be optional on create, defaulting to SCHEDULED
        }
        response = self.client.post(self.list_create_url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Patient Create Own Appointment Error: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_appt = Appointment.objects.get(pk=response.data['id'])
        self.assertEqual(new_appt.patient, self.patient_profile)
        self.assertEqual(new_appt.status, "SCHEDULED") # Corrected

    def test_patient_list_own_appointments(self):
        self.client.force_authenticate(user=self.patient_user)
        Appointment.objects.create(
            patient=self.patient_profile, doctor=self.doctor_profile,
            appointment_datetime=datetime.now(timezone.utc) + timedelta(days=20), reason="Patient's 2nd appt"
        )
        Appointment.objects.create(
            patient=self.other_patient_profile, doctor=self.doctor_profile,
            appointment_datetime=datetime.now(timezone.utc) + timedelta(days=25), reason="Other patient appt"
        )
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2) 
        for appt_data in response.data:
            self.assertEqual(appt_data['patient_details']['user_details']['id'], self.patient_profile.user_id) # Corrected path and target

    def test_patient_update_own_appointment_reason_or_cancel(self):
        self.client.force_authenticate(user=self.patient_user)
        update_data = {"reason": "Updated reason by patient", "status": "CANCELLED"} # Corrected
        response = self.client.patch(self.detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.reason, "Updated reason by patient")
        self.assertEqual(self.appointment.status, "CANCELLED") # Corrected

    def test_doctor_list_own_appointments(self):
        self.client.force_authenticate(user=self.doctor_user)
        Appointment.objects.create(
            patient=self.other_patient_profile, doctor=self.doctor_profile,
            appointment_datetime=datetime.now(timezone.utc) + timedelta(days=30), reason="Doc's second appt"
        )
        other_doc_user = User.objects.create_user(username='otherdoc_appt', password='password', email='otherdoc@appt.com', role="DOCTOR")
        other_doc_profile = DoctorProfile.objects.create(user=other_doc_user, specialization="Derma")
        Appointment.objects.create(
            patient=self.patient_profile, doctor=other_doc_profile,
            appointment_datetime=datetime.now(timezone.utc) + timedelta(days=35), reason="Other doctor appt"
        )
        response = self.client.get(self.list_create_url)
        # print("Response data for test_doctor_list_own_appointments:", response.data) 
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        for appt_data in response.data:
            self.assertEqual(appt_data['doctor_details']['user_details']['id'], self.doctor_profile.user_id) # Corrected path and target

    def test_doctor_update_own_appointment_status(self):
        self.client.force_authenticate(user=self.doctor_user)
        update_data = {"status": "COMPLETED", "reason": "Consultation completed by doctor."} # Corrected
        response = self.client.patch(self.detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, "COMPLETED") # Corrected

    def test_receptionist_create_appointment_for_patient(self):
        self.client.force_authenticate(user=self.receptionist_user)
        data = {
            "patient": self.patient_profile.pk,
            "doctor": self.doctor_profile.pk,
            "appointment_datetime": (datetime.now(timezone.utc) + timedelta(days=40)).isoformat(),
            "reason": "Booked by receptionist for patient",
            "status": "SCHEDULED"  # Corrected
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 2)

    def test_receptionist_list_all_appointments(self):
        self.client.force_authenticate(user=self.receptionist_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), Appointment.objects.count())


class MedicalRecordAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            username='admin_medrec_test', password='adminpassword', 
            email='admin_medrec@example.com', role="ADMIN"
        )
        cls.doctor_user_one = User.objects.create_user(
            username='doctor_medrec_one', password='docpassword', 
            email='doc_medrec1@example.com', role="DOCTOR"
        )
        cls.doctor_profile_one = DoctorProfile.objects.create(
            user=cls.doctor_user_one, specialization="Cardiology", department="Heart"
        )
        cls.doctor_user_two = User.objects.create_user(
            username='doctor_medrec_two', password='docpassword', 
            email='doc_medrec2@example.com', role="DOCTOR"
        )
        cls.doctor_profile_two = DoctorProfile.objects.create(
            user=cls.doctor_user_two, specialization="Neurology", department="Brain"
        )
        cls.patient_user = User.objects.create_user(
            username='patient_medrec_test', password='patpassword', 
            email='pat_medrec@example.com', role="PATIENT"
        )
        cls.patient_profile = PatientProfile.objects.create(
            user=cls.patient_user, date_of_birth="1985-03-15"
        )

        cls.medical_record_one = MedicalRecord.objects.create(
            patient=cls.patient_profile,
            doctor=cls.doctor_profile_one,
            record_type="Consultation Note",
            description="Patient reported mild chest pain (Record 1).",
        )

        cls.list_create_url = reverse('medicalrecord-list')
        cls.detail_url_one = reverse('medicalrecord-detail', kwargs={'pk': cls.medical_record_one.pk})

    def setUp(self):
        self.client.force_authenticate(user=self.admin_user)

    def test_admin_create_medical_record(self):
        data = {
            "patient": self.patient_profile.pk,
            "doctor": self.doctor_profile_two.pk,
            "record_type": "Lab Result by Admin",
            "description": "Blood test normal (Admin created)."
        }
        response = self.client.post(self.list_create_url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Admin Create Medical Record Error: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MedicalRecord.objects.count(), 2)

    def test_doctor_create_medical_record_for_patient(self):
        self.client.force_authenticate(user=self.doctor_user_one)
        data = {
            "patient": self.patient_profile.pk, 
            # Doctor field should be set by perform_create in view
            "record_type": "Follow-up Note by Doctor",
            "description": "Patient recovering well (Doctor created)."
        }
        response = self.client.post(self.list_create_url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Doctor Create Medical Record Error: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_record = MedicalRecord.objects.get(pk=response.data['id'])
        self.assertEqual(new_record.doctor, self.doctor_profile_one)

    def test_doctor_list_records_they_are_associated_with(self):
        self.client.force_authenticate(user=self.doctor_user_one)
        # Record by another doctor for the same patient (should not be listed for doctor_user_one)
        MedicalRecord.objects.create(
            patient=self.patient_profile, doctor=self.doctor_profile_two,
            record_type="Second Opinion", description="Neuro consult by Dr Two"
        )
        # Another record by doctor_user_one
        MedicalRecord.objects.create(
            patient=self.patient_profile, doctor=self.doctor_profile_one,
            record_type="Prescription Update", description="Adjusted meds by Dr One"
        )
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2) 
        for rec_data in response.data:
            self.assertEqual(rec_data['doctor_details']['user_details']['id'], self.doctor_profile_one.user_id) # Corrected path and target

    def test_doctor_update_own_medical_record(self):
        self.client.force_authenticate(user=self.doctor_user_one)
        update_data = {"description": "Condition significantly improved after treatment (Updated by Dr One)."}
        response = self.client.patch(self.detail_url_one, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.medical_record_one.refresh_from_db()
        self.assertEqual(self.medical_record_one.description, update_data["description"])

    def test_doctor_cannot_update_other_doctors_record(self):
        self.client.force_authenticate(user=self.doctor_user_one)
        record_by_doc_two = MedicalRecord.objects.create(
            patient=self.patient_profile, doctor=self.doctor_profile_two,
            record_type="Initial Consult DrTwo", description="Headache report by DrTwo"
        )
        detail_url_doc_two_record = reverse('medicalrecord-detail', kwargs={'pk': record_by_doc_two.pk})
        update_data = {"description": "Attempted update by Dr One"}
        response = self.client.patch(detail_url_doc_two_record, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_list_own_medical_records(self):
        self.client.force_authenticate(user=self.patient_user)
        # Record by another doctor for this patient
        MedicalRecord.objects.create(
            patient=self.patient_profile, doctor=self.doctor_profile_two,
            record_type="X-Ray Report by DrTwo", description="All clear."
        )
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2) 
        for rec_data in response.data:
            self.assertEqual(rec_data['patient_details']['user_details']['id'], self.patient_profile.user_id) # Corrected path and target

    def test_patient_retrieve_own_medical_record(self):
        self.client.force_authenticate(user=self.patient_user)
        response = self.client.get(self.detail_url_one) # medical_record_one is for self.patient_profile
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], self.medical_record_one.description)

    def test_patient_cannot_create_medical_record(self):
        self.client.force_authenticate(user=self.patient_user)
        data = {"patient": self.patient_profile.pk, "doctor": self.doctor_profile_one.pk, "record_type": "Self Note Attempt"}
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_cannot_update_medical_record(self):
        self.client.force_authenticate(user=self.patient_user)
        update_data = {"description": "Patient trying to update record"}
        response = self.client.patch(self.detail_url_one, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PatientLabTestOrderAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser(
            username='admin_laborder_test', password='adminpassword', 
            email='admin_laborder@example.com', role="ADMIN"
        )
        cls.doctor_user_one = User.objects.create_user(
            username='doctor_laborder_one', password='docpassword', 
            email='doc_laborder1@example.com', role="DOCTOR"
        )
        cls.doctor_profile_one = DoctorProfile.objects.create(
            user=cls.doctor_user_one, specialization="Pathology", department="Lab"
        )
        cls.doctor_user_two = User.objects.create_user(
            username='doctor_laborder_two', password='docpassword', 
            email='doc_laborder2@example.com', role="DOCTOR"
        )
        cls.doctor_profile_two = DoctorProfile.objects.create(
            user=cls.doctor_user_two, specialization="General", department="OPD"
        )

        cls.patient_user_one = User.objects.create_user(
            username='patient_laborder_one', password='patpassword', 
            email='pat_laborder1@example.com', role="PATIENT"
        )
        cls.patient_profile_one = PatientProfile.objects.create(
            user=cls.patient_user_one, date_of_birth="1990-01-01"
        )
        cls.patient_user_two = User.objects.create_user(
            username='patient_laborder_two', password='patpassword', 
            email='pat_laborder2@example.com', role="PATIENT"
        )
        cls.patient_profile_two = PatientProfile.objects.create(
            user=cls.patient_user_two, date_of_birth="1992-02-02"
        )

        cls.receptionist_user = User.objects.create_user(
            username='recep_laborder_test', password='recpassword', 
            email='rec_laborder@example.com', role="RECEPTIONIST"
        )

        cls.test_def1 = LabTestDefinition.objects.create(name="CBC", default_cost=500) # Changed price to default_cost
        cls.test_def2 = LabTestDefinition.objects.create(name="Urine RE", default_cost=300)

        cls.lab_order_one = PatientLabTestOrder.objects.create(
            patient=cls.patient_profile_one,
            ordered_by_doctor=cls.doctor_profile_one,
            lab_test_definition=cls.test_def1, # Corrected from test_definition
            status="PENDING_SAMPLE" # Changed from PENDING to match model choices
        )

        cls.list_create_url = reverse('patientlabtestorder-list')
        cls.detail_url_one = reverse('patientlabtestorder-detail', kwargs={'pk': cls.lab_order_one.pk})

    # Admin tests
    def test_admin_create_lab_test_order(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "patient": self.patient_profile_two.pk,
            "ordered_by_doctor": self.doctor_profile_two.pk,
            "lab_test_definition": self.test_def2.pk, # Corrected from test_definition
            "status": "PENDING_SAMPLE"
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PatientLabTestOrder.objects.count(), 2)
        self.assertEqual(response.data['status'], "PENDING_SAMPLE") # Corrected from "PENDING"

    def test_admin_list_lab_test_orders(self):
        self.client.force_authenticate(user=self.admin_user)
        PatientLabTestOrder.objects.create(
            patient=self.patient_profile_two, ordered_by_doctor=self.doctor_profile_one, 
            lab_test_definition=self.test_def1, status="COMPLETED" # Corrected from test_definition
        )
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_admin_retrieve_lab_test_order(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.detail_url_one)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.lab_order_one.pk)
        self.assertEqual(response.data['test_definition_details']['name'], self.test_def1.name)

    def test_admin_update_lab_test_order(self):
        self.client.force_authenticate(user=self.admin_user)
        update_data = {"status": "COMPLETED", "result_summary": "All normal values.", "notes_by_doctor": "Reviewed by admin."} # Changed result to result_summary, notes to notes_by_doctor
        response = self.client.patch(self.detail_url_one, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.lab_order_one.refresh_from_db()
        self.assertEqual(self.lab_order_one.status, "COMPLETED")
        self.assertEqual(self.lab_order_one.result_summary, "All normal values.") # Changed result to result_summary

    def test_admin_delete_lab_test_order(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(self.detail_url_one)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PatientLabTestOrder.objects.filter(pk=self.lab_order_one.pk).exists())

    # Doctor tests
    def test_doctor_create_lab_test_order(self):
        self.client.force_authenticate(user=self.doctor_user_one)
        data = {
            "patient": self.patient_profile_two.pk,
            "lab_test_definition": self.test_def2.pk, # Corrected from test_definition
            # ordered_by_doctor is set automatically by perform_create
            # status can default or be set
        }
        response = self.client.post(self.list_create_url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Doctor Create Lab Order Error: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_order = PatientLabTestOrder.objects.get(pk=response.data['id'])
        self.assertEqual(new_order.ordered_by_doctor, self.doctor_profile_one)
        self.assertEqual(new_order.patient, self.patient_profile_two)
        self.assertEqual(new_order.status, "PENDING_SAMPLE") # Default or as per model

    def test_doctor_list_own_created_lab_test_orders(self):
        self.client.force_authenticate(user=self.doctor_user_one)
        # Order by another doctor
        PatientLabTestOrder.objects.create(
            patient=self.patient_profile_one, ordered_by_doctor=self.doctor_profile_two,
            lab_test_definition=self.test_def2, status="PENDING_SAMPLE" # Corrected from test_definition
        )
        # Another order by doctor_user_one
        PatientLabTestOrder.objects.create(
            patient=self.patient_profile_two, ordered_by_doctor=self.doctor_profile_one,
            lab_test_definition=self.test_def2, status="COMPLETED" # Corrected from test_definition
        )
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2) # lab_order_one and the one just created by doc1
        for order_data in response.data:
            self.assertEqual(order_data['ordered_by_doctor_details']['user_details']['id'], self.doctor_user_one.pk)

    def test_doctor_retrieve_own_created_lab_test_order(self):
        self.client.force_authenticate(user=self.doctor_user_one)
        response = self.client.get(self.detail_url_one) # lab_order_one was created by doctor_profile_one
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.lab_order_one.pk)

    def test_doctor_update_own_created_lab_test_order(self):
        self.client.force_authenticate(user=self.doctor_user_one)
        update_data = {"status": "COMPLETED", "result_summary": "Results are in.", "notes_by_doctor": "Reviewed by Dr. One"} # Changed result to result_summary, notes to notes_by_doctor
        response = self.client.patch(self.detail_url_one, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.lab_order_one.refresh_from_db()
        self.assertEqual(self.lab_order_one.status, "COMPLETED")
        self.assertEqual(self.lab_order_one.result_summary, "Results are in.") # Changed result to result_summary

    def test_doctor_cannot_update_other_doctors_lab_test_order(self):
        order_by_doc_two = PatientLabTestOrder.objects.create(
            patient=self.patient_profile_one, ordered_by_doctor=self.doctor_profile_two,
            lab_test_definition=self.test_def1, status="PENDING_SAMPLE" # Corrected from test_definition
        )
        detail_url_doc_two_order = reverse('patientlabtestorder-detail', kwargs={'pk': order_by_doc_two.pk})
        
        self.client.force_authenticate(user=self.doctor_user_one)
        update_data = {"status": "CANCELLED"}
        response = self.client.patch(detail_url_doc_two_order, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_doctor_cannot_delete_lab_test_order(self):
        self.client.force_authenticate(user=self.doctor_user_one)
        response = self.client.delete(self.detail_url_one)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Patient tests
    def test_patient_list_own_lab_test_orders(self):
        self.client.force_authenticate(user=self.patient_user_one)
        # Order for another patient
        PatientLabTestOrder.objects.create(
            patient=self.patient_profile_two, ordered_by_doctor=self.doctor_profile_one,
            lab_test_definition=self.test_def1, status="PENDING_SAMPLE" # Corrected from test_definition
        )
        # Another order for patient_user_one by a different doctor
        PatientLabTestOrder.objects.create(
            patient=self.patient_profile_one, ordered_by_doctor=self.doctor_profile_two,
            lab_test_definition=self.test_def2, status="COMPLETED" # Corrected from test_definition
        )
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2) # lab_order_one and the one just created for patient1
        for order_data in response.data:
            self.assertEqual(order_data['patient_details']['user_details']['id'], self.patient_user_one.pk)

    def test_patient_retrieve_own_lab_test_order(self):
        self.client.force_authenticate(user=self.patient_user_one)
        response = self.client.get(self.detail_url_one) # lab_order_one is for patient_profile_one
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.lab_order_one.pk)

    def test_patient_cannot_retrieve_other_patients_lab_test_order(self):
        order_for_patient_two = PatientLabTestOrder.objects.create(
            patient=self.patient_profile_two, ordered_by_doctor=self.doctor_profile_one,
            lab_test_definition=self.test_def1, status="PENDING_SAMPLE" # Corrected from test_definition
        )
        detail_url_patient_two_order = reverse('patientlabtestorder-detail', kwargs={'pk': order_for_patient_two.pk})
        
        self.client.force_authenticate(user=self.patient_user_one)
        response = self.client.get(detail_url_patient_two_order)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_cannot_create_lab_test_order(self):
        self.client.force_authenticate(user=self.patient_user_one)
        data = {"patient": self.patient_profile_one.pk, "lab_test_definition": self.test_def1.pk} # Corrected from test_definition
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_cannot_update_lab_test_order(self):
        self.client.force_authenticate(user=self.patient_user_one)
        update_data = {"notes_by_doctor": "Patient trying to add notes."} # Changed notes to notes_by_doctor
        response = self.client.patch(self.detail_url_one, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_cannot_delete_lab_test_order(self):
        self.client.force_authenticate(user=self.patient_user_one)
        response = self.client.delete(self.detail_url_one)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Receptionist tests (assuming no permissions for lab orders)
    def test_receptionist_cannot_access_lab_test_orders(self):
        self.client.force_authenticate(user=self.receptionist_user)
        
        # List
        response_list = self.client.get(self.list_create_url)
        self.assertEqual(response_list.status_code, status.HTTP_403_FORBIDDEN)
        
        # Create
        data = {"patient": self.patient_profile_one.pk, "lab_test_definition": self.test_def1.pk, "ordered_by_doctor": self.doctor_profile_one.pk} # Corrected from test_definition
        response_create = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response_create.status_code, status.HTTP_403_FORBIDDEN)
        
        # Retrieve
        response_retrieve = self.client.get(self.detail_url_one)
        self.assertEqual(response_retrieve.status_code, status.HTTP_403_FORBIDDEN)
        
        # Update
        update_data = {"status": "CANCELLED"}
        response_update = self.client.patch(self.detail_url_one, update_data, format='json')
        self.assertEqual(response_update.status_code, status.HTTP_403_FORBIDDEN)
        
        # Delete
        response_delete = self.client.delete(self.detail_url_one)
        self.assertEqual(response_delete.status_code, status.HTTP_403_FORBIDDEN)

    # Unauthenticated user tests
    def test_unauthenticated_user_cannot_access_lab_test_orders(self):
        self.client.logout()
        response_list = self.client.get(self.list_create_url)
        self.assertEqual(response_list.status_code, status.HTTP_403_FORBIDDEN)

        response_retrieve = self.client.get(self.detail_url_one)
        self.assertEqual(response_retrieve.status_code, status.HTTP_403_FORBIDDEN)

        data = {"patient": self.patient_profile_one.pk, "lab_test_definition": self.test_def1.pk} # Corrected from test_definition
        response_create = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response_create.status_code, status.HTTP_403_FORBIDDEN)


class SendAppointmentRemindersCommandTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Users
        cls.patient_user = User.objects.create_user(
            username='testpatient_reminder', password='testpass123', role='PATIENT',
            first_name="Test", last_name="Patient"
        )
        cls.doctor_user = User.objects.create_user(
            username='testdoctor_reminder', password='testpass123', role='DOCTOR',
            first_name="Rem", last_name="Doctor" # Added for get_full_name()
        )
        
        # Profiles
        cls.patient_profile = PatientProfile.objects.create(user=cls.patient_user, date_of_birth='1990-01-01', contact_number='1234567890')
        cls.doctor_profile = DoctorProfile.objects.create(user=cls.doctor_user, specialization='Cardiology')

        # Appointment for tomorrow
        cls.tomorrow_date = django_timezone.now().date() + timedelta(days=1)
        cls.appointment_tomorrow_dt = django_timezone.make_aware(datetime.combine(cls.tomorrow_date, datetime.min.time())) + timedelta(hours=10) # 10 AM tomorrow
        cls.appointment_tomorrow = Appointment.objects.create(
            patient=cls.patient_profile,
            doctor=cls.doctor_profile,
            appointment_datetime=cls.appointment_tomorrow_dt,
            reason='Follow-up',
            status='SCHEDULED'
        )

        # Appointment for day after tomorrow (should not be picked up by default)
        cls.day_after_tomorrow_date = django_timezone.now().date() + timedelta(days=2)
        cls.appointment_day_after_tomorrow_dt = django_timezone.make_aware(datetime.combine(cls.day_after_tomorrow_date, datetime.min.time())) + timedelta(hours=11)
        cls.appointment_day_after_tomorrow = Appointment.objects.create(
            patient=cls.patient_profile,
            doctor=cls.doctor_profile,
            appointment_datetime=cls.appointment_day_after_tomorrow_dt,
            reason='Checkup',
            status='SCHEDULED'
        )
        
        # Cancelled Appointment for tomorrow (should not be picked up)
        cls.cancelled_appointment_tomorrow_dt = django_timezone.make_aware(datetime.combine(cls.tomorrow_date, datetime.min.time())) + timedelta(hours=12)
        cls.cancelled_appointment_tomorrow = Appointment.objects.create(
            patient=cls.patient_profile,
            doctor=cls.doctor_profile,
            appointment_datetime=cls.cancelled_appointment_tomorrow_dt,
            reason='Cancelled',
            status='CANCELLED'
        )

    def test_send_reminders_no_appointments_for_date(self):
        out = StringIO()
        err = StringIO()
        SystemLog.objects.all().delete()
        target_date = (django_timezone.now() + timedelta(days=30)).strftime('%Y-%m-%d') # A date with no appointments
        call_command('send_appointment_reminders', f'--date={target_date}', stdout=out, stderr=err)
        self.assertIn(f"No appointments found for {target_date}", out.getvalue())
        self.assertEqual(err.getvalue(), '')
        self.assertEqual(SystemLog.objects.count(), 0) # No reminders sent, so no log

    def test_send_reminders_for_tomorrow_default_date(self):
        out = StringIO()
        err = StringIO()
        SystemLog.objects.all().delete() 

        call_command('send_appointment_reminders', stdout=out, stderr=err)
        
        # Command output: "SENT: Reminder for Test Patient: Appointment with Dr. Doctor on Saturday, May 10, 2025 at 10:00 AM."
        # Doctor's last name is "Doctor" from setUpTestData: cls.doctor_user = User.objects.create_user(... last_name="Doctor")
        # Patient's full name is "Test Patient"
        expected_reminder_stdout_msg = f"SENT: Reminder for {self.patient_profile.user.get_full_name()}: Appointment with Dr. {self.doctor_profile.user.last_name} on {self.appointment_tomorrow_dt.strftime('%A, %B %d, %Y')} at {self.appointment_tomorrow_dt.strftime('%I:%M %p')}."
        
        self.assertIn(expected_reminder_stdout_msg, out.getvalue())
        self.assertNotIn(self.appointment_day_after_tomorrow.reason, out.getvalue()) 
        self.assertNotIn(self.cancelled_appointment_tomorrow.reason, out.getvalue()) 
        self.assertEqual(err.getvalue(), '') 

        self.assertEqual(SystemLog.objects.count(), 1) 
        log_entry = SystemLog.objects.first()
        self.assertEqual(log_entry.level, 'INFO')
        # Log format: "Sent appointment reminder for appointment ID {id} (Patient: {username}, Doctor: {doc_username}, Time: {YYYY-MM-DD HH:MM})"
        expected_log_message = f"Sent appointment reminder for appointment ID {self.appointment_tomorrow.id} (Patient: {self.patient_profile.user.username}, Doctor: {self.doctor_profile.user.username}, Time: {self.appointment_tomorrow_dt.strftime('%Y-%m-%d %H:%M')})"
        self.assertEqual(log_entry.message, expected_log_message)

    def test_send_reminders_specific_date_with_appointment(self):
        out = StringIO()
        err = StringIO()
        target_date_str = self.tomorrow_date.strftime('%Y-%m-%d')
        SystemLog.objects.all().delete()

        call_command('send_appointment_reminders', f'--date={target_date_str}', stdout=out, stderr=err)
        
        expected_reminder_stdout_msg = f"SENT: Reminder for {self.patient_profile.user.get_full_name()}: Appointment with Dr. {self.doctor_profile.user.last_name} on {self.appointment_tomorrow_dt.strftime('%A, %B %d, %Y')} at {self.appointment_tomorrow_dt.strftime('%I:%M %p')}."
        self.assertIn(expected_reminder_stdout_msg, out.getvalue())
        self.assertEqual(err.getvalue(), '')

        self.assertEqual(SystemLog.objects.count(), 1)
        log_entry = SystemLog.objects.first()
        self.assertEqual(log_entry.level, 'INFO')
        expected_log_message = f"Sent appointment reminder for appointment ID {self.appointment_tomorrow.id} (Patient: {self.patient_profile.user.username}, Doctor: {self.doctor_profile.user.username}, Time: {self.appointment_tomorrow_dt.strftime('%Y-%m-%d %H:%M')})"
        self.assertEqual(log_entry.message, expected_log_message)

    def test_send_reminders_dry_run(self):
        out = StringIO()
        err = StringIO()
        SystemLog.objects.all().delete()

        call_command('send_appointment_reminders', '--dry-run', stdout=out, stderr=err)
        
        # DRY RUN output: "[DRY RUN] Would send: Reminder for Test Patient: Appointment with Dr. Doctor on Saturday, May 10, 2025 at 10:00 AM."
        expected_dry_run_msg = f"[DRY RUN] Would send: Reminder for {self.patient_profile.user.get_full_name()}: Appointment with Dr. {self.doctor_profile.user.last_name} on {self.appointment_tomorrow_dt.strftime('%A, %B %d, %Y')} at {self.appointment_tomorrow_dt.strftime('%I:%M %p')}."
        self.assertIn(expected_dry_run_msg, out.getvalue())
        self.assertEqual(err.getvalue(), '')
        self.assertEqual(SystemLog.objects.count(), 0) 

    def test_system_log_message_content_success(self): 
        out = StringIO()
        err = StringIO()
        target_date_str = self.tomorrow_date.strftime('%Y-%m-%d')
        SystemLog.objects.all().delete()

        call_command('send_appointment_reminders', f'--date={target_date_str}', stdout=out, stderr=err)
        
        self.assertEqual(err.getvalue(), '') 
        self.assertEqual(SystemLog.objects.count(), 1) 

        log_entry = SystemLog.objects.first()
        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.level, 'INFO')
        
        expected_message = f"Sent appointment reminder for appointment ID {self.appointment_tomorrow.id} (Patient: {self.patient_profile.user.username}, Doctor: {self.doctor_profile.user.username}, Time: {self.appointment_tomorrow_dt.strftime('%Y-%m-%d %H:%M')})"
        self.assertEqual(log_entry.message, expected_message)

    def test_send_reminders_invalid_date_format(self):
        out = StringIO()
        err = StringIO()
        SystemLog.objects.all().delete()

        call_command('send_appointment_reminders', '--date=invalid-date', stdout=out, stderr=err)
        
        # Error message: "Invalid date format. Please use YYYY-MM-DD." (with potential styling)
        self.assertIn("Invalid date format. Please use YYYY-MM-DD.", err.getvalue()) 
        self.assertEqual(SystemLog.objects.count(), 0) 

    def test_send_reminders_multiple_appointments_same_day(self):
        patient_user2 = User.objects.create_user(
            username='testpatient_reminder2', password='testpass123', role='PATIENT',
            first_name="Jane", last_name="Doe"
        )
        patient_profile2 = PatientProfile.objects.create(user=patient_user2, date_of_birth='1992-02-02', contact_number='0987654321')
        
        appointment_tomorrow2_dt = django_timezone.make_aware(datetime.combine(self.tomorrow_date, datetime.min.time())) + timedelta(hours=14) # 2 PM tomorrow
        appointment_tomorrow2 = Appointment.objects.create(
            patient=patient_profile2,
            doctor=self.doctor_profile,
            appointment_datetime=appointment_tomorrow2_dt,
            reason='Consultation',
            status='SCHEDULED'
        )
        
        out = StringIO()
        err = StringIO()
        SystemLog.objects.all().delete()

        call_command('send_appointment_reminders', stdout=out, stderr=err) 

        expected_reminder1_stdout_msg = f"SENT: Reminder for {self.patient_profile.user.get_full_name()}: Appointment with Dr. {self.doctor_profile.user.last_name} on {self.appointment_tomorrow_dt.strftime('%A, %B %d, %Y')} at {self.appointment_tomorrow_dt.strftime('%I:%M %p')}."
        expected_reminder2_stdout_msg = f"SENT: Reminder for {patient_profile2.user.get_full_name()}: Appointment with Dr. {self.doctor_profile.user.last_name} on {appointment_tomorrow2_dt.strftime('%A, %B %d, %Y')} at {appointment_tomorrow2_dt.strftime('%I:%M %p')}."

        self.assertIn(expected_reminder1_stdout_msg, out.getvalue())
        self.assertIn(expected_reminder2_stdout_msg, out.getvalue())
        self.assertEqual(err.getvalue(), '')
        self.assertEqual(SystemLog.objects.count(), 2) 

        logs = SystemLog.objects.order_by('timestamp')
        expected_log_message1 = f"Sent appointment reminder for appointment ID {self.appointment_tomorrow.id} (Patient: {self.patient_profile.user.username}, Doctor: {self.doctor_profile.user.username}, Time: {self.appointment_tomorrow_dt.strftime('%Y-%m-%d %H:%M')})"
        expected_log_message2 = f"Sent appointment reminder for appointment ID {appointment_tomorrow2.id} (Patient: {patient_profile2.user.username}, Doctor: {self.doctor_profile.user.username}, Time: {appointment_tomorrow2_dt.strftime('%Y-%m-%d %H:%M')})"
        
        self.assertEqual(logs[0].message, expected_log_message1)
        self.assertEqual(logs[0].level, 'INFO')
        self.assertEqual(logs[1].message, expected_log_message2)
        self.assertEqual(logs[1].level, 'INFO')

        # Clean up
        appointment_tomorrow2.delete()
        patient_profile2.delete()
        patient_user2.delete()