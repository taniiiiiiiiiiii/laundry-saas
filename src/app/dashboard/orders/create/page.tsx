"use client";

import { useState, useEffect } from "react";
import { Sparkles, ShoppingBag, User, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Zap, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

const PRICE_MAP: Record<string, number> = { shirt: 5, pants: 8, jean: 10, suit: 25, dress: 15 };
const ITEM_TYPES = Object.keys(PRICE_MAP);

export default function CreateOrderPage() {
  const router = useRouter();

  // AI state
  const [prompt, setPrompt] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [aiError, setAiError] = useState("");

  // Order state
  const [orderData, setOrderData] = useState<{
    customer: string;
    items: { type: string; qty: number }[];
    service: string;
    estimatedTotal: number;
    deliveryDate?: string;
    message?: string;
    tags?: string[];
  } | null>(null);

  // Manual add state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState("shirt");
  const [newQty, setNewQty] = useState(1);

  // Save state
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => setCurrencySymbol(d.currencySymbol || "$"))
      .catch(() => {});
  }, []);

  // ---- handlers ----
  const handleAiParse = async () => {
    if (!prompt.trim()) return;
    setIsParsing(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAiError(data.error || "Failed to parse. Try rephrasing.");
        return;
      }
      setOrderData(data);
    } catch {
      setAiError("Network error. Check that the dev server is running.");
    } finally {
      setIsParsing(false);
    }
  };

  const startBlankOrder = () => {
    setOrderData({ customer: "Walk-in Customer", items: [], service: "Standard", estimatedTotal: 0 });
    setAiError("");
  };

  const removeItem = (idx: number) => {
    if (!orderData) return;
    const removed = orderData.items[idx];
    const reduction = (PRICE_MAP[removed.type] || 5) * removed.qty;
    setOrderData({
      ...orderData,
      items: orderData.items.filter((_, i) => i !== idx),
      estimatedTotal: Math.max(0, orderData.estimatedTotal - reduction),
    });
  };

  const addManualItem = () => {
    if (!orderData || newQty <= 0) return;
    const cost = (PRICE_MAP[newType] || 5) * newQty;
    setOrderData({
      ...orderData,
      items: [...orderData.items, { type: newType, qty: newQty }],
      estimatedTotal: orderData.estimatedTotal + cost,
    });
    setShowAddForm(false);
    setNewQty(1);
    setNewType("shirt");
  };

  const handleSave = async () => {
    if (!orderData || orderData.items.length === 0) {
      alert("Please add at least one item to the order.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: orderData.customer,
          items: orderData.items,
          totalPrice: orderData.estimatedTotal,
          status: "Received",
        }),
      });
      if (res.ok) {
        router.push("/dashboard/orders");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save order.");
      }
    } catch {
      alert("Network error saving order.");
    } finally {
      setIsSaving(false);
    }
  };

  // ---- render ----
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <p className="text-gray-500 text-sm mt-1">Describe the order in plain English, or start a blank order below.</p>
      </div>

      {/* AI Prompt */}
      <div className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-sm">
        <label className="block text-sm font-semibold text-indigo-600 mb-3 flex items-center gap-1.5">
          <Sparkles size={16} /> AI Intake Assistant
        </label>
        <div className="flex gap-3">
          <input
            id="ai-prompt-input"
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAiParse()}
            placeholder='e.g. "2 shirts and 1 suit for Tanisha, express"'
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
          />
          <button
            id="ai-analyze-btn"
            onClick={handleAiParse}
            disabled={isParsing || !prompt.trim()}
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 min-w-[110px] justify-center"
          >
            {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isParsing ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        {aiError && (
          <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            {aiError}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-400">Tip: mention items (shirt, pants, suit…), customer name, and express/standard.</p>
          <button onClick={startBlankOrder} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
            Start blank order →
          </button>
        </div>
      </div>

      {/* Order Preview */}
      {orderData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Items */}
          <div className="md:col-span-2 space-y-4">
            {/* AI message banner */}
            {orderData.message && (
              <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700">
                <Sparkles size={16} className="mt-0.5 flex-shrink-0" />
                {orderData.message}
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-indigo-600" /> Order Items
              </h3>

              {orderData.items.length === 0 && !showAddForm && (
                <p className="text-sm text-gray-400 text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                  No items yet — add one below.
                </p>
              )}

              <div className="space-y-2">
                {orderData.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold text-sm">
                        {item.qty}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{item.type}</p>
                        <p className="text-xs text-gray-400">{currencySymbol}{PRICE_MAP[item.type] || 5} × {item.qty} = {currencySymbol}{((PRICE_MAP[item.type] || 5) * item.qty).toFixed(2)}</p>
                      </div>
                    </div>
                    <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Inline add form */}
              {showAddForm ? (
                <div className="mt-3 flex gap-3 items-end bg-gray-50 rounded-xl p-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Item</label>
                    <select
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {ITEM_TYPES.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} ({currencySymbol}{PRICE_MAP[t]})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={newQty}
                      onChange={e => setNewQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddForm(false)} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button onClick={addManualItem} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-3 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center text-sm font-medium gap-1"
                >
                  <Plus size={15} /> Add Item Manually
                </button>
              )}
            </div>
          </div>

          {/* Summary Panel */}
          <div className="space-y-4">
            {/* Customer */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <User size={16} className="text-indigo-600" /> Customer
              </h3>
              <input
                type="text"
                value={orderData.customer}
                onChange={e => setOrderData({ ...orderData, customer: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Service */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Service Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {["Standard", "Express"].map(s => (
                  <button
                    key={s}
                    onClick={() => setOrderData({ ...orderData, service: s })}
                    className={`py-2 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      orderData.service === s
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {s === "Express" ? <Zap size={13} /> : <Clock size={13} />} {s}
                  </button>
                ))}
              </div>
              {orderData.deliveryDate && (
                <p className="text-xs text-gray-400 mt-3">
                  Est. ready: {new Date(orderData.deliveryDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Items ({orderData.items.reduce((s, i) => s + i.qty, 0)})</span>
                <span className="font-medium text-gray-900">{currencySymbol}{orderData.estimatedTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tax</span>
                <span>{currencySymbol}0.00</span>
              </div>
              {orderData.tags && orderData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {orderData.tags.map((tag: string) => (
                    <span key={tag} className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">{tag}</span>
                  ))}
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-indigo-600">{currencySymbol}{orderData.estimatedTotal.toFixed(2)}</span>
              </div>
              <button
                id="confirm-order-btn"
                onClick={handleSave}
                disabled={isSaving || orderData.items.length === 0}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {isSaving ? "Saving…" : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
