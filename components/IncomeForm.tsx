import React, { useState } from 'react';
import { PlusCircle, Save, Briefcase, CreditCard } from 'lucide-react';
import { IncomeRecord, IncomeType, SubscriptionPlan } from '../types';
import { SUBSCRIPTION_PRICES } from '../constants';

interface IncomeFormProps {
  onAdd: (income: Omit<IncomeRecord, 'id' | 'date'>) => void | Promise<void>;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({ onAdd }) => {
  const [amount, setAmount] = useState<string>('');
  const [incomeType, setIncomeType] = useState<IncomeType | ''>('');
  const [detail, setDetail] = useState<string>(''); // Holds Plan Enum or Contract Name
  const [note, setNote] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !incomeType || !detail) return;

    onAdd({
      amount: parseFloat(amount),
      type: incomeType as IncomeType,
      detail,
      note
    });

    // Reset form
    setAmount('');
    setIncomeType('');
    setDetail('');
    setNote('');
  };

  const handleTypeChange = (val: string) => {
    setIncomeType(val as IncomeType);
    setDetail(''); // Reset details when type changes
    setAmount(''); // Reset amount
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDetail(val);
    if (val && incomeType === IncomeType.SUBSCRIPTION) {
      // Auto set price for subscriptions
      const price = SUBSCRIPTION_PRICES[val as SubscriptionPlan];
      setAmount(price.toString());
    } else if (incomeType === IncomeType.SUBSCRIPTION) {
      setAmount('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-fit">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <PlusCircle className="text-emerald-500 w-6 h-6" />
        تسجيل دخل جديد
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Income Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">نوع الدخل</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange(IncomeType.SUBSCRIPTION)}
              className={`py-3 px-2 rounded-lg text-sm font-bold transition-all duration-200 border flex items-center justify-center gap-2 ${
                incomeType === IncomeType.SUBSCRIPTION
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              {IncomeType.SUBSCRIPTION}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange(IncomeType.CONTRACT)}
              className={`py-3 px-2 rounded-lg text-sm font-bold transition-all duration-200 border flex items-center justify-center gap-2 ${
                incomeType === IncomeType.CONTRACT
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              {IncomeType.CONTRACT}
            </button>
          </div>
        </div>

        {/* Dynamic Details Field */}
        <div className={`transition-all duration-300 ${incomeType ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          {incomeType === IncomeType.SUBSCRIPTION ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع الخطة</label>
              <select
                value={detail}
                onChange={handlePlanChange}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-3 outline-none"
              >
                <option value="">-- اختر مدة الاشتراك --</option>
                {Object.values(SubscriptionPlan).map((plan) => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم الجهة / العقد</label>
              <input
                type="text"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="مثال: شركة التقنية المتقدمة"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-3 outline-none"
              />
            </>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {incomeType === IncomeType.SUBSCRIPTION ? 'المبلغ (محدد مسبقاً)' : 'المبلغ (QAR)'}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            readOnly={incomeType === IncomeType.SUBSCRIPTION}
            placeholder="0.00"
            className={`w-full border border-gray-300 text-gray-900 text-xl font-semibold rounded-lg block p-3 outline-none ${
              incomeType === IncomeType.SUBSCRIPTION 
                ? 'bg-gray-100 cursor-not-allowed focus:border-gray-300' 
                : 'bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500'
            }`}
          />
        </div>
        
        {/* Optional Note */}
         <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="تفاصيل إضافية..."
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-3 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!amount || !incomeType || !detail}
          className="w-full bg-gradient-to-l from-emerald-500 to-teal-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
        >
          <Save className="w-5 h-5" />
          تسجيل الدخل
        </button>
      </form>
    </div>
  );
};