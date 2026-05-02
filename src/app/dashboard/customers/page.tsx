import { prisma } from "@/lib/prisma";
import { User, Mail, Phone, Tag, Calendar } from "lucide-react";
import { getSettings } from "@/lib/settings";

async function getCustomers() {
  const customers = await prisma.customer.findMany({
    include: {
      _count: {
        select: { orders: true }
      },
      orders: {
        select: { totalPrice: true }
      }
    }
  });

  return customers.map(c => ({
    ...c,
    totalSpent: c.orders.reduce((sum, o) => sum + o.totalPrice, 0)
  }));
}

export default async function CustomersPage() {
  const [customers, settings] = await Promise.all([getCustomers(), getSettings()]);
  const sym = settings.currencySymbol ?? "$";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 text-sm">Manage your client relationships and history.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {customers.length === 0 ? (
          <div className="bg-white p-12 text-center border border-gray-200 rounded-2xl text-gray-400">
            No customers yet. They will appear here once an order is created.
          </div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-all group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-indigo-100 shadow-lg">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                  <div className="flex items-center text-xs text-gray-400 mt-1 space-x-3">
                    <span className="flex items-center"><Phone size={12} className="mr-1" /> {customer.phone || 'No phone'}</span>
                    <span className="flex items-center"><Calendar size={12} className="mr-1" /> Joined {new Date(customer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Total Orders</p>
                  <p className="text-sm font-bold text-gray-900">{customer._count.orders}</p>
                </div>
                <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[10px] uppercase font-bold text-emerald-600">Total Spent</p>
                  <p className="text-sm font-bold text-emerald-700">{sym}{customer.totalSpent.toFixed(2)}</p>
                </div>
                <div className="px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-[10px] uppercase font-bold text-indigo-600">Status</p>
                  <span className="inline-flex items-center text-xs font-bold text-indigo-700 mt-1">
                    <Tag size={12} className="mr-1" /> {customer.tags || 'Regular'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
