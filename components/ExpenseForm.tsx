import React, { useState } from 'react';
import { PlusCircle, Save } from 'lucide-react';
import { CATEGORY_DATA } from '../constants';
import { MainCategory, ExpenseRecord } from '../types';

interface ExpenseFormProps {
  onAdd: (expense: Omit<ExpenseRecord, 'id' | 'date'>) => void | Promise<void>;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd }) => {
  const [amount, setAmount] = useState<string>('');
  const [mainCategory, setMainCategory] = useState<MainCategory | ''>('');
  const [subCategory, setSubCategory] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !mainCategory || !subCategory) return;

    onAdd({
      amount: parseFloat(amount),
      mainCategory: mainCategory as MainCategory,
      subCategory,
      note
    });

    // Reset form
    setAmount('');
    setMainCategory('');
    setSubCategory('');
    setNote('');
  };

  const handleMainCategoryChange = (val: string) => {
    setMainCategory(val as MainCategory);
    setSubCategory(''); // Reset sub category when main changes
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-fit">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <PlusCircle className="text-aiq-blue w-6 h-6" />
        تسجيل مصروف جديد
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Main Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">نوع البند</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(MainCategory).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleMainCategoryChange(cat)}
                className={`py-2 px-1 rounded-lg text-sm font-bold transition-all duration-200 border ${
                  mainCategory === cat
                    ? 'bg-aiq-purple text-white border-aiq-purple shadow-md'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sub Category */}
        <div className={`transition-all duration-300 ${mainCategory ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">البند الفرعي</label>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            disabled={!mainCategory}
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-aiq-blue focus:border-aiq-blue block p-3 outline-none"
          >
            <option value="">-- اختر البند --</option>
            {mainCategory && CATEGORY_DATA[mainCategory]?.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ (QAR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xl font-semibold rounded-lg focus:ring-aiq-blue focus:border-aiq-blue block p-3 outline-none"
          />
        </div>
        
        {/* Optional Note */}
         <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="وصف إضافي..."
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-aiq-blue focus:border-aiq-blue block p-3 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!amount || !mainCategory || !subCategory}
          className="w-full gradient-bg text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
        >
          <Save className="w-5 h-5" />
          حفظ العملية
        </button>
      </form>
    </div>
  );
};