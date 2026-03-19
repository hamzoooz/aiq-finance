import json
from decimal import Decimal, InvalidOperation
from functools import wraps
from typing import Any
from uuid import UUID

from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import ExpenseRecord, IncomeRecord


def require_auth(view_func):
    @wraps(view_func)
    def _wrapped(request: HttpRequest, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'detail': 'Authentication required'}, status=401)
        return view_func(request, *args, **kwargs)

    return _wrapped


def _parse_json(request: HttpRequest) -> dict[str, Any]:
    try:
        return json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError('Invalid JSON payload')


def _to_decimal(value: Any) -> Decimal:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError('Invalid amount')
    if amount < 0:
        raise ValueError('Amount must be non-negative')
    return amount


def _expense_to_dict(record: ExpenseRecord) -> dict[str, Any]:
    return {
        'id': str(record.id),
        'amount': float(record.amount),
        'mainCategory': record.main_category,
        'subCategory': record.sub_category,
        'note': record.note,
        'date': record.date.isoformat(),
    }


def _income_to_dict(record: IncomeRecord) -> dict[str, Any]:
    return {
        'id': str(record.id),
        'amount': float(record.amount),
        'type': record.type,
        'detail': record.detail,
        'note': record.note,
        'date': record.date.isoformat(),
    }


@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_auth
def expenses(request: HttpRequest) -> JsonResponse:
    if request.method == 'GET':
        data = [_expense_to_dict(item) for item in ExpenseRecord.objects.all()]
        return JsonResponse(data, safe=False)

    try:
        payload = _parse_json(request)
        amount = _to_decimal(payload.get('amount'))
        main_category = str(payload.get('mainCategory', '')).strip()
        sub_category = str(payload.get('subCategory', '')).strip()
        note = str(payload.get('note', '')).strip()

        if not main_category or not sub_category:
            return HttpResponseBadRequest('mainCategory and subCategory are required')

        record = ExpenseRecord.objects.create(
            amount=amount,
            main_category=main_category,
            sub_category=sub_category,
            note=note,
        )
        return JsonResponse(_expense_to_dict(record), status=201)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))


@csrf_exempt
@require_http_methods(['DELETE'])
@require_auth
def expense_detail(request: HttpRequest, record_id: UUID) -> JsonResponse:
    deleted, _ = ExpenseRecord.objects.filter(id=record_id).delete()
    if deleted == 0:
        return JsonResponse({'detail': 'Not found'}, status=404)
    return JsonResponse({'detail': 'Deleted'})


@csrf_exempt
@require_http_methods(['GET', 'POST'])
@require_auth
def income(request: HttpRequest) -> JsonResponse:
    if request.method == 'GET':
        data = [_income_to_dict(item) for item in IncomeRecord.objects.all()]
        return JsonResponse(data, safe=False)

    try:
        payload = _parse_json(request)
        amount = _to_decimal(payload.get('amount'))
        income_type = str(payload.get('type', '')).strip()
        detail = str(payload.get('detail', '')).strip()
        note = str(payload.get('note', '')).strip()

        if not income_type or not detail:
            return HttpResponseBadRequest('type and detail are required')

        record = IncomeRecord.objects.create(
            amount=amount,
            type=income_type,
            detail=detail,
            note=note,
        )
        return JsonResponse(_income_to_dict(record), status=201)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))


@csrf_exempt
@require_http_methods(['DELETE'])
@require_auth
def income_detail(request: HttpRequest, record_id: UUID) -> JsonResponse:
    deleted, _ = IncomeRecord.objects.filter(id=record_id).delete()
    if deleted == 0:
        return JsonResponse({'detail': 'Not found'}, status=404)
    return JsonResponse({'detail': 'Deleted'})


@require_http_methods(['GET'])
def auth_status(request: HttpRequest) -> JsonResponse:
    return JsonResponse(
        {
            'isAuthenticated': request.user.is_authenticated,
            'loginUrl': '/admin/login/?next=/',
        }
    )
