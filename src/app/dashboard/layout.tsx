import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Users, BarChart3, Settings } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold tracking-tight text-indigo-600">Laundry<span className="text-gray-900">OS</span></span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem href="/dashboard/orders" icon={<ShoppingBag size={20} />} label="Orders" />
          <NavItem href="/dashboard/customers" icon={<Users size={20} />} label="Customers" />
          <NavItem href="/dashboard/analytics" icon={<BarChart3 size={20} />} label="Analytics" />
        </nav>
        <div className="p-4 border-t border-gray-200">
          <NavItem href="/dashboard/settings" icon={<Settings size={20} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-500">Workspace</h2>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
              T
            </div>
          </div>
        </header>
        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
      {icon}
      <span>{label}</span>
    </Link>
  );
}
