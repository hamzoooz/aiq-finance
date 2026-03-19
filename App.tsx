import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ExpenseForm } from './components/ExpenseForm';
import { SummaryStats } from './components/SummaryStats';
import { TransactionList } from './components/TransactionList';
import { ExpenseRecord, IncomeRecord } from './types';
import { IncomeForm } from './components/IncomeForm';
import { IncomeStats } from './components/IncomeStats';
import { IncomeList } from './components/IncomeList';
import { ReportModal } from './components/ReportModal';
import { Wallet, Banknote, Printer } from 'lucide-react';

type TabView = 'expenses' | 'income';
type EventType = 'created' | 'updated' | 'deleted';
type ModelType = 'expense' | 'income';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const WEBHOOK_URLS = [
  'https://auto.aiq.qa/webhook/aiq-finance',
  'https://auto.aiq.qa/webhook-test/aiq-finance',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.status === 401) {
        window.location.href = '/admin/login/?next=/';
        throw new Error('Authentication required');
      }
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Request failed');
      }
      return response.json() as Promise<T>;
    } catch (error) {
      const isNetworkError = error instanceof TypeError;
      if (!isNetworkError || attempt === maxAttempts) {
        throw error;
      }
      await sleep(250 * attempt);
    }
  }
  throw new Error('Request failed');
}

function getWeekRange(now: Date) {
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const diffToMonday = (day + 6) % 7;
  weekStart.setDate(weekStart.getDate() - diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return { weekStart, weekEnd };
}

function isInWeek(dateISO: string, weekStart: Date, weekEnd: Date) {
  const date = new Date(dateISO);
  return date >= weekStart && date < weekEnd;
}

function buildSnapshot(expenses: ExpenseRecord[], income: IncomeRecord[], nowISO: string) {
  const now = new Date(nowISO);
  const { weekStart, weekEnd } = getWeekRange(now);

  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);

  const weeklyExpenses = expenses.filter((item) => isInWeek(item.date, weekStart, weekEnd));
  const weeklyIncome = income.filter((item) => isInWeek(item.date, weekStart, weekEnd));
  const weeklyTotalExpenses = weeklyExpenses.reduce((sum, item) => sum + item.amount, 0);
  const weeklyTotalIncome = weeklyIncome.reduce((sum, item) => sum + item.amount, 0);

  return {
    summary: {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      incomeCount: income.length,
      expenseCount: expenses.length,
    },
    weeklySummary: {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalIncome: weeklyTotalIncome,
      totalExpenses: weeklyTotalExpenses,
      balance: weeklyTotalIncome - weeklyTotalExpenses,
      incomeCount: weeklyIncome.length,
      expenseCount: weeklyExpenses.length,
    },
    accounts: {
      income,
      expenses,
    },
  };
}

function fireWebhook(url: string, payloadString: string) {
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payloadString,
    keepalive: true,
  }).catch(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(url, new Blob([payloadString], { type: 'application/json' }));
    }
  });
}

function sendTransactionWebhook(params: {
  eventType: EventType;
  model: ModelType;
  record: ExpenseRecord | IncomeRecord;
  expensesBefore: ExpenseRecord[];
  incomeBefore: IncomeRecord[];
  expensesAfter: ExpenseRecord[];
  incomeAfter: IncomeRecord[];
}) {
  const nowISO = new Date().toISOString();
  const previousSnapshot = buildSnapshot(params.expensesBefore, params.incomeBefore, nowISO);
  const currentSnapshot = buildSnapshot(params.expensesAfter, params.incomeAfter, nowISO);

  const payload = {
    source: 'aiq-finance-frontend',
    reportGeneratedAt: nowISO,
    event: {
      type: params.eventType,
      model: params.model,
      timestamp: nowISO,
      record: params.record,
    },
    previous: previousSnapshot,
    ...currentSnapshot,
  };

  const payloadString = JSON.stringify(payload);
  WEBHOOK_URLS.forEach((url) => fireWebhook(url, payloadString));
}

