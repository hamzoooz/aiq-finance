import React from 'react';
import { Trash2 } from 'lucide-react';
import { IncomeRecord, IncomeType } from '../types';
import { INCOME_COLORS } from '../constants';

interface IncomeListProps {
  records: IncomeRecord[];
  onDelete: (id: string) => void | Promise<void>;
}

export const IncomeList: React.FC<IncomeListProps> = ({ records, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-lg text-gray-800">سجل الإيرادات الأخيرة</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {records.length} عملية
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">النوع</th>
              <th className="px-6 py-3 font-medium">التفاصيل</th>
              <th className="px-6 py-3 font-medium">التاريخ</th>
              <th className="px-6 py-3 font-medium">المبلغ</th>
              <th className="px-6 py-3 font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  لم يتم تسجيل أي دخل بعد
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span 
                      className="px-2 py-1 rounded text-xs font-bold text-white whitespace-nowrap"
                      style={{ backgroundColor: INCOME_COLORS[r.type] }}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    <div className="flex flex-col">
                      <span className="font-semibold">{r.detail}</span>
                      {r.note && <span className="text-xs text-gray-400 mt-1">{r.note}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(r.date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    +{r.amount.toLocaleString()} QAR
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onDelete(r.id)}
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