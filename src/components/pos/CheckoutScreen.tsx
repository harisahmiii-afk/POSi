import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Tag,
  Clock,
  User,
  Scale,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Banknote,
  Percent,
  MessageSquare,
  FileText,
  PauseCircle,
  PlayCircle,
  Hash,
  Utensils,
  ChevronRight,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Product, CartItem, Customer } from '../../types/pos';
import { formatCurrency } from '../../utils/formatters';
import { posAudio } from '../../utils/audio';

export const CheckoutScreen: React.FC = () => {
  const {
    sector,
    products,
    currentBranch,
    cart,
    addToCart,
    addCustomItemToCart,
    updateCartItemQty,
    updateCartItemDiscount,
    updateCartItemPrice,
    removeFromCart,
    clearCart,
    currentCustomer,
    setCurrentCustomer,
    customers,
    orderType,
    setOrderType,
    selectedTable,
    setSelectedTable,
    tables,
    parkedBills,
    holdCurrentBill,
    resumeParkedBill,
    deleteParkedBill,
    cartSubtotal,
    cartDiscountTotal,
    cartTaxTotal,
    cartGrandTotal,
    processCheckout,
    currency,
    taxConfig,
    setPaymentModalOpen,
  } = usePOS();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals & sub-dialogs
  const [customItemModal, setCustomItemModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');

  // Produce Weight Scale Modal
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [simulatedWeight, setSimulatedWeight] = useState<number>(1.25);

  // Serial Number Picker for Electronics
  const [serialModalProduct, setSerialModalProduct] = useState<Product | null>(null);
  const [selectedSerial, setSelectedSerial] = useState<string>('');

  // Modifiers Picker for Restaurant
  const [modifiersModalProduct, setModifiersModalProduct] = useState<Product | null>(null);
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);

  // Line item discount & note dialog
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editDiscountVal, setEditDiscountVal] = useState<string>('0');
  const [editDiscountType, setEditDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [editNote, setEditNote] = useState<string>('');

  // Parked bills drawer
  const [parkedBillsOpen, setParkedBillsOpen] = useState(false);

  // Customer picker modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  // Filter products by sector and search query
  const categories = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.sector === sector || sector === 'retail') {
        list.add(p.category);
      }
    });
    return ['all', ...Array.from(list)];
  }, [products, sector]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      // Sector filter: if user chose specific sector, prioritize it
      const matchesSector = sector === 'retail' || p.sector === sector;
      if (!matchesSector) return false;

      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, sector, selectedCategory, searchQuery]);

  // Handle direct barcode scanner submission (on enter)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // 1. Exact match by barcode or SKU
    const exactMatch = products.find(
      (p) =>
        p.barcode.toLowerCase() === query.toLowerCase() ||
        p.sku.toLowerCase() === query.toLowerCase()
    );

    if (exactMatch) {
      handleProductSelect(exactMatch);
      setSearchQuery('');
      return;
    }

    // 2. If single item matches in filtered list
    if (filteredProducts.length === 1) {
      handleProductSelect(filteredProducts[0]);
      setSearchQuery('');
      return;
    }

    if (filteredProducts.length === 0) {
      posAudio.playErrorBuzz();
    }
  };

  const handleProductSelect = (product: Product) => {
    // If it's a weighted grocery item, open scale simulation
    if (product.isWeighted) {
      setWeightModalProduct(product);
      setSimulatedWeight(1.0);
      return;
    }

    // If it requires serial number (electronics), open serial modal
    if (product.requiresSerial && product.serialNumbers && product.serialNumbers.length > 0) {
      setSerialModalProduct(product);
      setSelectedSerial(product.serialNumbers[0]);
      return;
    }

    // If it has restaurant modifiers
    if (sector === 'restaurant' && product.modifiers && product.modifiers.length > 0) {
      setModifiersModalProduct(product);
      setActiveModifiers([]);
      return;
    }

    // Standard add to cart
    addToCart(product, 1);
  };

  const confirmWeightedItem = () => {
    if (!weightModalProduct) return;
    addToCart(weightModalProduct, parseFloat(simulatedWeight.toFixed(2)));
    setWeightModalProduct(null);
  };

  const confirmSerialItem = () => {
    if (!serialModalProduct) return;
    addToCart(serialModalProduct, 1, { serialNumber: selectedSerial });
    setSerialModalProduct(null);
  };

  const confirmModifiersItem = () => {
    if (!modifiersModalProduct) return;
    addToCart(modifiersModalProduct, 1, { modifiers: activeModifiers });
    setModifiersModalProduct(null);
  };

  const handleSaveItemEdit = () => {
    if (!editingItem) return;
    updateCartItemDiscount(
      editingItem.id,
      editDiscountType,
      parseFloat(editDiscountVal) || 0
    );
    setEditingItem(null);
  };

  // Quick exact cash payment
  const handleQuickCash = () => {
    if (cart.length === 0) return;
    processCheckout('cash', cartGrandTotal);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* LEFT SECTION: Catalog & Quick Search (60-65% width on desktop) */}
      <div className="flex-1 flex flex-col border-r border-slate-800/80 overflow-hidden">
        {/* Search & Action Bar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center gap-2">
          {/* Barcode / SKU / Text Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Barcode className="w-4 h-4 text-amber-400" />
            </div>
            <input
              ref={searchInputRef}
              id="pos-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan Barcode or Search SKU, Name, Tag... (Press Enter)"
              className="w-full pl-9 pr-24 py-2 bg-slate-950 border border-slate-700/90 rounded-lg text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
              <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                F2
              </span>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded text-xs flex items-center gap-1 shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>

          {/* Quick Custom Item Button */}
          <button
            id="quick-custom-item-btn"
            onClick={() => setCustomItemModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Add Custom / Open Price Item (F6)"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Item</span>
            <kbd className="text-[9px] bg-slate-900 px-1 rounded font-mono text-slate-400">F6</kbd>
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'All Items' : cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <Search className="w-12 h-12 stroke-[1.2] mb-3 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No products matching "{searchQuery}"</p>
              <p className="text-xs text-slate-500 mt-1">Try scanning a barcode or click "Open Item" to ring up a custom price.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((product) => {
                const branchStock = product.stock[currentBranch.id] ?? 0;
                const isLowStock = branchStock <= product.minStockAlert;
                const isOutOfStock = branchStock <= 0;

                return (
                  <button
                    key={product.id}
                    id={`product-card-${product.id}`}
                    onClick={() => handleProductSelect(product)}
                    className="group flex flex-col justify-between p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/90 hover:border-amber-500/60 transition-all text-left relative overflow-hidden shadow-xs hover:shadow-md cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60">
                          {product.sku}
                        </span>
                        {product.isWeighted && (
                          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            <Scale className="w-3 h-3" /> Scale
                          </span>
                        )}
                        {product.requiresSerial && (
                          <span className="flex items-center gap-1 text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/30">
                            <Hash className="w-3 h-3" /> Serial
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-400 line-clamp-2 leading-tight">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{product.category}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-amber-400">
                          {formatCurrency(product.sellingPrice, currency)}
                          <span className="text-[10px] font-normal text-slate-400">
                            /{product.unit}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isLowStock
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-slate-400'
                        }`}
                      >
                        {branchStock} {product.unit}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & Order Summary (35-40% width on desktop) */}
      <div className="w-full lg:w-[420px] flex flex-col bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 overflow-hidden shadow-2xl">
        {/* Cart Top Meta Bar: Order Type, Table, Customer */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 space-y-2">
          {/* Order Type and Table Select */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              {(['retail', 'dine_in', 'takeaway', 'delivery'] as const).map((type) => {
                if (sector !== 'restaurant' && (type === 'dine_in' || type === 'takeaway')) return null;
                const labels: Record<string, string> = {
                  retail: 'Walk-in',
                  dine_in: 'Dine-In',
                  takeaway: 'Takeout',
                  delivery: 'Delivery',
                };
                return (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`px-2 py-1 rounded-md font-semibold text-[11px] transition-all capitalize ${
                      orderType === type
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {labels[type]}
                  </button>
                );
              })}
            </div>

            {/* If restaurant dine-in: table badge */}
            {sector === 'restaurant' && orderType === 'dine_in' && (
              <select
                aria-label="Dining Table"
                value={selectedTable?.id || ''}
                onChange={(e) => {
                  const tbl = tables.find((t) => t.id === e.target.value);
                  setSelectedTable(tbl || null);
                }}
                className="bg-slate-950 border border-slate-700 text-amber-400 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="">Select Table...</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tableNumber} ({t.capacity} seats - {t.status})
                  </option>
                ))}
              </select>
            )}

            {/* Parked Bills Button */}
            <button
              id="view-parked-bills-btn"
              onClick={() => setParkedBillsOpen(true)}
              className="relative p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
              title="Parked / Held Bills (F5)"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Bills</span>
              {parkedBills.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {parkedBills.length}
                </span>
              )}
            </button>
          </div>

          {/* Customer CRM Widget */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-amber-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {currentCustomer ? currentCustomer.name : 'Walk-in Guest'}
                </div>
                {currentCustomer && currentCustomer.id !== 'cust_walkin' && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span className="text-amber-400 font-semibold">{currentCustomer.loyaltyPoints} pts</span>
                    {currentCustomer.currentCredit > 0 && (
                      <span className="text-rose-400">
                        Due: {formatCurrency(currentCustomer.currentCredit, currency)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              id="select-customer-btn"
              onClick={() => setCustomerModalOpen(true)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 border border-slate-700"
            >
              <span>Change</span>
              <kbd className="text-[9px] bg-slate-900 px-1 rounded font-mono text-slate-400">F3</kbd>
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8">
              <ShoppingBag className="w-10 h-10 stroke-[1.2] mb-2 text-slate-600" />
              <p className="text-xs font-bold text-slate-300">Cart is Empty</p>
              <p className="text-[11px] text-slate-500 text-center max-w-[200px] mt-0.5">
                Scan product barcode or tap an item on the left to add to bill
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const lineTotal = item.unitPrice * item.quantity;
              const discountVal =
                item.discountType === 'percentage'
                  ? (lineTotal * item.discountValue) / 100
                  : Math.min(lineTotal, item.discountValue);
              const netTotal = Math.max(0, lineTotal - discountVal);

              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-100 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="font-mono">{formatCurrency(item.unitPrice, currency)}</span>
                        {item.serialNumber && (
                          <span className="bg-sky-500/20 text-sky-300 px-1 rounded font-mono text-[9px]">
                            SN: {item.serialNumber}
                          </span>
                        )}
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <span className="text-amber-400 font-medium text-[10px]">
                            ({item.selectedModifiers.join(', ')})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-100 font-mono">
                        {formatCurrency(netTotal, currency)}
                      </div>
                      {discountVal > 0 && (
                        <div className="text-[9px] text-emerald-400 line-through">
                          {formatCurrency(lineTotal, currency)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Spinner & Line Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCartItemQty(item.id, item.quantity - (item.unit === 'kg' ? 0.25 : 1))}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold font-mono px-2 text-amber-400 min-w-[32px] text-center">
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        onClick={() => updateCartItemQty(item.id, item.quantity + (item.unit === 'kg' ? 0.25 : 1))}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Discount & Note edit button */}
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setEditDiscountVal(item.discountValue.toString());
                          setEditDiscountType(item.discountType);
                          setEditNote(item.notes || '');
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 text-[10px] flex items-center gap-0.5"
                        title="Add Discount or Note"
                      >
                        <Percent className="w-3 h-3" />
                        {item.discountValue > 0 && (
                          <span className="text-emerald-400 font-bold">
                            -{item.discountValue}%
                          </span>
                        )}
                      </button>

                      {/* Remove item */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Totals & Checkout Panel */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
          {/* Subtotal, Discount, Tax */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
              <span className="font-mono text-slate-200">{formatCurrency(cartSubtotal, currency)}</span>
            </div>

            {cartDiscountTotal > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Discount Savings</span>
                <span className="font-mono">-{formatCurrency(cartDiscountTotal, currency)}</span>
              </div>
            )}

            {taxConfig.enableTax && (
              <div className="flex justify-between text-slate-400">
                <span>
                  {taxConfig.taxName} ({taxConfig.taxRate}%)
                  {taxConfig.isInclusive && ' (Inclusive)'}
                </span>
                <span className="font-mono text-slate-200">{formatCurrency(cartTaxTotal, currency)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-slate-100">Grand Total</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {formatCurrency(cartGrandTotal, currency)}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons Row */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              id="clear-cart-btn"
              onClick={clearCart}
              disabled={cart.length === 0}
              className="py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700/80 disabled:opacity-40 transition-colors"
              title="Clear Cart (F7)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              id="hold-bill-btn"
              onClick={() => holdCurrentBill()}
              disabled={cart.length === 0}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700/80 disabled:opacity-40 transition-colors"
              title="Park Bill (F4)"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Hold (F4)</span>
            </button>

            <button
              id="quick-cash-btn"
              onClick={handleQuickCash}
              disabled={cart.length === 0}
              className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-md disabled:opacity-40 transition-all"
              title="Exact Cash Checkout (F9)"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash (F9)</span>
            </button>
          </div>

          {/* Big Payment Modal Trigger */}
          <button
            id="pay-checkout-btn"
            onClick={() => setPaymentModalOpen(true)}
            disabled={cart.length === 0}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-40 transition-all cursor-pointer"
          >
            <CreditCard className="w-5 h-5" />
            <span>PAY / SPLIT</span>
            <span className="font-mono">({formatCurrency(cartGrandTotal, currency)})</span>
            <kbd className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono">F10</kbd>
          </button>
        </div>
      </div>

      {/* --- SUB-MODALS --- */}

      {/* 1. Quick Custom Item Modal */}
      {customItemModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Custom / Open Item
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Item Description / Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Alteration Service, Custom Bouquet"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Price ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomItemModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const priceNum = parseFloat(customPrice);
                    const qtyNum = parseInt(customQty) || 1;
                    if (priceNum > 0) {
                      addCustomItemToCart(customName || 'Custom Item', priceNum, qtyNum);
                      setCustomItemModal(false);
                      setCustomName('');
                      setCustomPrice('');
                    }
                  }}
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Weight Scale Simulation Modal for Supermarkets */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-100">Weight Scale Interface</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Weighing: <strong className="text-slate-200">{weightModalProduct.name}</strong> @{' '}
              <span className="text-amber-400">
                {formatCurrency(weightModalProduct.sellingPrice, currency)} / {weightModalProduct.unit}
              </span>
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center mb-4">
              <div className="text-[11px] text-slate-400 mb-1">Live Scale Reading (Gross - Tare)</div>
              <div className="text-4xl font-black font-mono text-emerald-400">
                {simulatedWeight.toFixed(2)}{' '}
                <span className="text-lg text-slate-400">{weightModalProduct.unit}</span>
              </div>
              <div className="text-sm font-bold text-amber-400 mt-2 font-mono">
                Line Total: {formatCurrency(weightModalProduct.sellingPrice * simulatedWeight, currency)}
              </div>
            </div>

            {/* Quick Tare/Preset Buttons */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {[0.25, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0].map((wt) => (
                <button
                  key={wt}
                  onClick={() => setSimulatedWeight(wt)}
                  className={`py-1.5 rounded text-xs font-mono font-semibold border ${
                    simulatedWeight === wt
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {wt} {weightModalProduct.unit}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setWeightModalProduct(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmWeightedItem}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
              >
                Accept Weight & Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Electronics Serial Number Selector Modal */}
      {serialModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-sky-400" />
              Select Serial Number / IMEI
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Item: <strong className="text-slate-200">{serialModalProduct.name}</strong> requires unique serial verification.
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto mb-4">
              {serialModalProduct.serialNumbers?.map((sn) => (
                <button
                  key={sn}
                  type="button"
                  onClick={() => setSelectedSerial(sn)}
                  className={`w-full p-2.5 rounded-lg border text-left font-mono text-xs flex items-center justify-between transition-all ${
                    selectedSerial === sn
                      ? 'border-sky-500 bg-sky-500/20 text-sky-200 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{sn}</span>
                  {selectedSerial === sn && <span className="text-[10px] text-sky-400">Selected</span>}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSerialModalProduct(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmSerialItem}
                disabled={!selectedSerial}
                className="flex-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md disabled:opacity-40"
              >
                Confirm Serial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Restaurant Modifiers Modal */}
      {modifiersModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 mb-2">
              <Utensils className="w-4 h-4 text-amber-400" />
              Kitchen Modifiers & Options
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Customize meal preparation for: <strong className="text-slate-200">{modifiersModalProduct.name}</strong>
            </p>

            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {modifiersModalProduct.modifiers?.map((mod) => {
                const isSelected = activeModifiers.includes(mod);
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setActiveModifiers(activeModifiers.filter((m) => m !== mod));
                      } else {
                        setActiveModifiers([...activeModifiers, mod]);
                      }
                    }}
                    className={`p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {mod}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setModifiersModalProduct(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Skip Modifiers
              </button>
              <button
                onClick={confirmModifiersItem}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
              >
                Confirm Meal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Line Item Discount & Note Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 text-emerald-400" />
              Line Item Discount & Price Adjust
            </h3>
            <p className="text-xs text-slate-300 mb-3 font-semibold">{editingItem.name}</p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Discount Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDiscountType('percentage')}
                    className={`py-1.5 rounded-lg text-xs font-bold border ${
                      editDiscountType === 'percentage'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDiscountType('fixed')}
                    className={`py-1.5 rounded-lg text-xs font-bold border ${
                      editDiscountType === 'fixed'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Fixed Amount ({currency.symbol})
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  min="0"
                  max={editDiscountType === 'percentage' ? 100 : 99999}
                  value={editDiscountVal}
                  onChange={(e) => setEditDiscountVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveItemEdit}
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Apply Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Parked / Held Bills Drawer */}
      {parkedBillsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Parked & Held Bills ({parkedBills.length})
              </h3>
              <button
                onClick={() => setParkedBillsOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            {parkedBills.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No parked bills found. You can hold current cart by pressing <kbd className="font-mono text-amber-400">F4</kbd>.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
                {parkedBills.map((bill) => {
                  const billTotal = bill.items.reduce((a, b) => a + b.unitPrice * b.quantity, 0);
                  return (
                    <div
                      key={bill.id}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-200">{bill.label}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{bill.items.length} items</span>
                          <span>•</span>
                          <span className="text-amber-400 font-mono font-semibold">
                            {formatCurrency(billTotal, currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            resumeParkedBill(bill.id);
                            setParkedBillsOpen(false);
                          }}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </button>
                        <button
                          onClick={() => deleteParkedBill(bill.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setParkedBillsOpen(false)}
              className="w-full py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 7. Customer Selector Modal */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                Select Customer & Loyalty Profile
              </h3>
              <button
                onClick={() => setCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto mb-4">
              {customers.map((cust) => {
                const isSelected = currentCustomer?.id === cust.id;
                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      setCurrentCustomer(cust);
                      setCustomerModalOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-100">{cust.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{cust.phone}</span>
                        {cust.loyaltyPoints > 0 && (
                          <span className="text-amber-400 font-semibold">{cust.loyaltyPoints} pts</span>
                        )}
                        {cust.currentCredit > 0 && (
                          <span className="text-rose-400 font-semibold">
                            Due: {formatCurrency(cust.currentCredit, currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCustomerModalOpen(false)}
              className="w-full py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
