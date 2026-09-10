import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Barcode,
  TrendingUp,
  History,
  Sliders,
  Edit2,
  Check,
  X,
  Hash,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Product, SectorMode } from '../../types/pos';
import { formatCurrency, formatDateTime, renderBarcodeSvg } from '../../utils/formatters';

export const InventoryManagement: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    adjustStock,
    stockMovements,
    currentBranch,
    currency,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'catalog' | 'ledger' | 'serials'>('catalog');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Add / Edit Product Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formSector, setFormSector] = useState<SectorMode>('retail');
  const [formCost, setFormCost] = useState('0');
  const [formPrice, setFormPrice] = useState('0');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formUnit, setFormUnit] = useState<'pcs' | 'kg' | 'lb' | 'pack' | 'box'>('pcs');
  const [formIsWeighted, setFormIsWeighted] = useState(false);
  const [formRequiresSerial, setFormRequiresSerial] = useState(false);
  const [formInitialStock, setFormInitialStock] = useState('10');

  // Quick Adjustment Modal
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustQtyChange, setAdjustQtyChange] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock Count Audit');

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const handleOpenAddModal = () => {
    setEditingProd(null);
    setFormName('');
    setFormSku(`SKU-${Date.now().toString().slice(-4)}`);
    setFormBarcode(`${Math.floor(100000000000 + Math.random() * 900000000000)}`);
    setFormCategory('General');
    setFormSector('retail');
    setFormCost('10.00');
    setFormPrice('25.00');
    setFormMinStock('5');
    setFormUnit('pcs');
    setFormIsWeighted(false);
    setFormRequiresSerial(false);
    setFormInitialStock('20');
    setProductModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProd(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormCategory(p.category);
    setFormSector(p.sector);
    setFormCost(p.costPrice.toString());
    setFormPrice(p.sellingPrice.toString());
    setFormMinStock(p.minStockAlert.toString());
    setFormUnit(p.unit);
    setFormIsWeighted(!!p.isWeighted);
    setFormRequiresSerial(!!p.requiresSerial);
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(formCost) || 0;
    const price = parseFloat(formPrice) || 0;
    const minStock = parseInt(formMinStock) || 5;

    if (editingProd) {
      updateProduct(editingProd.id, {
        name: formName,
        sku: formSku,
        barcode: formBarcode,
        category: formCategory,
        sector: formSector,
        costPrice: cost,
        sellingPrice: price,
        minStockAlert: minStock,
        unit: formUnit,
        isWeighted: formIsWeighted,
        requiresSerial: formRequiresSerial,
      });
    } else {
      const initStock = parseInt(formInitialStock) || 0;
      addProduct({
        name: formName,
        sku: formSku,
        barcode: formBarcode,
        category: formCategory,
        sector: formSector,
        costPrice: cost,
        sellingPrice: price,
        minStockAlert: minStock,
        unit: formUnit,
        isWeighted: formIsWeighted,
        requiresSerial: formRequiresSerial,
        stock: { [currentBranch.id]: initStock },
      });
    }

    setProductModalOpen(false);
  };

  const handleConfirmAdjust = () => {
    if (!adjustModalProduct) return;
    const change = parseInt(adjustQtyChange);
    if (!isNaN(change) && change !== 0) {
      adjustStock(adjustModalProduct.id, change, adjustReason, 'adjustment');
    }
    setAdjustModalProduct(null);
    setAdjustQtyChange('');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            Inventory & Stock Ledger ({currentBranch.name})
          </h2>
          <p className="text-xs text-slate-400">
            Real-time multi-branch stock levels, barcode generation, reorder warnings & movement ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'catalog' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stock Catalog
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'ledger' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Audit Ledger
            </button>
            <button
              onClick={() => setActiveTab('serials')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'serials' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Serialized Tech
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-3 mt-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by SKU, barcode, name..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-md capitalize font-semibold ${
                    filterCategory === cat
                      ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Item Details</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Cost Price</th>
                    <th className="p-3">Selling Price</th>
                    <th className="p-3">Margin %</th>
                    <th className="p-3">Stock Level</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredProducts.map((p) => {
                    const currentStock = p.stock[currentBranch.id] ?? 0;
                    const isLow = currentStock <= p.minStockAlert;
                    const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100 : 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-100">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span>SKU: {p.sku}</span>
                            <span>•</span>
                            <span>Barcode: {p.barcode}</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                            {p.category}
                          </span>
                        </td>

                        <td className="p-3 font-mono text-slate-400">
                          {formatCurrency(p.costPrice, currency)}
                        </td>

                        <td className="p-3 font-mono font-bold text-amber-400">
                          {formatCurrency(p.sellingPrice, currency)}
                        </td>

                        <td className="p-3 font-mono">
                          <span className="text-emerald-400 font-semibold">{margin.toFixed(1)}%</span>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold px-2 py-0.5 rounded ${
                                currentStock <= 0
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : isLow
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {currentStock} {p.unit}
                            </span>
                            {isLow && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" title="Low stock alert" />
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setAdjustModalProduct(p);
                                setAdjustQtyChange('');
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold border border-slate-700"
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-3 mt-4">
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Quantity Change</th>
                    <th className="p-3">New Balance</th>
                    <th className="p-3">Reason / Ref</th>
                    <th className="p-3">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {stockMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No inventory movements recorded yet. Sales, receiving, and adjustments will appear here.
                      </td>
                    </tr>
                  ) : (
                    stockMovements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-400">{formatDateTime(mov.timestamp)}</td>
                        <td className="p-3 font-bold text-slate-200">{mov.productName}</td>
                        <td className="p-3 capitalize">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mov.type === 'sale'
                                ? 'bg-sky-500/20 text-sky-400'
                                : mov.type === 'return'
                                ? 'bg-purple-500/20 text-purple-400'
                                : mov.type === 'purchase'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {mov.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold">
                          <span className={mov.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-300">{mov.newStock}</td>
                        <td className="p-3 text-slate-400">{mov.reason}</td>
                        <td className="p-3 text-slate-300">{mov.user}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERIALIZED TECH */}
      {activeTab === 'serials' && (
        <div className="space-y-3 mt-4">
          <p className="text-xs text-slate-400">
            High-value serialized inventory tracking. Each unit is tracked by its unique IMEI/Serial Number:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {products
              .filter((p) => p.requiresSerial)
              .map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-slate-100">{p.name}</h4>
                      <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {formatCurrency(p.sellingPrice, currency)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Available Serials ({p.serialNumbers?.length || 0} in stock):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.serialNumbers?.map((sn) => (
                        <span
                          key={sn}
                          className="bg-slate-950 border border-slate-700 text-sky-300 font-mono text-[10px] px-2 py-0.5 rounded"
                        >
                          {sn}
                        </span>
                      ))}
                      {(!p.serialNumbers || p.serialNumbers.length === 0) && (
                        <span className="text-rose-400 text-xs">Out of Serialized Stock</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-sm text-slate-100">
                {editingProd ? 'Edit Product' : 'Add New Inventory Product'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Barcode / EAN</label>
                  <input
                    type="text"
                    required
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Sector Architecture</label>
                  <select
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value as SectorMode)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-semibold"
                  >
                    <option value="retail">Retail</option>
                    <option value="supermarket">Supermarket (Scales)</option>
                    <option value="restaurant">Restaurant (Kitchen / Meals)</option>
                    <option value="electronics">Electronics (Serials)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Cost Price ({currency.symbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Selling Price ({currency.symbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-amber-400 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100"
                  />
                </div>
              </div>

              {!editingProd && (
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Initial Stock Count ({currentBranch.name})
                  </label>
                  <input
                    type="number"
                    value={formInitialStock}
                    onChange={(e) => setFormInitialStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsWeighted}
                    onChange={(e) => setFormIsWeighted(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Weight-Scale Item (Produce / Meat)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRequiresSerial}
                    onChange={(e) => setFormRequiresSerial(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Requires Serial Tracking</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADJUST MODAL */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 mb-1">
              Adjust Stock: {adjustModalProduct.name}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Current Branch Stock: <strong className="text-amber-400">{adjustModalProduct.stock[currentBranch.id] || 0}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Quantity Change (+ to add, - to remove)
                </label>
                <input
                  type="number"
                  placeholder="+5 or -3"
                  value={adjustQtyChange}
                  onChange={(e) => setAdjustQtyChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-sm text-slate-100"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Adjustment Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                >
                  <option value="Physical Count Audit">Physical Count Audit</option>
                  <option value="Damaged / Broken Goods">Damaged / Broken Goods</option>
                  <option value="Theft / Unaccounted Shrinkage">Theft / Unaccounted Shrinkage</option>
                  <option value="Expired Goods Discarded">Expired Goods Discarded</option>
                  <option value="Manual Supplier Intake">Manual Supplier Intake</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setAdjustModalProduct(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAdjust}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs"
                >
                  Commit Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
