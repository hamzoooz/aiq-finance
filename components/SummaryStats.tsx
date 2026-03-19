import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ExpenseRecord, MainCategory } from '../types';
import { COLORS } from '../constants';
import { Coins, TrendingUp, Wallet } from 'lucide-react';

interface SummaryStatsProps {
  transactions: ExpenseRecord[];
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ transactions }) => {
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Group by Main Category
  const categoryData = Object.values(MainCategory).map(cat => {
    const total = transactions
      .filter(t => t.mainCategory === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat, value: total };
  }).filter(d => d.value > 0);

  // Group by Sub Category (Top 5)
  const subCategoryMap: Record<string, number> = {};
  transactions.forEach(t => {
    subCategoryMap[t.subCategory] = (subCategoryMap[t.subCategory] || 0) + t.amount;
  });
  
  const subCategoryData = Object.entries(subCategoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Total Card */}
      <div className="bg-gradient-to-r from-aiq-dark to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">إجمالي المصروفات</p>
            <h3 className="text-4xl font-bold tracking-tight">
              {totalAmount.toLocaleString()} <span className="text-lg text-aiq-blue">QAR</span>
            </h3>
          </div>
          <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
            <Coins className="w-8 h-8 text-aiq-blue" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center">
          <h4 className="text-gray-700 font-bold mb-4 w-full flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gray-500" />
            التوزيع حسب النوع الرئيسي
          </h4>
          <div className="w-full min-w-0 h-64 min-h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as MainCategory]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} QAR`} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">لا توجد بيانات</div>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
           <h4 className="text-gray-700 font-bold mb-4 w-full flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            أعلى البنود تكلفة
          </h4>
          <div className="w-full min-w-0 h-64 min-h-64">
             {subCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <BarChart data={subCategoryData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} style={{ fontSize: '12px' }} />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} QAR`} />
                  <Bar dataKey="value" fill="#00d2ff" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
             ) : (
              <div className="flex items-center justify-center h-full text-gray-400">لا توجد بيانات</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
