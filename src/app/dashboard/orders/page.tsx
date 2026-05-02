import { prisma } from "@/lib/prisma";
import { Plus, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import OrderFilters from "./OrderFilters";
import OrderActions from "./OrderActions";
import { getSettings } from "@/lib/settings";

async function getOrders(q?: string, status?: string) {
  const where: any = {};
  
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { customer: { name: { contains: q } } }
    ];
  }
  
  if (status && status !== "All Statuses") {
    where.status = status;
  }

  const orders = await prisma.order.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  return orders;
}

export default async function OrdersPage(props: { searchParams: Promise<{ q?: string, status?: string }> }) {
  const searchParams = await props.searchParams;
  const [orders, settings] = await Promise.all([
    getOrders(searchParams.q, searchParams.status),
    getSettings()
  ]);
  const sym = settings.currencySymbol ?? "$";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">Manage and track your laundry orders.</p>
        </div>
        <Link 
          href="/dashboard/orders/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center shadow-sm"
        >
          <Plus size={18} className="mr-1" /> Create Order
        </Link>
      </div>

      {/* Filters Bar */}
      <Suspense fallback={<div className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse" />}>
        <OrderFilters />
      </Suspense>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    No orders found. Click "Create Order" to get started.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const items = JSON.parse(order.items);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 capitalize">
                            {items[0]?.qty} {items[0]?.type}{items.length > 1 ? ` +${items.length - 1}` : ''}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">#{order.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {order.customer.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{order.customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'Received' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          order.status === 'Ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-gray-50 text-gray-700 border border-gray-100'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                        {sym}{order.totalPrice.toFixed(2)}
                      </td>
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
