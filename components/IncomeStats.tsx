import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { IncomeRecord, IncomeType } from '../types';
import { INCOME_COLORS } from '../constants';
import { Banknote, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';

interface IncomeStatsProps {
  records: IncomeRecord[];
}

export const IncomeStats: React.FC<IncomeStatsProps> = ({ records }) => {
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);

  // Group by Income Type (Subscription vs Contract)
  const typeData = Object.values(IncomeType).map(type => {
    const total = records
      .filter(r => r.type === type)
      .reduce((sum, r) => sum + r.amount, 0);
    return { name: type, value: total };
  }).filter(d => d.value > 0);

  // Group by Detail (Specific Plan or specific Contract name) - Top 5
  const detailMap: Record<string, number> = {};
  records.forEach(r => {
    detailMap[r.detail] = (detailMap[r.detail] || 0) + r.amount;
  });
  
  const detailData = Object.entries(detailMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Total Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-gray-300 text-sm font-medium mb-1">إجمالي الدخل</p>
            <h3 className="text-4xl font-bold tracking-tight">
              {totalAmount.toLocaleString()} <span className="text-lg text-emerald-400">QAR</span>
            </h3>
          </div>
          <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
            <Banknote className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pie Chart: Source Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center">
          <h4 className="text-gray-700 font-bold mb-4 w-full flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-gray-500" />
            مصادر الدخل
          </h4>
          <div className="w-full min-w-0 h-64 min-h-64">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={INCOME_COLORS[entry.name as IncomeType]} />
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

        {/* Bar Chart: Top Sources */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
           <h4 className="text-gray-700 font-bold mb-4 w-full flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            أعلى المصادر عائداً
          </h4>
          <div className="w-full min-w-0 h-64 min-h-64">
             {detailData.length > 0 ? (
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <BarChart data={detailData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} style={{ fontSize: '12px' }} />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} QAR`} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
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
