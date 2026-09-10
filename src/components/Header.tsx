import React, { useState } from 'react';
import {
  Store,
  Layers,
  ShoppingBag,
  UtensilsCrossed,
  Smartphone,
  Users,
  BarChart3,
  Settings,
  Lock,
  Volume2,
  VolumeX,
  Keyboard,
  Coins,
  ArrowLeftRight,
  Truck,
  RotateCcw,
  Sparkles,
  Wifi,
  Package,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { SectorMode } from '../types/pos';
import { formatCurrency } from '../utils/formatters';

export const Header: React.FC = () => {
  const {
    sector,
    setSector,
    activeTab,
    setActiveTab,
    currentBranch,
    branches,
    setBranchId,
    currentEmployee,
    employees,
    authenticatePin,
    currentSession,
    soundEnabled,
    setSoundEnabled,
    setShortcutsModalOpen,
    setSessionModalOpen,
    currency,
  } = usePOS();

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = authenticatePin(enteredPin);
    if (emp) {
      setPinModalOpen(false);
      setEnteredPin('');
      setPinError('');
    } else {
      setPinError('Invalid Cashier PIN. Try 1234, 5678, or 0000.');
    }
  };

  const navTabs = [
    { id: 'pos', label: 'POS Checkout', icon: ShoppingBag, shortcut: 'F2' },
    ...(sector === 'restaurant'
      ? [
          { id: 'tables', label: 'Floor / Tables', icon: UtensilsCrossed },
          { id: 'kds', label: 'Kitchen KDS', icon: Layers },
        ]
      : []),
    { id: 'inventory', label: 'Stock & Ledger', icon: Package },
    { id: 'purchasing', label: 'Purchasing', icon: Truck },
    { id: 'customers', label: 'CRM & Loyalty', icon: Users, shortcut: 'F3' },
    { id: 'returns', label: 'Returns / Refunds', icon: RotateCcw },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'branches', label: 'Multi-Branch', icon: ArrowLeftRight },
    { id: 'staff', label: 'Staff Roles', icon: Users },
    { id: 'settings', label: 'Settings & Keys', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 select-none sticky top-0 z-40">
      {/* Top utility row */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 text-xs">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 shadow-md shadow-amber-500/20 text-sm tracking-tight">
              iP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">Ahmar iPOS</span>
                <span className="bg-amber-500/20 text-amber-400 font-semibold px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase border border-amber-500/30">
                  Global Enterprise
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                <span>v3.8 International</span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Offline-First LocalDB
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block"></div>

          {/* Sector Switcher Tabs */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            <button
              id="sector-retail-btn"
              onClick={() => setSector('retail')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                sector === 'retail'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Retail</span>
            </button>
            <button
              id="sector-supermarket-btn"
              onClick={() => setSector('supermarket')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                sector === 'supermarket'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Supermarket & Scales</span>
            </button>
            <button
              id="sector-restaurant-btn"
              onClick={() => setSector('restaurant')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                sector === 'restaurant'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Restaurant & Cafe</span>
            </button>
            <button
              id="sector-electronics-btn"
              onClick={() => setSector('electronics')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                sector === 'electronics'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Serialized Tech</span>
            </button>
          </div>
        </div>

        {/* Right side indicators and tools */}
        <div className="flex items-center gap-2.5">
          {/* Branch Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded-md border border-slate-800 text-slate-300">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <select
              id="branch-select"
              aria-label="Branch Selector"
              value={currentBranch.id}
              onChange={(e) => setBranchId(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer text-slate-200 pr-1"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-slate-100">
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Cash Drawer & Register Session Pill */}
          <button
            id="register-session-btn"
            onClick={() => setSessionModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/80 transition-colors text-slate-200"
            title="Register & Cash Drawer Session (F8)"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">
              {currentSession?.status === 'open' ? (
                <>
                  Drawer: <span className="text-emerald-400 font-bold">{formatCurrency(currentSession.expectedCash, currency)}</span>
                </>
              ) : (
                <span className="text-rose-400 font-semibold">Drawer Closed</span>
              )}
            </span>
          </button>

          {/* Active Cashier Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-[10px] flex items-center justify-center">
              {currentEmployee.avatar || currentEmployee.name.slice(0, 2)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-semibold text-slate-200 leading-tight">
                {currentEmployee.name}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                {currentEmployee.role}
              </span>
            </div>
            <button
              id="switch-cashier-pin-btn"
              onClick={() => setPinModalOpen(true)}
              className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400"
              title="Switch Cashier / Enter PIN"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>

          {/* Audio toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
            title={soundEnabled ? 'Scanner Beeps Enabled' : 'Sound Muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Keyboard Shortcuts Cheat Sheet */}
          <button
            id="shortcuts-btn"
            onClick={() => setShortcutsModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium"
            title="Keyboard Shortcuts (F1)"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
            <kbd className="bg-amber-500/30 px-1 py-0.2 text-[9px] rounded font-mono">F1</kbd>
          </button>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="px-4 py-1.5 flex items-center gap-1 overflow-x-auto bg-slate-900/90">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}-btn`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.shortcut && (
                <span
                  className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Switch Cashier PIN Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Switch Cashier / Enter PIN
              </h3>
              <button
                onClick={() => {
                  setPinModalOpen(false);
                  setPinError('');
                }}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Select an employee or type their 4-digit security PIN to switch register credentials:
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    authenticatePin(emp.pin);
                    setPinModalOpen(false);
                  }}
                  className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                    emp.id === currentEmployee.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-200">{emp.name}</span>
                  <span className="text-[10px] text-amber-400 capitalize">{emp.role} (PIN: {emp.pin})</span>
                </button>
              ))}
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Or enter Security PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg tracking-widest text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              {pinError && <p className="text-xs text-rose-400">{pinError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPinModalOpen(false);
                    setPinError('');
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  Authorize PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
