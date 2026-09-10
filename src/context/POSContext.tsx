import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Branch,
  CartItem,
  CashMovement,
  CashRegisterSession,
  CurrencyConfig,
  Customer,
  Employee,
  KeyboardShortcut,
  KitchenTicket,
  Order,
  ParkedBill,
  PaymentMethod,
  Product,
  PurchaseOrder,
  ReceiptConfig,
  RestaurantTable,
  SectorMode,
  SplitTender,
  StockMovement,
  Supplier,
  TaxConfig,
} from '../types/pos';
import {
  DEFAULT_CURRENCIES,
  DEFAULT_RECEIPT_CONFIG,
  DEFAULT_SHORTCUTS,
  DEFAULT_TAX_CONFIG,
  INITIAL_BRANCHES,
  INITIAL_CUSTOMERS,
  INITIAL_EMPLOYEES,
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_TABLES,
} from '../data/seedData';
import { posAudio } from '../utils/audio';

const STORAGE_KEY = 'ahmar_ipos_v1_store';

interface POSContextType {
  // Sector & Navigation
  sector: SectorMode;
  setSector: (s: SectorMode) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Active Branch & Employee
  currentBranch: Branch;
  setBranchId: (id: string) => void;
  branches: Branch[];
  currentEmployee: Employee;
  setEmployeeId: (id: string) => void;
  employees: Employee[];
  authenticatePin: (pin: string) => Employee | null;

  // Products & Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  adjustStock: (productId: string, quantityChange: number, reason: string, type?: StockMovement['type']) => void;
  stockMovements: StockMovement[];

