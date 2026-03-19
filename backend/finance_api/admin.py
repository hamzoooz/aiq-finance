from django.contrib import admin

from .models import ExpenseRecord, IncomeRecord

admin.site.register(ExpenseRecord)
admin.site.register(IncomeRecord)
