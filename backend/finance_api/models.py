import uuid

from django.db import models


class ExpenseRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    main_category = models.CharField(max_length=64)
    sub_category = models.CharField(max_length=128)
    note = models.TextField(blank=True, default='')
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']


class IncomeRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=64)
    detail = models.CharField(max_length=255)
    note = models.TextField(blank=True, default='')
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
