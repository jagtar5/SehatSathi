# Generated by Django 5.1.7 on 2025-03-06 22:17

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Doctor',
            fields=[
                ('doctor_id', models.AutoField(primary_key=True, serialize=False)),
                ('first_name', models.CharField(max_length=100, verbose_name='First Name')),
                ('last_name', models.CharField(max_length=100, verbose_name='Last Name')),
                ('specialization', models.CharField(max_length=100, verbose_name='Specialization')),
                ('department', models.CharField(max_length=100, verbose_name='Department')),
                ('contact_number', models.CharField(blank=True, max_length=20, null=True, verbose_name='Contact Number')),
                ('email', models.EmailField(blank=True, max_length=254, null=True, verbose_name='Email')),
            ],
            options={
                'verbose_name': 'Doctor',
                'verbose_name_plural': 'Doctors',
            },
        ),
        migrations.CreateModel(
            name='Patient',
            fields=[
                ('patient_id', models.AutoField(primary_key=True, serialize=False)),
                ('reg_num', models.CharField(max_length=20, unique=True, verbose_name='Registration Number')),
                ('first_name', models.CharField(max_length=100, verbose_name='First Name')),
                ('last_name', models.CharField(max_length=100, verbose_name='Last Name')),
                ('gender', models.CharField(choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], max_length=10, verbose_name='Gender')),
                ('date_of_birth', models.DateField(verbose_name='Date of Birth')),
                ('contact_number', models.CharField(blank=True, max_length=20, null=True, verbose_name='Contact Number')),
                ('email', models.EmailField(blank=True, max_length=254, null=True, verbose_name='Email')),
                ('registration_date', models.DateTimeField(auto_now_add=True, verbose_name='Registration Date')),
            ],
            options={
                'verbose_name': 'Patient',
                'verbose_name_plural': 'Patients',
            },
        ),
        migrations.CreateModel(
            name='Appointment',
            fields=[
                ('appointment_id', models.AutoField(primary_key=True, serialize=False)),
                ('appointment_date', models.DateTimeField(verbose_name='Appointment Date & Time')),
                ('reason', models.TextField(verbose_name='Reason for Appointment')),
                ('status', models.CharField(choices=[('Scheduled', 'Scheduled'), ('Confirmed', 'Confirmed'), ('Completed', 'Completed'), ('Cancelled', 'Cancelled')], default='Scheduled', max_length=20, verbose_name='Status')),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='appointments', to='hms.doctor', verbose_name='Doctor')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='appointments', to='hms.patient', verbose_name='Patient')),
            ],
            options={
                'verbose_name': 'Appointment',
                'verbose_name_plural': 'Appointments',
            },
        ),
        migrations.CreateModel(
            name='Billing',
            fields=[
                ('bill_id', models.AutoField(primary_key=True, serialize=False)),
                ('bill_date', models.DateTimeField(auto_now_add=True, verbose_name='Bill Date')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Amount')),
                ('status', models.CharField(choices=[('Pending', 'Pending'), ('Paid', 'Paid'), ('Overdue', 'Overdue'), ('Cancelled', 'Cancelled')], default='Pending', max_length=20, verbose_name='Status')),
                ('payment_date', models.DateTimeField(blank=True, null=True, verbose_name='Payment Date')),
                ('payment_method', models.CharField(blank=True, max_length=50, null=True, verbose_name='Payment Method')),
                ('invoice_number', models.CharField(blank=True, max_length=50, null=True, unique=True, verbose_name='Invoice Number')),
                ('notes', models.TextField(blank=True, null=True, verbose_name='Notes')),
                ('appointment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='bills', to='hms.appointment', verbose_name='Appointment')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bills', to='hms.patient', verbose_name='Patient')),
            ],
            options={
                'verbose_name': 'Bill',
                'verbose_name_plural': 'Bills',
            },
        ),
    ]
