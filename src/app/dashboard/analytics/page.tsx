import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp, DollarSign, Package } from "lucide-react";
import { getSettings } from "@/lib/settings";

async function getAnalytics() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "asc" }
  });

  // Simple day-wise grouping
  const dailyRev: Record<string, number> = {};
  orders.forEach(o => {
    const day = new Date(o.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
    dailyRev[day] = (dailyRev[day] || 0) + o.totalPrice;
  });

  return {
    dailyRev,
    totalRev: orders.reduce((s, o) => s + o.totalPrice, 0),
    avgOrder: orders.length > 0 ? orders.reduce((s, o) => s + o.totalPrice, 0) / orders.length : 0,
    count: orders.length
  };
}

export default async function AnalyticsPage() {
  const [data, settings] = await Promise.all([getAnalytics(), getSettings()]);
  const sym = settings.currencySymbol ?? "$";
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxRev = Math.max(...Object.values(data.dailyRev), 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm">Insights into your laundry business performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total Revenue" value={`${sym}${data.totalRev.toFixed(2)}`} icon={<DollarSign size={20} />} trend="+8.2%" />
        <MetricCard title="Average Order" value={`${sym}${data.avgOrder.toFixed(2)}`} icon={<TrendingUp size={20} />} trend="+4.1%" />
        <MetricCard title="Order Volume" value={data.count.toString()} icon={<Package size={20} />} trend="+12" />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center">
          <BarChart3 className="mr-2 text-indigo-600" /> Weekly Revenue
        </h3>
        <div className="h-64 flex items-end justify-between gap-4">
          {days.map(day => {
            const val = data.dailyRev[day] || 0;
            const height = (val / maxRev) * 100;
            return (
              <div key={day} className="flex-1 flex flex-col items-center group">
                <div className="w-full bg-indigo-50 rounded-t-xl relative overflow-hidden h-full flex items-end">
                   <div 
                    className="w-full bg-indigo-600 rounded-t-xl transition-all duration-1000 group-hover:bg-indigo-400" 
                    style={{ height: `${height}%` }}
                   >
                     {val > 0 && (
                       <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                         {sym}{val.toFixed(0)}
                       </span>
                     )}
                   </div>
                </div>
                <span className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-tighter">{day}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">{icon}</div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{trend}</span>
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
    </div>
  );
}