function App() {
  const [activeTab, setActiveTab] = useState<TabView>('expenses');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [transactions, setTransactions] = useState<ExpenseRecord[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const auth = await apiRequest<{ isAuthenticated: boolean; loginUrl: string }>('/api/auth-status/');
        if (!auth.isAuthenticated) {
          window.location.href = auth.loginUrl;
          return;
        }

        const [expenses, income] = await Promise.all([
          apiRequest<ExpenseRecord[]>('/api/expenses/'),
          apiRequest<IncomeRecord[]>('/api/income/'),
        ]);

        if (!cancelled) {
          setTransactions(expenses);
          setIncomeRecords(income);
        }
      } catch (error) {
        console.error('Failed to load records:', error);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddTransaction = async (data: Omit<ExpenseRecord, 'id' | 'date'>) => {
    try {
      const created = await apiRequest<ExpenseRecord>('/api/expenses/', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(data),
      });
      const previousExpenses = transactions;
      const nextExpenses = [created, ...transactions];
      setTransactions(nextExpenses);
      sendTransactionWebhook({
        eventType: 'created',
        model: 'expense',
        record: created,
        expensesBefore: previousExpenses,
        incomeBefore: incomeRecords,
        expensesAfter: nextExpenses,
        incomeAfter: incomeRecords,
      });
    } catch (error) {
      console.error('Failed to add expense:', error);
      window.alert('تعذر حفظ المصروف. حاول مرة أخرى.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      return;
    }

    try {
      await apiRequest<{ detail: string }>(`/api/expenses/${id}/`, { method: 'DELETE' });
      const deletedRecord = transactions.find((t) => t.id === id);
      const previousExpenses = transactions;
      const nextExpenses = transactions.filter((t) => t.id !== id);
      setTransactions(nextExpenses);
      if (deletedRecord) {
        sendTransactionWebhook({
          eventType: 'deleted',
          model: 'expense',
          record: deletedRecord,
          expensesBefore: previousExpenses,
          incomeBefore: incomeRecords,
          expensesAfter: nextExpenses,
          incomeAfter: incomeRecords,
        });
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
      window.alert('تعذر حذف المصروف. حاول مرة أخرى.');
    }
  };

  const handleAddIncome = async (data: Omit<IncomeRecord, 'id' | 'date'>) => {
    try {
      const created = await apiRequest<IncomeRecord>('/api/income/', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(data),
      });
      const previousIncome = incomeRecords;
      const nextIncome = [created, ...incomeRecords];
      setIncomeRecords(nextIncome);
      sendTransactionWebhook({
        eventType: 'created',
        model: 'income',
        record: created,
        expensesBefore: transactions,
        incomeBefore: previousIncome,
        expensesAfter: transactions,
        incomeAfter: nextIncome,
      });
    } catch (error) {
      console.error('Failed to add income:', error);
      window.alert('تعذر حفظ الدخل. حاول مرة أخرى.');
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف سجل الدخل هذا؟')) {
      return;
    }

    try {
      await apiRequest<{ detail: string }>(`/api/income/${id}/`, { method: 'DELETE' });
      const deletedRecord = incomeRecords.find((r) => r.id === id);
      const previousIncome = incomeRecords;
      const nextIncome = incomeRecords.filter((r) => r.id !== id);
      setIncomeRecords(nextIncome);
      if (deletedRecord) {
        sendTransactionWebhook({
          eventType: 'deleted',
          model: 'income',
          record: deletedRecord,
          expensesBefore: transactions,
          incomeBefore: previousIncome,
          expensesAfter: transactions,
          incomeAfter: nextIncome,
        });
      }
    } catch (error) {
      console.error('Failed to delete income:', error);
      window.alert('تعذر حذف سجل الدخل. حاول مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-right pb-12 font-sans">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم المالية</h2>
            <p className="text-gray-500">نظام AIQ للمحاسبة المالية الشاملة</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReportOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg font-bold text-sm hover:bg-gray-50 hover:text-aiq-blue transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              التقارير وتصدير PDF
            </button>

            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
                  activeTab === 'expenses'
                    ? 'bg-aiq-purple text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Wallet className="w-4 h-4" />
                المصروفات
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
                  activeTab === 'income'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Banknote className="w-4 h-4" />
                الدخل
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsReportOpen(true)}
          className="md:hidden w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm shadow-sm"
        >
          <Printer className="w-4 h-4 text-aiq-blue" />
          استخراج التقارير (PDF)
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              {activeTab === 'expenses' ? (
                <>
                  <ExpenseForm onAdd={handleAddTransaction} />
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-sm">
                    <p className="font-bold mb-1">تلميح مصروفات:</p>
                    <p>تأكد من اختيار التصنيف الصحيح (تأسيس، تشغيل، تسويق) للحصول على تقارير دقيقة.</p>
                  </div>
                </>
              ) : (
                <>
                  <IncomeForm onAdd={handleAddIncome} />
                  <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-sm">
                    <p className="font-bold mb-1">تلميح إيرادات:</p>
                    <p>يمكنك تسجيل العقود الخارجية أو الاشتراكات الدورية (شهرية/سنوية) ومتابعة نمو الدخل.</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">
            {activeTab === 'expenses' ? (
              <>
                <SummaryStats transactions={transactions} />
                <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} />
              </>
            ) : (
              <>
                <IncomeStats records={incomeRecords} />
                <IncomeList records={incomeRecords} onDelete={handleDeleteIncome} />
              </>
            )}
          </div>
        </div>
      </main>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        expenses={transactions}
        income={incomeRecords}
      />
    </div>
  );
}

export default App;
