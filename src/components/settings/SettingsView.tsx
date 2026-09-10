import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Keyboard,
  Globe,
  Receipt,
  Percent,
  Database,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Building,
  Key,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { CurrencyConfig, KeyboardShortcut } from '../../types/pos';
import { DEFAULT_CURRENCIES } from '../../data/seedData';

export const SettingsView: React.FC = () => {
  const {
    currency,
    setCurrency,
    taxConfig,
    setTaxConfig,
    receiptConfig,
    setReceiptConfig,
    shortcuts,
    updateShortcut,
    addShortcut,
    deleteShortcut,
    exportDataBackup,
    importDataBackup,
    resetToFactoryDemo,
    currentBranch,
    branches,
    setCurrentBranch,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'shortcuts' | 'currency' | 'tax' | 'receipt' | 'backup'>(
    'shortcuts'
  );

  // New Shortcut Form state
  const [newActionName, setNewActionName] = useState('');
  const [newKeyBinding, setNewKeyBinding] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // File import ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyRecord = (e: React.KeyboardEvent) => {
    e.preventDefault();
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('ctrl');
    if (e.altKey) keys.push('alt');
    if (e.shiftKey) keys.push('shift');

    const keyName = e.key.toLowerCase();
    if (!['control', 'alt', 'shift'].includes(keyName)) {
      keys.push(keyName);
      setNewKeyBinding(keys.join('+'));
      setIsRecording(false);
    }
  };

  const handleAddNewShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionName || !newKeyBinding) return;

    addShortcut({
      action: newActionName,
      key: newKeyBinding,
      description: newDescription || newActionName,
    });

    setNewActionName('');
    setNewKeyBinding('');
    setNewDescription('');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        importDataBackup(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-400" />
            System Preferences & Customization
          </h2>
          <p className="text-xs text-slate-400">
            Keyboard shortcut bindings, multi-currency engine, tax rules, receipt layout & offline data backup
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
            { id: 'currency', label: 'Currencies', icon: Globe },
            { id: 'tax', label: 'Tax Engine', icon: Percent },
            { id: 'receipt', label: 'Thermal Receipt', icon: Receipt },
            { id: 'backup', label: 'Data & Backup', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: KEYBOARD SHORTCUTS ENGINE */}
      {activeTab === 'shortcuts' && (
        <div className="space-y-4 mt-4 max-w-4xl">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-amber-400" />
                  Customizable Keyboard Hotkeys
                </h3>
                <p className="text-xs text-slate-400">
                  Operate the register ultra-fast without touching a mouse. Bind custom keys to your cashier hardware.
                </p>
              </div>
            </div>

            {/* List of shortcuts */}
            <div className="divide-y divide-slate-800">
              {shortcuts.map((sc) => (
                <div key={sc.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex-1">
                    <span className="font-bold text-slate-200">{sc.description}</span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Action: {sc.action}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sc.key}
                      onChange={(e) => updateShortcut(sc.id, e.target.value)}
                      placeholder="e.g. F2 or ctrl+k"
                      className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-amber-400 uppercase text-xs"
                    />
                    <button
                      onClick={() => deleteShortcut(sc.id)}
                      className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Shortcut Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              Add Custom Key Binding
            </h4>

            <form onSubmit={handleAddNewShortcut} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target Action</label>
                <input
                  type="text"
                  required
                  value={newActionName}
                  onChange={(e) => setNewActionName(e.target.value)}
                  placeholder="e.g. open_kds, lock_pos"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Key Combination</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newKeyBinding}
                    onChange={(e) => setNewKeyBinding(e.target.value)}
                    onKeyDown={isRecording ? handleKeyRecord : undefined}
                    placeholder={isRecording ? 'Press your key combo...' : 'e.g. F10 or ctrl+b'}
                    className={`w-full bg-slate-950 border rounded-lg p-2 text-slate-100 font-mono font-bold uppercase ${
                      isRecording ? 'border-amber-400 animate-pulse' : 'border-slate-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsRecording(!isRecording)}
                    className="absolute right-1.5 top-1.5 px-2 py-0.5 bg-slate-800 text-[10px] text-amber-400 font-semibold rounded"
                  >
                    {isRecording ? 'Cancel' : 'Record'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Description</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g. Open Kitchen Screen"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shrink-0 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-CURRENCIES */}
      {activeTab === 'currency' && (
        <div className="space-y-4 mt-4 max-w-2xl">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="font-bold text-sm text-slate-100 mb-1">Active Currency</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select your business trading currency for pricing, invoices, and tender collection:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DEFAULT_CURRENCIES.map((c) => {
                const isSelected = currency.code === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-md'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-slate-100">{c.code}</span>
                      <span className="font-mono text-base font-bold text-amber-400">{c.symbol}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{c.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TAX ENGINE */}
      {activeTab === 'tax' && (
        <div className="space-y-4 mt-4 max-w-xl">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-100 mb-1">Fiscal & Tax Engine Rules</h3>
              <p className="text-slate-400">
                Configure Value-Added Tax (VAT), Goods & Services Tax (GST), or Sales Tax calculation.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={taxConfig.enableTax}
                onChange={(e) => setTaxConfig({ ...taxConfig, enableTax: e.target.checked })}
                className="accent-amber-500 rounded"
              />
              <span className="font-bold text-slate-200">Enable Tax Calculation on POS Orders</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Tax Display Name</label>
                <input
                  type="text"
                  value={taxConfig.taxName}
                  onChange={(e) => setTaxConfig({ ...taxConfig, taxName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Tax Rate Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={taxConfig.taxRate}
                  onChange={(e) => setTaxConfig({ ...taxConfig, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono font-bold"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxConfig.isInclusive}
                onChange={(e) => setTaxConfig({ ...taxConfig, isInclusive: e.target.checked })}
                className="accent-amber-500 rounded"
              />
              <span className="text-slate-300">
                Product catalog prices are tax-inclusive (common in UK, EU, UAE, Australia)
              </span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: RECEIPT DESIGN */}
      {activeTab === 'receipt' && (
        <div className="space-y-4 mt-4 max-w-xl">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-100 mb-1">Thermal Receipt Branding</h3>

            <div>
              <label className="font-semibold text-slate-400 block mb-1">Store / Business Name</label>
              <input
                type="text"
                value={receiptConfig.storeName}
                onChange={(e) => setReceiptConfig({ ...receiptConfig, storeName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Business Slogan / Tagline</label>
                <input
                  type="text"
                  value={receiptConfig.tagline}
                  onChange={(e) => setReceiptConfig({ ...receiptConfig, tagline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Tax ID / TRN</label>
                <input
                  type="text"
                  value={receiptConfig.taxId}
                  onChange={(e) => setReceiptConfig({ ...receiptConfig, taxId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Physical Address</label>
                <input
                  type="text"
                  value={receiptConfig.address}
                  onChange={(e) => setReceiptConfig({ ...receiptConfig, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Support Phone</label>
                <input
                  type="text"
                  value={receiptConfig.phone}
                  onChange={(e) => setReceiptConfig({ ...receiptConfig, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-400 block mb-1">Footer Message & Return Policy</label>
              <textarea
                value={receiptConfig.footerMessage}
                onChange={(e) => setReceiptConfig({ ...receiptConfig, footerMessage: e.target.value })}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
              />
            </div>

            <div className="flex gap-4 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={receiptConfig.showBarcode}
                  onChange={(e) => setReceiptConfig({ ...receiptConfig, showBarcode: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>Print Barcode (Code 128)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={receiptConfig.showQR}
                  onChange={(e) => setReceiptConfig({ ...receiptConfig, showQR: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>Print QR Code for Electronic Invoices</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OFFLINE DATABASE BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="space-y-4 mt-4 max-w-xl">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-100 mb-1">
                Offline-First Database Security & Disaster Recovery
              </h3>
              <p className="text-slate-400">
                Ahmar iPOS stores all products, transactions, customers, and ledger states offline in your
                local encrypted storage. No cloud dependency is required to operate.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Backup Download */}
              <button
                type="button"
                onClick={exportDataBackup}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
              >
                <Download className="w-6 h-6 text-amber-400" />
                <span className="font-bold text-slate-200">Download Full JSON Backup</span>
                <span className="text-[10px] text-slate-500">
                  Saves products, sales history, customers & preferences
                </span>
              </button>

              {/* Restore */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
              >
                <Upload className="w-6 h-6 text-sky-400" />
                <span className="font-bold text-slate-200">Restore from Backup File</span>
                <span className="text-[10px] text-slate-500">Upload a previously saved JSON snapshot</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                className="hidden"
              />
            </div>

            {/* Factory demo reset */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-rose-400">Reset to Factory Demo Seed</div>
                  <div className="text-[10px] text-slate-500">
                    Restores default multi-sector inventory, test customers and tables.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetToFactoryDemo}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
