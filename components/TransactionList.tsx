import React from 'react';
import { Trash2, FileText } from 'lucide-react';
import { ExpenseRecord, MainCategory } from '../types';
import { COLORS } from '../constants';

interface TransactionListProps {
  transactions: ExpenseRecord[];
  onDelete: (id: string) => void | Promise<void>;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-lg text-gray-800">سجل العمليات الأخيرة</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {transactions.length} عملية
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">النوع</th>
              <th className="px-6 py-3 font-medium">البند</th>
              <th className="px-6 py-3 font-medium">التاريخ</th>
              <th className="px-6 py-3 font-medium">المبلغ</th>
              <th className="px-6 py-3 font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  لم يتم إضافة أي مصروفات بعد
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span 
                      className="px-2 py-1 rounded text-xs font-bold text-white whitespace-nowrap"
                      style={{ backgroundColor: COLORS[t.mainCategory] }}
                    >
                      {t.mainCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    <div className="flex flex-col">
                      <span>{t.subCategory}</span>
                      {t.note && <span className="text-xs text-gray-400 mt-1">{t.note}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800">
                    {t.amount.toLocaleString()} QAR
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onDelete(t.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};