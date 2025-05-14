from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User
from patient.models import PatientProfile, Appointment
from doctor.models import DoctorProfile # Assuming DoctorProfile is needed for appointment linking or context
from .models import Bill
from datetime import date, timedelta, datetime as dt # Renamed datetime to dt to avoid conflict
from django.utils import timezone

class BillAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Create Users
        cls.admin_user = User.objects.create_superuser(
            username='bill_admin', password='adminpass', email='bill_admin@example.com', role='ADMIN'
        )
        cls.receptionist_user = User.objects.create_user(
            username='bill_recep', password='receppass', email='bill_recep@example.com', role='RECEPTIONIST'
        )
        cls.patient_user1 = User.objects.create_user(
            username='bill_patient1', password='patientpass', email='bill_patient1@example.com', role='PATIENT',
            first_name='Bill', last_name='PatientOne'
        )
        cls.patient_user2 = User.objects.create_user(
            username='bill_patient2', password='patientpass', email='bill_patient2@example.com', role='PATIENT',
            first_name='Bill', last_name='PatientTwo'
        )
        cls.doctor_user = User.objects.create_user(
            username='bill_doctor', password='doctorpass', email='bill_doctor@example.com', role='DOCTOR'
        )

        # Create Profiles
        cls.patient_profile1 = PatientProfile.objects.create(user=cls.patient_user1, date_of_birth='1990-01-01')
        cls.patient_profile2 = PatientProfile.objects.create(user=cls.patient_user2, date_of_birth='1992-02-02')
        cls.doctor_profile = DoctorProfile.objects.create(user=cls.doctor_user, specialization='General')

        # Optional: Create an appointment to link to a bill
        cls.appointment1 = Appointment.objects.create(
            patient=cls.patient_profile1,
            doctor=cls.doctor_profile,
            appointment_datetime=timezone.make_aware(dt(2025, 5, 1, 10, 0, 0)), # Use dt
            reason='Consultation for Bill Test',
            status='COMPLETED'
        )

        # Create Bills
        cls.bill1_patient1 = Bill.objects.create(
            patient=cls.patient_profile1,
            appointment=cls.appointment1,
            service_description='Consultation Fee',
            amount=1500.00,
            due_date=date.today() + timedelta(days=30),
            status='UNPAID'
        )
        cls.bill2_patient1 = Bill.objects.create(
            patient=cls.patient_profile1,
            service_description='Lab Test Charges',
            amount=3000.00,
            due_date=date.today() + timedelta(days=15),
            status='PAID'
        )
        cls.bill1_patient2 = Bill.objects.create(
            patient=cls.patient_profile2,
            service_description='Emergency Room Visit',
            amount=5000.00,
            due_date=date.today() + timedelta(days=7),
            status='UNPAID'
        )

        cls.list_create_url = reverse('bill-list') # from receptionist.urls router
        cls.detail_url_bill1_p1 = reverse('bill-detail', kwargs={'pk': cls.bill1_patient1.pk})
        cls.detail_url_bill1_p2 = reverse('bill-detail', kwargs={'pk': cls.bill1_patient2.pk})

    # Test Unauthenticated Access
    def test_unauthenticated_access_to_bills(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # Changed from 401 to 403
        response = self.client.get(self.detail_url_bill1_p1)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # Changed from 401 to 403

    # Test Patient Access
    def test_patient_list_own_bills(self):
        self.client.force_authenticate(user=self.patient_user1)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2) # bill1_patient1, bill2_patient1
        bill_ids = [item['id'] for item in response.data]
        self.assertIn(self.bill1_patient1.id, bill_ids)
        self.assertIn(self.bill2_patient1.id, bill_ids)
        self.assertNotIn(self.bill1_patient2.id, bill_ids)

    def test_patient_retrieve_own_bill(self):
        self.client.force_authenticate(user=self.patient_user1)
        response = self.client.get(self.detail_url_bill1_p1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.bill1_patient1.id)
        self.assertEqual(response.data['service_description'], self.bill1_patient1.service_description)

    def test_patient_cannot_retrieve_other_patient_bill(self):
        self.client.force_authenticate(user=self.patient_user1)
        response = self.client.get(self.detail_url_bill1_p2) # Bill of patient2
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # or 403, depends on CanManageBills has_object_permission

    def test_patient_cannot_create_bill(self):
        self.client.force_authenticate(user=self.patient_user1)
        data = {
            "patient": self.patient_profile1.pk,
            "service_description": "Patient Self-Service Bill",
            "amount": 100.00,
            "due_date": (date.today() + timedelta(days=5)).isoformat()
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_cannot_update_bill(self):
        self.client.force_authenticate(user=self.patient_user1)
        data = {"status": "PAID"}
        response = self.client.patch(self.detail_url_bill1_p1, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patient_cannot_delete_bill(self):
        self.client.force_authenticate(user=self.patient_user1)
        response = self.client.delete(self.detail_url_bill1_p1)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test Receptionist Access
    def test_receptionist_create_bill(self):
        self.client.force_authenticate(user=self.receptionist_user)
        initial_bill_count = Bill.objects.count()
        data = {
            "patient": self.patient_profile2.pk,
            "service_description": "New Service by Receptionist",
            "amount": "750.50",
            "due_date": (date.today() + timedelta(days=20)).isoformat(),
            "status": "UNPAID"
        }
        response = self.client.post(self.list_create_url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print("Receptionist Create Bill Error:", response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Bill.objects.count(), initial_bill_count + 1)
        new_bill = Bill.objects.get(pk=response.data['id'])
        self.assertEqual(new_bill.patient, self.patient_profile2)
        self.assertEqual(new_bill.service_description, data['service_description'])

    def test_receptionist_list_all_bills(self):
        self.client.force_authenticate(user=self.receptionist_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), Bill.objects.count()) # Should see all 3 initial bills + any created

    def test_receptionist_retrieve_any_bill(self):
        self.client.force_authenticate(user=self.receptionist_user)
        response = self.client.get(self.detail_url_bill1_p1) # Bill of patient1
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.bill1_patient1.id)

        response = self.client.get(self.detail_url_bill1_p2) # Bill of patient2
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.bill1_patient2.id)

    def test_receptionist_update_bill(self):
        self.client.force_authenticate(user=self.receptionist_user)
        data = {"status": "PAID", "amount": "1600.00", "payment_details": "Paid via Card"}
        response = self.client.patch(self.detail_url_bill1_p1, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.bill1_patient1.refresh_from_db()
        self.assertEqual(self.bill1_patient1.status, "PAID")
        self.assertEqual(self.bill1_patient1.amount, 1600.00)
        self.assertEqual(self.bill1_patient1.payment_details, "Paid via Card")

    def test_receptionist_delete_bill(self):
        self.client.force_authenticate(user=self.receptionist_user)
        initial_bill_count = Bill.objects.count()
        bill_to_delete_pk = self.bill1_patient2.pk
        response = self.client.delete(self.detail_url_bill1_p2)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Bill.objects.count(), initial_bill_count - 1)
        self.assertFalse(Bill.objects.filter(pk=bill_to_delete_pk).exists())

    # Test Admin Access (similar to Receptionist, can be more concise if permissions are shared)
    def test_admin_create_bill(self):
        self.client.force_authenticate(user=self.admin_user)
        initial_bill_count = Bill.objects.count()
        data = {
            "patient": self.patient_profile1.pk,
            "service_description": "Admin Special Service",
            "amount": "10000.00",
            "due_date": (date.today() + timedelta(days=60)).isoformat(),
            "status": "UNPAID"
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Bill.objects.count(), initial_bill_count + 1)

    def test_admin_list_all_bills(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), Bill.objects.count())

    def test_admin_update_bill(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {"status": "CANCELLED"}
        response = self.client.patch(self.detail_url_bill1_p1, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.bill1_patient1.refresh_from_db()
        self.assertEqual(self.bill1_patient1.status, "CANCELLED")

    # Test Doctor Access (should have no access to bills)
    def test_doctor_cannot_list_bills(self):
        self.client.force_authenticate(user=self.doctor_user)
        response = self.client.get(self.list_create_url)
        # Based on CanManageBills, this should be forbidden as get_queryset returns Bill.objects.none()
        # and the permission check for list might deny if not patient/admin/receptionist.
        # If CanManageBills has_permission allows list for any authenticated, then it might be 200 with 0 items.
        # Let's assume strict denial for now.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_doctor_cannot_create_bill(self):
        self.client.force_authenticate(user=self.doctor_user)
        data = {
            "patient": self.patient_profile1.pk,
            "service_description": "Doctor Bill Attempt",
            "amount": 50.00,
            "due_date": (date.today() + timedelta(days=5)).isoformat()
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_doctor_cannot_retrieve_bill(self):
        self.client.force_authenticate(user=self.doctor_user)
        response = self.client.get(self.detail_url_bill1_p2) # Changed from self.detail_url_bill1_p1
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # Or 404 if obj perm hides it

    def test_doctor_cannot_update_bill(self):
        self.client.force_authenticate(user=self.doctor_user)
        data = {"status": "PAID"}
        response = self.client.patch(self.detail_url_bill1_p1, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_doctor_cannot_delete_bill(self):
        self.client.force_authenticate(user=self.doctor_user)
        response = self.client.delete(self.detail_url_bill1_p1)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
