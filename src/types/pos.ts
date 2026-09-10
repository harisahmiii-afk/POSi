export type SectorMode = 'retail' | 'supermarket' | 'restaurant' | 'electronics';

export type PaymentMethod = 
  | 'cash' 
  | 'card' 
  | 'qr' 
  | 'wallet' 
  | 'bank_transfer' 
  | 'credit' 
  | 'split';

export type UserRole = 'admin' | 'manager' | 'cashier';

export interface Employee {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  avatar?: string;
  branchId: string;
  commissionRate: number; // e.g. 2%
  salesTotal: number;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isMain: boolean;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  sector: SectorMode;
  costPrice: number;
  sellingPrice: number;
  stock: Record<string, number>; // branchId -> stock count
  minStockAlert: number;
  unit: 'pcs' | 'kg' | 'lb' | 'pack' | 'box';
  isWeighted?: boolean; // For supermarket scale
  serialNumbers?: string[]; // For electronics
  requiresSerial?: boolean;
  taxRate?: number; // Optional item-specific tax rate or fallback to global
  image?: string;
  modifiers?: string[]; // For restaurant (e.g. "Less sugar", "Extra cheese")
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  unitPrice: number;
  quantity: number;
  costPrice: number;
  unit: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  selectedModifiers?: string[];
  serialNumber?: string;
  notes?: string;
  taxRate: number;
  isCustom?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  creditLimit: number;
  currentCredit: number; // outstanding balance
  taxId?: string;
  notes?: string;
}

export interface SplitTender {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  branchId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  sector: SectorMode;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'retail';
  tableNumber?: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentDetails: {
    tendered?: number;
    change?: number;
    reference?: string;
    splits?: SplitTender[];
  };
  status: 'completed' | 'refunded' | 'partially_refunded' | 'cancelled' | 'parked';
  createdAt: string;
  loyaltyEarned: number;
  loyaltyRedeemed: number;
}

export interface ParkedBill {
  id: string;
  label: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'retail';
  tableNumber?: string;
  customer?: Customer | null;
  items: CartItem[];
  parkedAt: string;
  cashierName: string;
}

export interface CashRegisterSession {
  id: string;
  branchId: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  startingCash: number;
  cashIn: number;
  cashOut: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
  totalSales: number;
  refundsTotal: number;
  expectedCash: number;
  actualCash?: number;
  discrepancy?: number;
  notes?: string;
  status: 'open' | 'closed';
}

export interface CashMovement {
  id: string;
  sessionId: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  timestamp: string;
  cashierName: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  branchId: string;
  type: 'sale' | 'return' | 'adjustment' | 'purchase' | 'transfer';
  quantityChange: number;
  newStock: number;
  reason: string;
  timestamp: string;
  user: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  taxNumber: string;
  address: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  date: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  items: {
    productId: string;
    productName: string;
    quantity: number;
    costPrice: number;
    receivedQty?: number;
  }[];
  totalCost: number;
  notes?: string;
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  status: 'free' | 'occupied' | 'billed' | 'reserved';
  activeOrderId?: string;
  guestCount?: number;
  openedAt?: string;
}

export interface KitchenTicket {
  id: string;
  orderNumber: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  items: {
    name: string;
    quantity: number;
    modifiers?: string[];
    notes?: string;
    completed: boolean;
  }[];
  status: 'pending' | 'preparing' | 'ready' | 'served';
  createdAt: string;
}

export interface KeyboardShortcut {
  id: string;
  action: string;
  key: string;
  description: string;
  category: 'checkout' | 'navigation' | 'payment' | 'system';
}

export interface TaxConfig {
  taxName: string; // e.g. VAT, GST, Sales Tax
  taxRate: number; // e.g. 10 for 10%
  isInclusive: boolean; // Tax inclusive in price or added on top
  enableTax: boolean;
}

export interface ReceiptConfig {
  paperSize: '58mm' | '80mm' | 'a4';
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  taxId: string;
  footerMessage: string;
  showBarcode: boolean;
  showQR: boolean;
  autoPrintOnCheckout: boolean;
  cashDrawerTrigger: boolean;
}

export interface CurrencyConfig {
  code: string;
  name?: string;
  symbol: string;
  position: 'before' | 'after';
  decimalPlaces: number;
  exchangeRate: number; // Relative to base USD
}
