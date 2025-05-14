from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patient_app', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='patientprofile',
            name='gender',
            field=models.CharField(
                blank=True,
                choices=[
                    ('Male', 'Male'), 
                    ('Female', 'Female'), 
                    ('Other', 'Other'),
                    ('M', 'Male'),
                    ('F', 'Female'),
                    ('O', 'Other')
                ],
                max_length=10,
                null=True
            ),
        ),
    ] 