import React from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/Header';
import { CheckoutScreen } from './components/pos/CheckoutScreen';
import { RestaurantTablesView } from './components/pos/RestaurantTablesView';
import { KDSView } from './components/pos/KDSView';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { PurchasingView } from './components/purchasing/PurchasingView';
import { CustomerCRM } from './components/customers/CustomerCRM';
import { SalesReturnsView } from './components/returns/SalesReturnsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { PaymentModal } from './components/pos/PaymentModal';
import { ThermalReceiptModal } from './components/pos/ThermalReceiptModal';

const POSMainContent: React.FC = () => {
  const { activeTab } = usePOS();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans select-none">
      {/* Universal POS Header */}
      <Header />

      {/* Main Viewport */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'pos' && <CheckoutScreen />}
        {activeTab === 'tables' && <RestaurantTablesView />}
        {activeTab === 'kds' && <KDSView />}
        {activeTab === 'inventory' && <InventoryManagement />}
        {activeTab === 'purchasing' && <PurchasingView />}
        {activeTab === 'customers' && <CustomerCRM />}
        {activeTab === 'returns' && <SalesReturnsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Modals */}
      <PaymentModal />
      <ThermalReceiptModal />
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <POSMainContent />
    </POSProvider>
  );
}
