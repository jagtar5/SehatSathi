from django.contrib import admin
from .models import Bill, Receptionist

@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'amount', 'date', 'status')
    list_filter = ('status', 'date')
    search_fields = ('patient__user__first_name', 'patient__user__last_name', 'description')
    date_hierarchy = 'date'

@admin.register(Receptionist)
class ReceptionistAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_full_name', 'contact_number', 'join_date', 'is_active')
    list_filter = ('is_active', 'join_date')
    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'contact_number')
    date_hierarchy = 'join_date'
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Name'
