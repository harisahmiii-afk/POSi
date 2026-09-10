import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Building2,
  FileCheck2,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  X,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { PurchaseOrder, Supplier } from '../../types/pos';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PurchasingView: React.FC = () => {
  const {
    suppliers,
    purchaseOrders,
    addPurchaseOrder,
    receivePurchaseOrder,
    products,
    currentBranch,
    currency,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New PO state
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; costPrice: number }[]>([
    { productId: products[0]?.id || '', quantity: 10, costPrice: products[0]?.costPrice || 10 },
  ]);
  const [poNotes, setPoNotes] = useState('');

  const totalPoCost = poItems.reduce((acc, i) => acc + i.quantity * i.costPrice, 0);

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setPoItems([
      ...poItems,
      { productId: products[0].id, quantity: 10, costPrice: products[0].costPrice },
    ]);
  };

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === selectedSupplierId);
    if (!sup) return;

    const formattedItems = poItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod?.name || 'Product',
        quantity: item.quantity,
        costPrice: item.costPrice,
      };
    });

    addPurchaseOrder({
      supplierId: sup.id,
      supplierName: sup.name,
      branchId: currentBranch.id,
      date: new Date().toISOString(),
      status: 'ordered',
      items: formattedItems,
      totalCost: totalPoCost,
      notes: poNotes,
    });

    setCreateModalOpen(false);
    setPoNotes('');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            Purchasing & Supplier Logistics
          </h2>
          <p className="text-xs text-slate-400">
            Create purchase orders, track supplier deliveries, and receive inventory directly into stock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'orders' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'suppliers' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Suppliers Directory ({suppliers.length})
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Create PO</span>
          </button>
        </div>
      </div>

      {/* PO ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="mt-4 space-y-3">
          {purchaseOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/60 rounded-xl border border-slate-800">
              <FileCheck2 className="w-10 h-10 mx-auto stroke-[1.2] mb-2 text-slate-600" />
              <p className="font-bold text-slate-300 text-sm">No Purchase Orders Created</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "Create PO" to order inventory restocking from wholesale distributors.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {purchaseOrders.map((po) => (
                <div
                  key={po.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <span className="font-extrabold text-sm text-slate-100">{po.poNumber}</span>
                        <div className="text-xs text-amber-400 font-semibold">{po.supplierName}</div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            po.status === 'received'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {po.status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(po.date)}</div>
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="py-2 space-y-1 text-xs">
                      {po.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>
                            {i.productName} (x{i.quantity})
                          </span>
                          <span className="font-mono text-slate-400">
                            {formatCurrency(i.costPrice * i.quantity, currency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-xs">
                      <span className="text-slate-400">Total Purchase Cost:</span>
                      <span className="font-mono text-amber-400 text-sm">
                        {formatCurrency(po.totalCost, currency)}
                      </span>
                    </div>
                  </div>

                  {po.status !== 'received' && (
                    <button
                      onClick={() => receivePurchaseOrder(po.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Receive Goods & Auto-Restock Inventory</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suppliers.map((sup) => (
            <div key={sup.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm text-slate-100">{sup.name}</h4>
              </div>
              <div className="text-xs space-y-1 text-slate-400">
                <div>Contact: <strong className="text-slate-200">{sup.contactPerson}</strong></div>
                <div>Phone: <span className="font-mono text-slate-300">{sup.phone}</span></div>
                <div>Email: <span className="text-slate-300">{sup.email}</span></div>
                <div>Tax / Reg: <span className="font-mono text-slate-300">{sup.taxNumber}</span></div>
                <div className="text-[11px] text-slate-500 pt-1">{sup.address}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PO MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-sm text-slate-100">Create Supplier Purchase Order</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Select Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-semibold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items in PO */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-300">Items to Restock</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-amber-400 font-bold hover:underline"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-6">
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const updated = [...poItems];
                            const prod = products.find((p) => p.id === e.target.value);
                            updated[idx].productId = e.target.value;
                            if (prod) updated[idx].costPrice = prod.costPrice;
                            setPoItems(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-[11px] text-slate-200"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].quantity = parseInt(e.target.value) || 1;
                            setPoItems(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-center font-mono text-[11px] text-slate-100"
                          placeholder="Qty"
                        />
                      </div>

                      <div className="col-span-3 font-mono font-bold text-amber-400 text-right">
                        {formatCurrency(item.quantity * item.costPrice, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-300">Estimated Total Cost:</span>
                <span className="font-mono text-base font-black text-amber-400">
                  {formatCurrency(totalPoCost, currency)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shadow-md"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
