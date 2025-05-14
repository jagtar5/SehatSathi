from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('hms', '0003_labtestorder'),  # Using the last migration
    ]

    operations = [
        migrations.AlterField(
            model_name='patient',
            name='gender',
            field=models.CharField(choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], max_length=10, verbose_name='Gender'),
        ),
    ] 