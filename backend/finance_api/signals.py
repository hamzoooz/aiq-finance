from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import ExpenseRecord, IncomeRecord
from .webhooks import send_finance_report


def _expense_to_record_data(instance: ExpenseRecord) -> dict:
    return {
        'id': str(instance.id),
        'amount': float(instance.amount),
        'mainCategory': instance.main_category,
        'subCategory': instance.sub_category,
        'note': instance.note,
        'date': instance.date.isoformat(),
    }


def _income_to_record_data(instance: IncomeRecord) -> dict:
    return {
        'id': str(instance.id),
        'amount': float(instance.amount),
        'type': instance.type,
        'detail': instance.detail,
        'note': instance.note,
        'date': instance.date.isoformat(),
    }


@receiver(post_save, sender=ExpenseRecord)
def on_expense_saved(sender, instance: ExpenseRecord, created: bool, **kwargs) -> None:
    event_type = 'created' if created else 'updated'
    send_finance_report(event_type, 'expense', _expense_to_record_data(instance))


@receiver(post_delete, sender=ExpenseRecord)
def on_expense_deleted(sender, instance: ExpenseRecord, **kwargs) -> None:
    send_finance_report('deleted', 'expense', _expense_to_record_data(instance))


@receiver(post_save, sender=IncomeRecord)
def on_income_saved(sender, instance: IncomeRecord, created: bool, **kwargs) -> None:
    event_type = 'created' if created else 'updated'
    send_finance_report(event_type, 'income', _income_to_record_data(instance))


@receiver(post_delete, sender=IncomeRecord)
def on_income_deleted(sender, instance: IncomeRecord, **kwargs) -> None:
    send_finance_report('deleted', 'income', _income_to_record_data(instance))
