import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  Receipt,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  DollarSign,
  User,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Order, PaymentMethod } from '../../types/pos';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const SalesReturnsView: React.FC = () => {
  const { orders, refundOrder, currency } = usePOS();
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Return quantities per line item
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('cash');
  const [refundReason, setRefundReason] = useState('Customer Changed Mind');

  const filteredOrders = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerName && o.customerName.toLowerCase().includes(q))
    );
  });

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    const initialQtys: Record<string, number> = {};
    order.items.forEach((item) => {
      initialQtys[item.id] = 0;
    });
    setReturnQtys(initialQtys);
  };

  const handleProcessRefund = () => {
    if (!selectedOrder) return;

    const itemsToRefund = Object.entries(returnQtys)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity: Number(quantity) }));

    if (itemsToRefund.length === 0) {
      alert('Please specify at least 1 item quantity to return.');
      return;
    }

    refundOrder(selectedOrder.id, itemsToRefund, refundMethod, refundReason);
    alert('Return and refund processed successfully. Stock has been replenished.');
    setSelectedOrder(null);
  };

  const totalRefundAmount = selectedOrder
    ? selectedOrder.items.reduce((acc, item) => {
        const qty = returnQtys[item.id] || 0;
        return acc + item.unitPrice * qty;
      }, 0)
    : 0;

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            Sales Returns, Exchanges & Refunds
          </h2>
          <p className="text-xs text-slate-400">
            Search previous transactions by receipt barcode or customer, process partial/full refunds & auto-restock
          </p>
        </div>
      </div>

      {/* Main split: left order search, right refund builder */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 mt-4 overflow-hidden">
        {/* Left: Orders history */}
        <div className="w-full md:w-1/2 flex flex-col space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt # (e.g. ORD-2026...) or customer..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                No orders found. Once sales are completed in POS checkout, they appear here for returns.
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                return (
                  <button
                    key={ord.id}
                    onClick={() => handleSelectOrder(ord)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-md'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-extrabold text-xs text-slate-100 font-mono">
                          {ord.orderNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatDateTime(ord.createdAt)} • {ord.cashierName}
                        </div>
                        {ord.customerName && (
                          <div className="text-[11px] text-amber-400/90 font-medium mt-0.5">
                            Customer: {ord.customerName}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-black text-sm text-slate-100 font-mono">
                          {formatCurrency(ord.grandTotal, currency)}
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            ord.status === 'refunded'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Order Refund Processing */}
        <div className="w-full md:w-1/2 flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg overflow-y-auto">
          {!selectedOrder ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
              <Receipt className="w-12 h-12 stroke-[1.2] mb-3 text-slate-600" />
              <p className="font-bold text-sm text-slate-300">Select an Order on the Left</p>
              <p className="text-xs text-slate-500 mt-0.5 text-center max-w-xs">
                Pick a transaction to choose which items to refund and restore back into branch inventory.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Processing Return For
                </span>
                <h3 className="text-sm font-black text-slate-100 font-mono">
                  {selectedOrder.orderNumber}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Original tender: <strong className="uppercase text-slate-200">{selectedOrder.paymentMethod}</strong>
                </div>
              </div>

              {/* Items to refund selection */}
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">
                  Select Quantities to Refund:
                </span>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => {
                    const currentQty = returnQtys[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1">
                          <div className="font-bold text-slate-100">{item.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Sold: {item.quantity} {item.unit} @ {formatCurrency(item.unitPrice, currency)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Return:</span>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={currentQty}
                            onChange={(e) => {
                              const val = Math.min(
                                item.quantity,
                                Math.max(0, parseInt(e.target.value) || 0)
                              );
                              setReturnQtys({ ...returnQtys, [item.id]: val });
                            }}
                            className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-center font-mono font-bold text-amber-400"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Refund Tender & Reason */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Refund Tender Method
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-100"
                  >
                    <option value="cash">Cash from Register Drawer</option>
                    <option value="card">Original Card Reversal</option>
                    <option value="credit">Store Credit / Account</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Return Reason
                  </label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                  >
                    <option value="Customer Changed Mind">Customer Changed Mind</option>
                    <option value="Defective / Damaged Item">Defective / Damaged Item</option>
                    <option value="Incorrect Size / Item">Incorrect Size / Item</option>
                    <option value="Wrong Price Charged">Wrong Price Charged</option>
                  </select>
                </div>
              </div>

              {/* Summary & Commit */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase">Total Refund Payable</span>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    {formatCurrency(totalRefundAmount, currency)}
                  </div>
                </div>

                <button
                  onClick={handleProcessRefund}
                  disabled={totalRefundAmount <= 0}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20 disabled:opacity-40"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Execute Refund</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
