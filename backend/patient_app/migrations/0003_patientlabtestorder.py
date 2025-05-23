# Generated by Django 5.2.1 on 2025-05-09 14:51

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hms', '0001_initial'),
        ('patient_app', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PatientLabTestOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('test_name', models.CharField(max_length=100)),
                ('order_datetime', models.DateTimeField(auto_now_add=True)),
                ('sample_collection_datetime', models.DateTimeField(blank=True, null=True)),
                ('results_expected_datetime', models.DateTimeField(blank=True, null=True)),
                ('results_ready_datetime', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(choices=[('PENDING_SAMPLE', 'Pending Sample Collection'), ('SAMPLE_COLLECTED', 'Sample Collected'), ('IN_PROGRESS', 'In Progress'), ('PENDING_REVIEW', 'Pending Review'), ('COMPLETED', 'Completed & Reviewed'), ('CANCELLED', 'Cancelled')], default='PENDING_SAMPLE', max_length=20)),
                ('result_summary', models.TextField(blank=True, help_text='Brief summary of results, if applicable.', null=True)),
                ('result_document', models.FileField(blank=True, null=True, upload_to='lab_results/')),
                ('actual_cost', models.DecimalField(blank=True, decimal_places=2, help_text='Actual cost, might differ from default.', max_digits=10, null=True)),
                ('notes_by_doctor', models.TextField(blank=True, help_text='Instructions or notes from the doctor regarding this test.', null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('appointment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lab_test_orders', to='patient_app.appointment')),
                ('ordered_by_doctor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lab_tests_ordered', to='hms.doctor')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lab_test_orders', to='patient_app.patientprofile')),
            ],
            options={
                'ordering': ['-order_datetime'],
            },
        ),
    ]
