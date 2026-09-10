import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  Building2,
  UserCheck,
  Split,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { PaymentMethod, SplitTender } from '../../types/pos';
import { formatCurrency, renderQrCodeSvg } from '../../utils/formatters';

export const PaymentModal: React.FC = () => {
  const {
    paymentModalOpen,
    setPaymentModalOpen,
    cartGrandTotal,
    currency,
    currentCustomer,
    redeemCustomerLoyalty,
    processCheckout,
  } = usePOS();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [tenderedInput, setTenderedInput] = useState<string>('');
  const [cardReference, setCardReference] = useState<string>('');
  const [splits, setSplits] = useState<SplitTender[]>([
    { method: 'cash', amount: 0 },
    { method: 'card', amount: 0 },
  ]);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<number>(0);

  if (!paymentModalOpen) return null;

  const adjustedTotal = Math.max(0, cartGrandTotal - loyaltyDiscount);
  const tenderedAmount = parseFloat(tenderedInput) || adjustedTotal;
  const changeDue = Math.max(0, tenderedAmount - adjustedTotal);

  // Quick cash increment helper
  const addCashAmount = (val: number) => {
    const current = parseFloat(tenderedInput) || 0;
    setTenderedInput((current + val).toFixed(2));
  };

  const handleExactCash = () => {
    setTenderedInput(adjustedTotal.toFixed(2));
  };

  // Split calculations
  const splitTotal = splits.reduce((acc, s) => acc + (s.amount || 0), 0);
  const splitRemaining = Math.max(0, adjustedTotal - splitTotal);

  const handleAddSplitTender = (method: PaymentMethod) => {
    if (splitRemaining <= 0) return;
    setSplits([...splits, { method, amount: parseFloat(splitRemaining.toFixed(2)) }]);
  };

  const updateSplitAmount = (index: number, val: number) => {
    const updated = [...splits];
    updated[index].amount = Math.max(0, val);
    setSplits(updated);
  };

  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  // Submit payment
  const handleFinalize = () => {
    if (selectedMethod === 'cash') {
      if (tenderedAmount < adjustedTotal) {
        alert('Tendered cash amount is less than grand total!');
        return;
      }
      processCheckout('cash', tenderedAmount);
    } else if (selectedMethod === 'split') {
      if (splitRemaining > 0.01) {
        alert(`Please allocate the remaining ${formatCurrency(splitRemaining, currency)}.`);
        return;
      }
      processCheckout('split', adjustedTotal, splits);
    } else if (selectedMethod === 'credit') {
      if (!currentCustomer || currentCustomer.id === 'cust_walkin') {
        alert('Please assign a registered customer to bill onto account credit.');
        return;
      }
      processCheckout('credit', adjustedTotal, undefined, 'Store Account Credit');
    } else {
      processCheckout(selectedMethod, adjustedTotal, undefined, cardReference || undefined);
    }

    setPaymentModalOpen(false);
    setTenderedInput('');
    setCardReference('');
    setLoyaltyDiscount(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              Complete Transaction
            </h2>
            <p className="text-xs text-slate-400">
              Select payment method or split tender across multiple sources
            </p>
          </div>
          <button
            onClick={() => setPaymentModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Due Banner */}
        <div className="my-4 p-4 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Total Amount Payable
            </span>
            <div className="text-3xl font-black text-amber-400 font-mono mt-0.5">
              {formatCurrency(adjustedTotal, currency)}
            </div>
            {loyaltyDiscount > 0 && (
              <span className="text-[11px] text-emerald-400 font-medium">
                Includes {formatCurrency(loyaltyDiscount, currency)} loyalty points reward
              </span>
            )}
          </div>

          {/* Loyalty points prompt */}
          {currentCustomer && currentCustomer.loyaltyPoints >= 100 && loyaltyDiscount === 0 && (
            <button
              onClick={() => {
                const disc = redeemCustomerLoyalty(currentCustomer.id, 100);
                setLoyaltyDiscount(disc);
              }}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Redeem 100 pts (-{formatCurrency(1, currency)})</span>
            </button>
          )}
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
          {[
            { id: 'cash', label: 'Cash', icon: Banknote },
            { id: 'card', label: 'Card / POS', icon: CreditCard },
            { id: 'qr', label: 'QR / UPI', icon: QrCode },
            { id: 'wallet', label: 'Digital Wallet', icon: Smartphone },
            { id: 'bank_transfer', label: 'Bank Wire', icon: Building2 },
            { id: 'credit', label: 'Pay On Account', icon: UserCheck },
            { id: 'split', label: 'Split Tender', icon: Split },
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMethod === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedMethod(m.id as PaymentMethod);
                  if (m.id === 'cash' && !tenderedInput) {
                    setTenderedInput(adjustedTotal.toFixed(2));
                  }
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-black shadow-md shadow-amber-500/10'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tender-Specific Workflows */}
        <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
          {/* 1. CASH WORKFLOW */}
          {selectedMethod === 'cash' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Cash Tendered ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tenderedInput}
                    onChange={(e) => setTenderedInput(e.target.value)}
                    placeholder={adjustedTotal.toFixed(2)}
                    autoFocus
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-2xl font-mono font-black text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">
                    Change Due to Customer
                  </span>
                  <div
                    className={`text-2xl font-black font-mono mt-0.5 ${
                      tenderedAmount >= adjustedTotal ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tenderedAmount >= adjustedTotal
                      ? formatCurrency(changeDue, currency)
                      : `Deficit: ${formatCurrency(adjustedTotal - tenderedAmount, currency)}`}
                  </div>
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                  Quick Denomination Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExactCash}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs"
                  >
                    Exact ({formatCurrency(adjustedTotal, currency)})
                  </button>
                  {[5, 10, 20, 50, 100, 200].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => addCashAmount(val)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs border border-slate-700"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. CARD WORKFLOW */}
          {selectedMethod === 'card' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 font-medium">
                Tap, Insert, or Swipe card on the connected POS card terminal.
              </p>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Terminal Approval Code / Auth Reference (Optional)
                </label>
                <input
                  type="text"
                  value={cardReference}
                  onChange={(e) => setCardReference(e.target.value)}
                  placeholder="e.g. AUTH-882190 / VISA-7140"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Terminal Ready: EMV Chip / Contactless NFC active
              </div>
            </div>
          )}

          {/* 3. QR CODE / DIGITAL WALLET WORKFLOW */}
          {(selectedMethod === 'qr' || selectedMethod === 'wallet') && (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div
                className="w-32 h-32 bg-white p-2 rounded-xl border border-slate-700 shadow-inner flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html: renderQrCodeSvg(`pos://pay?amt=${adjustedTotal}&cur=${currency.code}`, 110),
                }}
              />
              <div className="text-xs space-y-1 text-slate-300">
                <div className="font-bold text-amber-400 text-sm">Scan with Banking App or Wallet</div>
                <p className="text-slate-400">
                  Accepts Apple Pay, Google Pay, Alipay, WeChat Pay, Revolut & Instant QR.
                </p>
                <p className="text-slate-400">
                  Amount encoded: <strong className="text-slate-100">{formatCurrency(adjustedTotal, currency)}</strong>
                </p>
              </div>
            </div>
          )}

          {/* 4. BANK TRANSFER */}
          {selectedMethod === 'bank_transfer' && (
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-200">Corporate Wire Transfer Details</div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1 font-mono text-slate-400 text-[11px]">
                <div>Bank: Standard Chartered International</div>
                <div>IBAN: GB29 NWBK 6016 1331 9268 19</div>
                <div>Swift/BIC: SCBLGB2L</div>
                <div>Reference: ORD-{Date.now().toString().slice(-6)}</div>
              </div>
            </div>
          )}

          {/* 5. PAY ON ACCOUNT (Customer Credit) */}
          {selectedMethod === 'credit' && (
            <div className="space-y-3">
              <div className="font-bold text-xs text-slate-200">Customer Store Credit Ledger</div>
              {currentCustomer && currentCustomer.id !== 'cust_walkin' ? (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Holder:</span>
                    <strong className="text-slate-100">{currentCustomer.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Credit Limit:</span>
                    <span className="font-mono text-slate-200">{formatCurrency(currentCustomer.creditLimit, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Outstanding:</span>
                    <span className="font-mono text-rose-400">{formatCurrency(currentCustomer.currentCredit, currency)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                    <span className="text-slate-300">New Balance After Bill:</span>
                    <span className="font-mono text-amber-400">
                      {formatCurrency(currentCustomer.currentCredit + adjustedTotal, currency)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
                  Walk-in guest cannot use Store Credit. Please select or add a registered customer in the top CRM widget.
                </div>
              )}
            </div>
          )}

          {/* 6. SPLIT PAYMENT WORKFLOW */}
          {selectedMethod === 'split' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Split Tenders:</span>
                <span
                  className={`font-mono font-bold ${
                    splitRemaining <= 0.01 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  Remaining to Allocate: {formatCurrency(splitRemaining, currency)}
                </span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {splits.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-semibold text-slate-300 capitalize w-24">{s.method}</span>
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-slate-400">{currency.symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={s.amount || ''}
                        onChange={(e) => updateSplitAmount(idx, parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-100"
                      />
                    </div>
                    <button
                      onClick={() => removeSplit(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Split Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Add tender:</span>
                {(['cash', 'card', 'qr', 'wallet'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleAddSplitTender(m)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold flex items-center gap-1 border border-slate-700 capitalize"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPaymentModalOpen(false)}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            Cancel (Esc)
          </button>
          <button
            type="button"
            onClick={handleFinalize}
            className="flex-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>CONFIRM & FINALIZE ORDER</span>
          </button>
        </div>
      </div>
    </div>
  );
};
