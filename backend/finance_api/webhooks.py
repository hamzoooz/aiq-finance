import json
import logging
import subprocess
import time
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any
from urllib.parse import urlparse

from django.conf import settings
from django.db.models import Sum
from django.utils import timezone

from .models import ExpenseRecord, IncomeRecord

logger = logging.getLogger(__name__)


def _resolve_ipv4(host: str) -> str | None:
    try:
        result = subprocess.run(
            ['dig', '+short', host, 'A'],
            capture_output=True,
            timeout=3,
            check=False,
        )
        if result.returncode != 0:
            return None
        for line in result.stdout.decode('utf-8', errors='ignore').splitlines():
            value = line.strip()
            if value and value[0].isdigit():
                return value
    except Exception:
        return None
    return None


def _to_float(value: Decimal | None) -> float:
    if value is None:
        return 0.0
    return float(value)


def _expense_to_dict(record: ExpenseRecord) -> dict[str, Any]:
    return {
        'id': str(record.id),
        'amount': _to_float(record.amount),
        'mainCategory': record.main_category,
        'subCategory': record.sub_category,
        'note': record.note,
        'date': record.date.isoformat(),
    }


def _income_to_dict(record: IncomeRecord) -> dict[str, Any]:
    return {
        'id': str(record.id),
        'amount': _to_float(record.amount),
        'type': record.type,
        'detail': record.detail,
        'note': record.note,
        'date': record.date.isoformat(),
    }


def _get_week_window(now: datetime) -> tuple[datetime, datetime]:
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=7)
    return week_start, week_end


def _aggregate_snapshot(now: datetime) -> dict[str, Any]:
    expenses = list(ExpenseRecord.objects.all())
    incomes = list(IncomeRecord.objects.all())

    total_expense = _to_float(ExpenseRecord.objects.aggregate(total=Sum('amount'))['total'])
    total_income = _to_float(IncomeRecord.objects.aggregate(total=Sum('amount'))['total'])

    week_start, week_end = _get_week_window(now)
    weekly_expenses_qs = ExpenseRecord.objects.filter(date__gte=week_start, date__lt=week_end)
    weekly_incomes_qs = IncomeRecord.objects.filter(date__gte=week_start, date__lt=week_end)
    weekly_total_expense = _to_float(weekly_expenses_qs.aggregate(total=Sum('amount'))['total'])
    weekly_total_income = _to_float(weekly_incomes_qs.aggregate(total=Sum('amount'))['total'])

    return {
        'reportGeneratedAt': now.isoformat(),
        'summary': {
            'totalIncome': total_income,
            'totalExpenses': total_expense,
            'balance': total_income - total_expense,
            'incomeCount': len(incomes),
            'expenseCount': len(expenses),
        },
        'weeklySummary': {
            'weekStart': week_start.isoformat(),
            'weekEnd': week_end.isoformat(),
            'totalIncome': weekly_total_income,
            'totalExpenses': weekly_total_expense,
            'balance': weekly_total_income - weekly_total_expense,
            'incomeCount': weekly_incomes_qs.count(),
            'expenseCount': weekly_expenses_qs.count(),
        },
        'accounts': {
            'income': [_income_to_dict(item) for item in incomes],
            'expenses': [_expense_to_dict(item) for item in expenses],
        },
    }


def _send_payload(url: str, payload: dict[str, Any]) -> None:
    body = json.dumps(payload).encode('utf-8')
    max_attempts = 5
    parsed = urlparse(url)
    host = parsed.hostname or ''
    port = parsed.port or (443 if parsed.scheme == 'https' else 80)
    resolved_ip: str | None = settings.FINANCE_WEBHOOK_RESOLVE_MAP.get(host)

    for attempt in range(1, max_attempts + 1):
        curl_cmd = [
            'curl',
            '-sS',
            '-o',
            '/dev/null',
            '-w',
            '%{http_code}',
            '-X',
            'POST',
            '-H',
            'Content-Type: application/json',
            '-H',
            'User-Agent: aiq-finance-webhook/1.0',
            '--data-binary',
            '@-',
        ]
        if resolved_ip and host:
            curl_cmd.extend(['--resolve', f'{host}:{port}:{resolved_ip}'])
        curl_cmd.append(url)

        try:
            result = subprocess.run(
                curl_cmd,
                input=body,
                capture_output=True,
                timeout=12,
                check=False,
            )
            stderr_text = result.stderr.decode('utf-8', errors='ignore').strip()
            http_code = result.stdout.decode('utf-8', errors='ignore').strip()
            if result.returncode == 0 and http_code.isdigit() and int(http_code) < 400:
                logger.info(
                    'Webhook sent to %s with status %s (attempt %s/%s)',
                    url,
                    http_code,
                    attempt,
                    max_attempts,
                )
                return
            logger.warning(
                'Webhook send failed to %s (attempt %s/%s), code=%s, curl_rc=%s, stderr=%s',
                url,
                attempt,
                max_attempts,
                http_code or '-',
                result.returncode,
                stderr_text,
            )
            if 'Could not resolve host' in stderr_text and not resolved_ip and host:
                resolved_ip = _resolve_ipv4(host)
                if resolved_ip:
                    logger.warning('Using DNS fallback resolve for %s -> %s', host, resolved_ip)
        except subprocess.TimeoutExpired:
            logger.warning(
                'Webhook send timeout to %s (attempt %s/%s), retrying',
                url,
                attempt,
                max_attempts,
            )
        except Exception:
            if attempt == max_attempts:
                logger.exception(
                    'Failed to send webhook to %s after %s attempts',
                    url,
                    max_attempts,
                )
                return
            logger.warning('Unexpected webhook error for %s (attempt %s/%s)', url, attempt, max_attempts)
        if attempt == max_attempts:
            logger.error('Failed to send webhook to %s after %s attempts', url, max_attempts)
            return
        time.sleep(attempt * 0.5)


def _dispatch_to_all_webhooks(payload: dict[str, Any]) -> None:
    for webhook_url in settings.FINANCE_WEBHOOK_URLS:
        _send_payload(webhook_url, payload)


def send_finance_report(event_type: str, model_name: str, record_data: dict[str, Any]) -> None:
    now = timezone.now()
    payload = {
        'source': 'aiq-finance',
        'event': {
            'type': event_type,
            'model': model_name,
            'timestamp': now.isoformat(),
            'record': record_data,
        },
        **_aggregate_snapshot(now),
    }
    _dispatch_to_all_webhooks(payload)
