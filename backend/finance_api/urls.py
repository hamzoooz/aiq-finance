from django.urls import path

from . import views

urlpatterns = [
    path('auth-status/', views.auth_status, name='auth-status'),
    path('expenses/', views.expenses, name='expenses'),
    path('expenses/<uuid:record_id>/', views.expense_detail, name='expense-detail'),
    path('income/', views.income, name='income'),
    path('income/<uuid:record_id>/', views.income_detail, name='income-detail'),
]
