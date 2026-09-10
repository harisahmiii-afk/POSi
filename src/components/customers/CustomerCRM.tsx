import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Award,
  CreditCard,
  DollarSign,
  Phone,
  Mail,
  FileText,
  Check,
  X,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Customer } from '../../types/pos';
import { formatCurrency } from '../../utils/formatters';

export const CustomerCRM: React.FC = () => {
  const { customers, addCustomer, updateCustomerCredit, currency } = usePOS();
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [settleDebtCust, setSettleDebtCust] = useState<Customer | null>(null);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState('');

  // Add customer form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [creditLimit, setCreditLimit] = useState('1000');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.id !== 'cust_walkin' &&
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCustomer({
      name: name.trim(),
      phone: phone.trim() || '—',
      email: email.trim(),
      creditLimit: parseFloat(creditLimit) || 0,
      taxId: taxId.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setAddModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setCreditLimit('1000');
    setTaxId('');
    setNotes('');
  };

  const handleSettleDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleDebtCust) return;
    const payment = parseFloat(debtPaymentAmount);
    if (!isNaN(payment) && payment > 0) {
      updateCustomerCredit(settleDebtCust.id, -payment);
    }
    setSettleDebtCust(null);
    setDebtPaymentAmount('');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Customer CRM, Loyalty & Receivables
          </h2>
          <p className="text-xs text-slate-400">
            Client accounts, automated rewards points, store credit limits and receivable debt settlements
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="my-4 max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search client by name, phone or email..."
          className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 shadow-md"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{cust.name}</h4>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span className="font-mono">{cust.phone}</span>
                  </div>
                  {cust.email && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{cust.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                  <Award className="w-3.5 h-3.5" />
                  <span>{cust.loyaltyPoints} pts</span>
                </div>
              </div>

              {/* Credit / Receivables status */}
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Credit Limit:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(cust.creditLimit, currency)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">Outstanding Due:</span>
                  <span className={`font-mono ${cust.currentCredit > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(cust.currentCredit, currency)}
                  </span>
                </div>
              </div>
            </div>

            {cust.currentCredit > 0 && (
              <button
                onClick={() => {
                  setSettleDebtCust(cust);
                  setDebtPaymentAmount(cust.currentCredit.toString());
                }}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-xs"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Record Debt Payment</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ADD CUSTOMER MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-sm text-slate-100">Add New Customer</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Liam Smith"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 019 2831"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@mail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Store Credit Limit</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tax / VAT ID</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="TRN-0000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE DEBT MODAL */}
      {settleDebtCust && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 mb-1">Record Account Debt Payment</h3>
            <p className="text-xs text-slate-400 mb-3">
              Customer: <strong className="text-slate-200">{settleDebtCust.name}</strong> has{' '}
              <span className="text-rose-400 font-bold font-mono">
                {formatCurrency(settleDebtCust.currentCredit, currency)}
              </span>{' '}
              receivables due.
            </p>

            <form onSubmit={handleSettleDebt} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Payment Amount Received ({currency.symbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={debtPaymentAmount}
                  onChange={(e) => setDebtPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-base font-bold text-slate-100"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleDebtCust(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                >
                  Settle Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
