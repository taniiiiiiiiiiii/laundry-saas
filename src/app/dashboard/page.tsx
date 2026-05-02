import { prisma } from "@/lib/prisma";
import { ShoppingBag, TrendingUp, Users, Clock } from "lucide-react";
import Link from "next/link";
import OrderActions from "./orders/OrderActions";
import { getSettings } from "@/lib/settings";

async function getStats() {
  const totalOrders = await prisma.order.count();
  const totalCustomers = await prisma.customer.count();
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });
  
  const revenue = await prisma.order.aggregate({
    _sum: { totalPrice: true }
  });

  return {
    totalOrders,
    totalCustomers,
    recentOrders,
    totalRevenue: revenue._sum.totalPrice || 0
  };
}

export default async function DashboardPage() {
  const [stats, settings] = await Promise.all([getStats(), getSettings()]);
  const sym = settings.currencySymbol ?? "$";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`${sym}${stats.totalRevenue.toFixed(2)}`} icon={<TrendingUp className="text-emerald-500" />} change="+12.5%" />
        <StatCard title="Active Orders" value={stats.totalOrders.toString()} icon={<ShoppingBag className="text-blue-500" />} change="+3 today" />
        <StatCard title="Total Customers" value={stats.totalCustomers.toString()} icon={<Users className="text-indigo-500" />} change="+2 new" />
        <StatCard title="Pending Pickup" value="5" icon={<Clock className="text-orange-500" />} change="-1 since morning" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
          <Link href="/dashboard/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentOrders.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No orders found yet.</td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => {
                  const items = JSON.parse(order.items);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-500">#{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.customer.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {items.map((it: any) => `${it.qty} ${it.type}`).join(", ")}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">{sym}{order.totalPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <OrderActions orderId={order.id} currentStatus={order.status} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, change }: { title: string; value: string; icon: React.ReactNode; change: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{change}</span>
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
    </div>
  );
}