  // Active Cart State
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, options?: { serialNumber?: string; modifiers?: string[]; notes?: string; customPrice?: number }) => void;
  addCustomItemToCart: (name: string, price: number, quantity?: number, taxRate?: number) => void;
  updateCartItemQty: (itemId: string, qty: number) => void;
  updateCartItemDiscount: (itemId: string, type: 'percentage' | 'fixed', val: number) => void;
  updateCartItemPrice: (itemId: string, newPrice: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;

  // Cart customer & order meta
  currentCustomer: Customer | null;
  setCurrentCustomer: (c: Customer | null) => void;
  orderType: 'retail' | 'dine_in' | 'takeaway' | 'delivery';
  setOrderType: (t: 'retail' | 'dine_in' | 'takeaway' | 'delivery') => void;
  selectedTable: RestaurantTable | null;
  setSelectedTable: (t: RestaurantTable | null) => void;

  // Hold / Resume Parked Bills
  parkedBills: ParkedBill[];
  holdCurrentBill: (label?: string) => void;
  resumeParkedBill: (billId: string) => void;
  deleteParkedBill: (billId: string) => void;

  // Calculations
  cartSubtotal: number;
  cartDiscountTotal: number;
  cartTaxTotal: number;
  cartGrandTotal: number;

  // Checkout & Orders
  processCheckout: (
    paymentMethod: PaymentMethod,
    tenderedAmount?: number,
    splits?: SplitTender[],
    reference?: string
  ) => Order;
  orders: Order[];
  lastCompletedOrder: Order | null;
  setLastCompletedOrder: (order: Order | null) => void;

  // Returns / Refunds
  refundOrder: (orderId: string, itemIdsToRefund: { itemId: string; quantity: number }[], refundMethod: PaymentMethod, reason: string) => void;

  // Cash Register Sessions & Drawer
  currentSession: CashRegisterSession | null;
  openSession: (startingFloat: number) => void;
  recordCashMovement: (type: 'in' | 'out', amount: number, reason: string) => void;
  closeSession: (actualCash: number, notes?: string) => void;
  cashMovements: CashMovement[];

  // Restaurant & KDS
  tables: RestaurantTable[];
  updateTableStatus: (tableId: string, status: RestaurantTable['status'], orderId?: string) => void;
  kitchenTickets: KitchenTicket[];
  updateTicketStatus: (ticketId: string, status: KitchenTicket['status']) => void;
  toggleKitchenItemComplete: (ticketId: string, itemIndex: number) => void;

  // Customers CRM
  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'loyaltyPoints' | 'currentCredit'>) => Customer;
  updateCustomerCredit: (customerId: string, amountChange: number) => void;
  redeemCustomerLoyalty: (customerId: string, points: number) => number; // returns discount value

  // Suppliers & Purchasing
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber'>) => void;
  receivePurchaseOrder: (poId: string) => void;

  // Settings & Configurations
  taxConfig: TaxConfig;
  setTaxConfig: (cfg: TaxConfig) => void;
  receiptConfig: ReceiptConfig;
  setReceiptConfig: (cfg: ReceiptConfig) => void;
  currency: CurrencyConfig;
  setCurrency: (curr: CurrencyConfig) => void;
  availableCurrencies: CurrencyConfig[];
  shortcuts: KeyboardShortcut[];
  updateShortcut: (id: string, newKey: string, newDesc?: string) => void;
  addCustomShortcut: (shortcut: Omit<KeyboardShortcut, 'id'>) => void;
  deleteShortcut: (id: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // System Database Backup / Restore
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => boolean;
  resetToFactorySeed: () => void;

  // Modals visibility helpers
  paymentModalOpen: boolean;
  setPaymentModalOpen: (b: boolean) => void;
  receiptModalOpen: boolean;
  setReceiptModalOpen: (b: boolean) => void;
  shortcutsModalOpen: boolean;
  setShortcutsModalOpen: (b: boolean) => void;
  sessionModalOpen: boolean;
  setSessionModalOpen: (b: boolean) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or default
  const [sector, setSectorState] = useState<SectorMode>('retail');
  const [activeTab, setActiveTab] = useState<string>('pos');

  const [branches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [currentBranchId, setCurrentBranchId] = useState<string>(INITIAL_BRANCHES[0].id);

  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string>(INITIAL_EMPLOYEES[0].id);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(INITIAL_CUSTOMERS[0]);
  const [orderType, setOrderType] = useState<'retail' | 'dine_in' | 'takeaway' | 'delivery'>('retail');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  const [parkedBills, setParkedBills] = useState<ParkedBill[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  const [currentSession, setCurrentSession] = useState<CashRegisterSession | null>({
    id: 'ses_auto_1',
    branchId: 'br_flagship',
    cashierId: 'emp_1',
    cashierName: 'Ahmar Iqbal',
    openedAt: new Date().toISOString(),
    startingCash: 250.0,
    cashIn: 0,
    cashOut: 0,
    cashSales: 0,
    cardSales: 0,
    otherSales: 0,
    totalSales: 0,
    refundsTotal: 0,
    expectedCash: 250.0,
    status: 'open',
  });
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);

  const [tables, setTables] = useState<RestaurantTable[]>(INITIAL_TABLES);
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>([]);

  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [suppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [taxConfig, setTaxConfig] = useState<TaxConfig>(DEFAULT_TAX_CONFIG);
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>(DEFAULT_RECEIPT_CONFIG);
  const [currency, setCurrency] = useState<CurrencyConfig>(DEFAULT_CURRENCIES[0]);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(DEFAULT_SHORTCUTS);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);
  const [sessionModalOpen, setSessionModalOpen] = useState<boolean>(false);

  // Sync sound engine state
  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    posAudio.soundEnabled = enabled;
  };

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.taxConfig) setTaxConfig(parsed.taxConfig);
        if (parsed.receiptConfig) setReceiptConfig(parsed.receiptConfig);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.shortcuts) setShortcuts(parsed.shortcuts);
        if (parsed.sector) setSectorState(parsed.sector);
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        if (parsed.purchaseOrders) setPurchaseOrders(parsed.purchaseOrders);
        if (parsed.currentSession) setCurrentSession(parsed.currentSession);
      }
    } catch {
      // LocalStorage error fallback
    }
  }, []);

  // Save to LocalStorage on updates
  useEffect(() => {
    try {
      const snapshot = {
        products,
        customers,
        orders,
        taxConfig,
        receiptConfig,
        currency,
        shortcuts,
        sector,
        stockMovements,
        purchaseOrders,
        currentSession,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore quota exceeded
    }
  }, [products, customers, orders, taxConfig, receiptConfig, currency, shortcuts, sector, stockMovements, purchaseOrders, currentSession]);

  const currentBranch = branches.find((b) => b.id === currentBranchId) || branches[0];
  const currentEmployee = employees.find((e) => e.id === currentEmployeeId) || employees[0];

  const setBranchId = (id: string) => {
    const found = branches.find((b) => b.id === id);
    if (found) setCurrentBranchId(id);
  };

  const setEmployeeId = (id: string) => {
    const found = employees.find((e) => e.id === id);
    if (found) setCurrentEmployeeId(id);
  };

  const authenticatePin = (pin: string): Employee | null => {
    const found = employees.find((e) => e.pin === pin);
    if (found) {
      setCurrentEmployeeId(found.id);
      return found;
    }
    return null;
  };

  const setSector = (newSector: SectorMode) => {
    setSectorState(newSector);
    if (newSector === 'restaurant') {
      setOrderType('dine_in');
    } else {
      setOrderType('retail');
      setSelectedTable(null);
    }
  };

  // --- CART OPERATIONS ---
  const addToCart = (
    product: Product,
    quantity = 1,
    options?: { serialNumber?: string; modifiers?: string[]; notes?: string; customPrice?: number }
  ) => {
    posAudio.playScanBeep();

    setCart((prev) => {
      // If product has serial number or modifiers, treat as separate line item
      const hasUniqueProps = options?.serialNumber || (options?.modifiers && options.modifiers.length > 0);
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && !hasUniqueProps && !item.isCustom
      );

      if (existingIndex > -1 && !hasUniqueProps) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      const itemTax = product.taxRate !== undefined ? product.taxRate : taxConfig.taxRate;
      const finalPrice = options?.customPrice !== undefined ? options.customPrice : product.sellingPrice;

      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        unitPrice: finalPrice,
        costPrice: product.costPrice,
        quantity,
        unit: product.unit,
        discountType: 'percentage',
        discountValue: 0,
        selectedModifiers: options?.modifiers || [],
        serialNumber: options?.serialNumber,
        notes: options?.notes,
        taxRate: itemTax,
      };

      return [...prev, newItem];
    });
  };

  const addCustomItemToCart = (name: string, price: number, quantity = 1, itemTax = taxConfig.taxRate) => {
    posAudio.playScanBeep();
    const newItem: CartItem = {
      id: `cart_cust_${Date.now()}`,
      productId: 'custom_item',
      name: name.trim() || 'Custom Item',
      sku: 'CUSTOM-01',
      barcode: '9999999999',
      unitPrice: price,
      costPrice: price * 0.5,
      quantity,
      unit: 'pcs',
      discountType: 'percentage',
      discountValue: 0,
      taxRate: itemTax,
      isCustom: true,
    };
    setCart((prev) => [...prev, newItem]);
  };

  const updateCartItemQty = (itemId: string, qty: number) => {
    posAudio.playClick();
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: qty } : item))
    );
  };

  const updateCartItemDiscount = (itemId: string, type: 'percentage' | 'fixed', val: number) => {
    posAudio.playClick();
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, discountType: type, discountValue: Math.max(0, val) } : item))
    );
  };

  const updateCartItemPrice = (itemId: string, newPrice: number) => {
    posAudio.playClick();
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, unitPrice: Math.max(0, newPrice) } : item))
    );
  };

  const removeFromCart = (itemId: string) => {
    posAudio.playClick();
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    posAudio.playClick();
    setCart([]);
    setSelectedTable(null);
  };

  // --- CART TOTALS ---
  const cartSubtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const cartDiscountTotal = cart.reduce((acc, item) => {
    const lineTotal = item.unitPrice * item.quantity;
    if (item.discountType === 'percentage') {
      return acc + (lineTotal * item.discountValue) / 100;
    }
    return acc + Math.min(lineTotal, item.discountValue);
  }, 0);

  const discountedSubtotal = Math.max(0, cartSubtotal - cartDiscountTotal);

  const cartTaxTotal = taxConfig.enableTax
    ? taxConfig.isInclusive
      ? discountedSubtotal - discountedSubtotal / (1 + taxConfig.taxRate / 100)
      : (discountedSubtotal * taxConfig.taxRate) / 100
    : 0;

  const cartGrandTotal = taxConfig.isInclusive
    ? discountedSubtotal
    : discountedSubtotal + cartTaxTotal;

  // --- PARK & RESUME ---
  const holdCurrentBill = (label?: string) => {
    if (cart.length === 0) return;
    posAudio.playClick();
    const billLabel =
      label ||
      (selectedTable ? `Table ${selectedTable.tableNumber}` : `${currentCustomer?.name || 'Walk-in'} (${cart.length} items)`);

    const newParked: ParkedBill = {
      id: `park_${Date.now()}`,
      label: billLabel,
      orderType,
      tableNumber: selectedTable?.tableNumber,
      customer: currentCustomer,
      items: [...cart],
      parkedAt: new Date().toISOString(),
      cashierName: currentEmployee.name,
    };

    setParkedBills((prev) => [newParked, ...prev]);
    setCart([]);
    setSelectedTable(null);
  };

  const resumeParkedBill = (billId: string) => {
    const bill = parkedBills.find((b) => b.id === billId);
    if (!bill) return;
    posAudio.playClick();
    setCart(bill.items);
    setOrderType(bill.orderType);
    setCurrentCustomer(bill.customer || INITIAL_CUSTOMERS[0]);
    if (bill.tableNumber) {
      const tbl = tables.find((t) => t.tableNumber === bill.tableNumber);
      if (tbl) setSelectedTable(tbl);
    }
    setParkedBills((prev) => prev.filter((b) => b.id !== billId));
  };

  const deleteParkedBill = (billId: string) => {
    posAudio.playClick();
    setParkedBills((prev) => prev.filter((b) => b.id !== billId));
  };

  // --- CHECKOUT & ORDER CREATION ---
  const processCheckout = (
    paymentMethod: PaymentMethod,
    tenderedAmount?: number,
    splits?: SplitTender[],
    reference?: string
  ): Order => {
    const orderSeq = (orders.length + 1).toString().padStart(4, '0');
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `ORD-${todayStr}-${orderSeq}`;

    const tendered = tenderedAmount ?? cartGrandTotal;
    const change = Math.max(0, tendered - cartGrandTotal);

    // Calculate loyalty earned: 1 pt per 10 currency spent
    const loyaltyEarned = Math.floor(cartGrandTotal / 10);

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      branchId: currentBranch.id,
      cashierId: currentEmployee.id,
      cashierName: currentEmployee.name,
      customerId: currentCustomer?.id,
      customerName: currentCustomer?.name,
      sector,
      orderType,
      tableNumber: selectedTable?.tableNumber,
      items: [...cart],
      subtotal: cartSubtotal,
      discountTotal: cartDiscountTotal,
      taxTotal: cartTaxTotal,
      grandTotal: cartGrandTotal,
      paymentMethod,
      paymentDetails: {
        tendered,
        change,
        reference,
        splits,
      },
      status: 'completed',
      createdAt: new Date().toISOString(),
      loyaltyEarned,
      loyaltyRedeemed: 0,
    };

    // Deduct stock for branch
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = cart.find((i) => i.productId === prod.id);
        if (!soldItem) return prod;
        const currentBranchStock = prod.stock[currentBranch.id] || 0;
        const updatedBranchStock = Math.max(0, currentBranchStock - soldItem.quantity);

        // Remove sold serial number if any
        let remainingSerials = prod.serialNumbers;
        if (soldItem.serialNumber && remainingSerials) {
          remainingSerials = remainingSerials.filter((s) => s !== soldItem.serialNumber);
        }

        return {
          ...prod,
          stock: { ...prod.stock, [currentBranch.id]: updatedBranchStock },
          serialNumbers: remainingSerials,
        };
      })
    );

    // Record stock movements
    cart.forEach((item) => {
      if (!item.isCustom) {
        const prod = products.find((p) => p.id === item.productId);
        const currentQty = prod?.stock[currentBranch.id] || 0;
        const movement: StockMovement = {
          id: `sm_${Date.now()}_${item.id}`,
          productId: item.productId,
          productName: item.name,
          branchId: currentBranch.id,
          type: 'sale',
          quantityChange: -item.quantity,
          newStock: Math.max(0, currentQty - item.quantity),
          reason: `Sale ${orderNumber}`,
          timestamp: new Date().toISOString(),
          user: currentEmployee.name,
        };
        setStockMovements((prev) => [movement, ...prev]);
      }
    });

    // Update Customer Credit / Loyalty Points
    if (currentCustomer && currentCustomer.id !== 'cust_walkin') {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== currentCustomer.id) return c;
          let newCredit = c.currentCredit;
          if (paymentMethod === 'credit') {
            newCredit += cartGrandTotal;
          }
          return {
            ...c,
            loyaltyPoints: c.loyaltyPoints + loyaltyEarned,
            currentCredit: newCredit,
          };
        })
      );
    }

    // Update Current Session Totals
    if (currentSession) {
      setCurrentSession((prev) => {
        if (!prev) return null;
        let cashInc = 0;
        let cardInc = 0;
        let otherInc = 0;

        if (paymentMethod === 'cash') {
          cashInc = cartGrandTotal;
        } else if (paymentMethod === 'card') {
          cardInc = cartGrandTotal;
        } else if (paymentMethod === 'split' && splits) {
          splits.forEach((sp) => {
            if (sp.method === 'cash') cashInc += sp.amount;
            else if (sp.method === 'card') cardInc += sp.amount;
            else otherInc += sp.amount;
          });
        } else {
          otherInc = cartGrandTotal;
        }

        return {
          ...prev,
          cashSales: prev.cashSales + cashInc,
          cardSales: prev.cardSales + cardInc,
          otherSales: prev.otherSales + otherInc,
          totalSales: prev.totalSales + cartGrandTotal,
          expectedCash: prev.expectedCash + cashInc,
        };
      });
    }

    // If restaurant mode, send kitchen ticket to KDS
    if (sector === 'restaurant') {
      const newKitchenTicket: KitchenTicket = {
        id: `kt_${Date.now()}`,
        orderNumber,
        orderType,
        tableNumber: selectedTable?.tableNumber,
        items: cart.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          modifiers: i.selectedModifiers,
          notes: i.notes,
          completed: false,
        })),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setKitchenTickets((prev) => [newKitchenTicket, ...prev]);

      if (selectedTable) {
        updateTableStatus(selectedTable.id, 'free');
      }
    }

    // Update employee sales totals
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === currentEmployee.id
          ? { ...e, salesTotal: e.salesTotal + cartGrandTotal }
          : e
      )
    );

    // Sounds & Triggers
    if (paymentMethod === 'cash') {
      posAudio.playCashDrawerDing();
    } else {
      posAudio.playSuccessChime();
    }

    setOrders((prev) => [newOrder, ...prev]);
    setLastCompletedOrder(newOrder);
    setCart([]);
    setSelectedTable(null);

    if (receiptConfig.autoPrintOnCheckout) {
      setReceiptModalOpen(true);
    }

    return newOrder;
  };

  // --- REFUNDS / RETURNS ---
  const refundOrder = (
    orderId: string,
    itemIdsToRefund: { itemId: string; quantity: number }[],
    refundMethod: PaymentMethod,
    reason: string
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    let refundAmount = 0;
    itemIdsToRefund.forEach((item) => {
      const originalItem = order.items.find((i) => i.id === item.itemId);
      if (originalItem) {
        const itemLinePrice = (originalItem.unitPrice * item.quantity);
        refundAmount += itemLinePrice;

        // Restore stock
        if (!originalItem.isCustom) {
          adjustStock(originalItem.productId, item.quantity, `Refund: ${order.orderNumber} - ${reason}`, 'return');
        }
      }
    });

    // Update Session
    if (currentSession && refundMethod === 'cash') {
      setCurrentSession((prev) =>
        prev
          ? {
              ...prev,
              refundsTotal: prev.refundsTotal + refundAmount,
              expectedCash: Math.max(0, prev.expectedCash - refundAmount),
            }
          : null
      );
    }

    // Update Order Status
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'refunded',
        };
      })
    );

    posAudio.playCashDrawerDing();
  };

  // --- STOCK ADJUSTMENT ---
  const adjustStock = (
    productId: string,
    quantityChange: number,
    reason: string,
    type: StockMovement['type'] = 'adjustment'
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const currentQty = p.stock[currentBranch.id] || 0;
        const newQty = Math.max(0, currentQty + quantityChange);
        return {
          ...p,
          stock: { ...p.stock, [currentBranch.id]: newQty },
        };
      })
    );

    const prod = products.find((p) => p.id === productId);
    const movement: StockMovement = {
      id: `sm_${Date.now()}`,
      productId,
      productName: prod?.name || 'Product',
      branchId: currentBranch.id,
      type,
      quantityChange,
      newStock: Math.max(0, (prod?.stock[currentBranch.id] || 0) + quantityChange),
      reason,
      timestamp: new Date().toISOString(),
      user: currentEmployee.name,
    };
    setStockMovements((prev) => [movement, ...prev]);
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...product,
      id: `prod_${Date.now()}`,
    };
    setProducts((prev) => [newProd, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  // --- SESSIONS ---
  const openSession = (startingFloat: number) => {
    posAudio.playClick();
    const newSession: CashRegisterSession = {
      id: `ses_${Date.now()}`,
      branchId: currentBranch.id,
      cashierId: currentEmployee.id,
      cashierName: currentEmployee.name,
      openedAt: new Date().toISOString(),
      startingCash: startingFloat,
      cashIn: 0,
      cashOut: 0,
      cashSales: 0,
      cardSales: 0,
      otherSales: 0,
      totalSales: 0,
      refundsTotal: 0,
      expectedCash: startingFloat,
      status: 'open',
    };
    setCurrentSession(newSession);
  };

  const recordCashMovement = (type: 'in' | 'out', amount: number, reason: string) => {
    if (!currentSession) return;
    posAudio.playCashDrawerDing();
    const movement: CashMovement = {
      id: `cm_${Date.now()}`,
      sessionId: currentSession.id,
      type,
      amount,
      reason,
      timestamp: new Date().toISOString(),
      cashierName: currentEmployee.name,
    };

    setCashMovements((prev) => [movement, ...prev]);

    setCurrentSession((prev) => {
      if (!prev) return null;
      const newCashIn = type === 'in' ? prev.cashIn + amount : prev.cashIn;
      const newCashOut = type === 'out' ? prev.cashOut + amount : prev.cashOut;
      const diff = type === 'in' ? amount : -amount;
      return {
        ...prev,
        cashIn: newCashIn,
        cashOut: newCashOut,
        expectedCash: prev.expectedCash + diff,
      };
    });
  };

  const closeSession = (actualCash: number, notes?: string) => {
    if (!currentSession) return;
    posAudio.playCashDrawerDing();
    const discrepancy = actualCash - currentSession.expectedCash;

    setCurrentSession((prev) =>
      prev
        ? {
            ...prev,
            closedAt: new Date().toISOString(),
            actualCash,
            discrepancy,
            notes,
            status: 'closed',
          }
        : null
    );
  };

  // --- RESTAURANT TABLES & KDS ---
  const updateTableStatus = (tableId: string, status: RestaurantTable['status'], orderId?: string) => {
    setTables((prev) =>
      prev.map((tbl) =>
        tbl.id === tableId
          ? {
              ...tbl,
              status,
              activeOrderId: orderId,
              openedAt: status === 'occupied' ? new Date().toISOString() : tbl.openedAt,
            }
          : tbl
      )
    );
  };

  const updateTicketStatus = (ticketId: string, status: KitchenTicket['status']) => {
    posAudio.playClick();
    setKitchenTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
    );
  };

  const toggleKitchenItemComplete = (ticketId: string, itemIndex: number) => {
    posAudio.playClick();
    setKitchenTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const updatedItems = [...t.items];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          completed: !updatedItems[itemIndex].completed,
        };
        return { ...t, items: updatedItems };
      })
    );
  };

  // --- CUSTOMERS & CRM ---
  const addCustomer = (c: Omit<Customer, 'id' | 'loyaltyPoints' | 'currentCredit'>): Customer => {
    const newCust: Customer = {
      ...c,
      id: `cust_${Date.now()}`,
      loyaltyPoints: 0,
      currentCredit: 0,
    };
    setCustomers((prev) => [...prev, newCust]);
    return newCust;
  };

  const updateCustomerCredit = (customerId: string, amountChange: number) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId ? { ...c, currentCredit: Math.max(0, c.currentCredit + amountChange) } : c
      )
    );
  };

  const redeemCustomerLoyalty = (customerId: string, pointsToRedeem: number): number => {
    // 100 points = $1.00 discount
    const discountVal = pointsToRedeem / 100;
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, loyaltyPoints: Math.max(0, c.loyaltyPoints - pointsToRedeem) }
          : c
      )
    );
    return discountVal;
  };

  // --- PURCHASING & SUPPLIERS ---
  const addPurchaseOrder = (po: Omit<PurchaseOrder, 'id' | 'poNumber'>) => {
    const seq = (purchaseOrders.length + 1).toString().padStart(4, '0');
    const poNumber = `PO-${new Date().getFullYear()}-${seq}`;
    const newPo: PurchaseOrder = {
      ...po,
      id: `po_${Date.now()}`,
      poNumber,
    };
    setPurchaseOrders((prev) => [newPo, ...prev]);
  };

  const receivePurchaseOrder = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po || po.status === 'received') return;

    // Add stock to branch
    po.items.forEach((item) => {
      adjustStock(item.productId, item.quantity, `PO Received: ${po.poNumber}`, 'purchase');
    });

    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'received' } : p))
    );
    posAudio.playSuccessChime();
  };

  // --- SHORTCUTS ENGINE ---
  const updateShortcut = (id: string, newKey: string, newDesc?: string) => {
    setShortcuts((prev) =>
      prev.map((sc) =>
        sc.id === id ? { ...sc, key: newKey, description: newDesc || sc.description } : sc
      )
    );
  };

  const addCustomShortcut = (sc: Omit<KeyboardShortcut, 'id'>) => {
    const newSc: KeyboardShortcut = {
      ...sc,
      id: `sc_${Date.now()}`,
    };
    setShortcuts((prev) => [...prev, newSc]);
  };

  const deleteShortcut = (id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  };

  // --- DATABASE BACKUP & RESTORE ---
  const exportDatabaseJson = (): string => {
    const fullState = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      products,
      customers,
      orders,
      branches,
      employees,
      tables,
      suppliers,
      purchaseOrders,
      taxConfig,
      receiptConfig,
      currency,
      shortcuts,
      sector,
      stockMovements,
      currentSession,
    };
    return JSON.stringify(fullState, null, 2);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) setProducts(data.products);
      if (data.customers) setCustomers(data.customers);
      if (data.orders) setOrders(data.orders);
      if (data.taxConfig) setTaxConfig(data.taxConfig);
      if (data.receiptConfig) setReceiptConfig(data.receiptConfig);
      if (data.currency) setCurrency(data.currency);
      if (data.shortcuts) setShortcuts(data.shortcuts);
      if (data.sector) setSectorState(data.sector);
      if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
      if (data.stockMovements) setStockMovements(data.stockMovements);
      posAudio.playSuccessChime();
      return true;
    } catch {
      posAudio.playErrorBuzz();
      return false;
    }
  };

  const resetToFactorySeed = () => {
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setOrders([]);
    setCart([]);
    setParkedBills([]);
    setStockMovements([]);
    setPurchaseOrders([]);
    setTaxConfig(DEFAULT_TAX_CONFIG);
    setReceiptConfig(DEFAULT_RECEIPT_CONFIG);
    setCurrency(DEFAULT_CURRENCIES[0]);
    setShortcuts(DEFAULT_SHORTCUTS);
    setSectorState('retail');
    localStorage.removeItem(STORAGE_KEY);
    posAudio.playSuccessChime();
  };

  return (
    <POSContext.Provider
      value={{
        sector,
        setSector,
        activeTab,
        setActiveTab,
        currentBranch,
        setBranchId,
        branches,
        currentEmployee,
        setEmployeeId,
        employees,
        authenticatePin,
        products,
        addProduct,
        updateProduct,
        adjustStock,
        stockMovements,
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
        orderType,
        setOrderType,
        selectedTable,
        setSelectedTable,
        parkedBills,
        holdCurrentBill,
        resumeParkedBill,
        deleteParkedBill,
        cartSubtotal,
        cartDiscountTotal,
        cartTaxTotal,
        cartGrandTotal,
        processCheckout,
        orders,
        lastCompletedOrder,
        setLastCompletedOrder,
        refundOrder,
        currentSession,
        openSession,
        recordCashMovement,
        closeSession,
        cashMovements,
        tables,
        updateTableStatus,
        kitchenTickets,
        updateTicketStatus,
        toggleKitchenItemComplete,
        customers,
        addCustomer,
        updateCustomerCredit,
        redeemCustomerLoyalty,
        suppliers,
        purchaseOrders,
        addPurchaseOrder,
        receivePurchaseOrder,
        taxConfig,
        setTaxConfig,
        receiptConfig,
        setReceiptConfig,
        currency,
        setCurrency,
        availableCurrencies: DEFAULT_CURRENCIES,
        shortcuts,
        updateShortcut,
        addCustomShortcut,
        deleteShortcut,
        soundEnabled,
        setSoundEnabled,
        exportDatabaseJson,
        importDatabaseJson,
        resetToFactorySeed,
        paymentModalOpen,
        setPaymentModalOpen,
        receiptModalOpen,
        setReceiptModalOpen,
        shortcutsModalOpen,
        setShortcutsModalOpen,
        sessionModalOpen,
        setSessionModalOpen,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
