"use client";

import { MoreHorizontal, Trash2, CheckCircle, Clock, Check, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function OrderActions({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const statuses = ["Received", "Washing", "Ready", "Delivered"];

  const handleUpdateStatus = async (status: string) => {
    setIsLoading(true);
    setIsOpen(false);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    setIsLoading(true);
    setIsOpen(false);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      console.error(e);
      alert("Failed to delete order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        disabled={isLoading || isPending}
        className="text-gray-400 hover:text-gray-900 transition-colors p-1 disabled:opacity-50"
      >
        {isLoading || isPending ? <Loader2 size={20} className="animate-spin" /> : <MoreHorizontal size={20} />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden text-sm">
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 text-xs font-bold text-gray-500 uppercase">
              Update Status
            </div>
            {statuses.map(s => (
              <button 
                key={s}
                onClick={() => handleUpdateStatus(s)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${currentStatus === s ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
              >
                {s}
                {currentStatus === s && <Check size={14} />}
              </button>
            ))}
            <div className="border-t border-gray-100">
              <button 
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 size={14} className="mr-2" /> Delete Order
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
