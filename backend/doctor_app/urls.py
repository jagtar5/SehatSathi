from django.urls import path
from . import views
from django.contrib.auth.decorators import login_required

app_name = 'doctor_app'

urlpatterns = [
    path('', login_required(views.doctor_index), name='doctor_index'),
    path('profile/', views.doctor_profile_view, name='doctor_profile'),
    path('patients/', views.doctor_patient_list, name='doctor_patient_list'),
    path('schedule/', views.doctor_daily_schedule_view, name='doctor_daily_schedule'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('labtest/order/', views.order_lab_test, name='order_lab_test'),
]