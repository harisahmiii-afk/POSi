import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Percent,
  CreditCard,
  Printer,
  Calendar,
  Lock,
  ArrowUpRight,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const AnalyticsView: React.FC = () => {
  const { orders, currentSession, closeSession, currency, taxConfig } = usePOS();
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'zreport'>('sales');

  // Closing drawer state
  const [actualDrawerCash, setActualDrawerCash] = useState<string>('');

  // Computations
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const totalTax = completedOrders.reduce((acc, o) => acc + o.taxTotal, 0);

  // Estimate cost of goods sold (COGS) based on 60% average or real item costs
  const totalCost = completedOrders.reduce((acc, o) => {
    const orderCost = o.items.reduce((itemAcc, i) => itemAcc + (i.unitPrice * 0.55) * i.quantity, 0);
    return acc + orderCost;
  }, 0);

  const grossProfit = Math.max(0, totalRevenue - totalTax - totalCost);
  const profitMargin = totalRevenue > 0 ? (grossProfit / (totalRevenue - totalTax)) * 100 : 0;
  const avgBasketSize = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Breakdown by payment methods
  const paymentBreakdown: Record<string, number> = {};
  completedOrders.forEach((o) => {
    paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] || 0) + o.grandTotal;
  });

  // Top selling products
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  completedOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.unitPrice * item.quantity;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const handleCloseShift = () => {
    const actual = parseFloat(actualDrawerCash) || currentSession.openingCash + currentSession.totalCashSales;
    closeSession(actual);
    alert('Register shift session has been officially closed and Z-Report generated.');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Executive Analytics & Shift Z-Report
          </h2>
          <p className="text-xs text-slate-400">
            Real-time revenue, gross margins, tender reconciliation, and end-of-day register audit
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveReportTab('sales')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeReportTab === 'sales' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Performance & Profit
          </button>
          <button
            onClick={() => setActiveReportTab('zreport')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeReportTab === 'zreport' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            End of Day Z-Report
          </button>
        </div>
      </div>

      {/* TAB 1: SALES & PROFIT ANALYTICS */}
      {activeReportTab === 'sales' && (
        <div className="space-y-4 mt-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Gross Revenue
              </span>
              <div className="text-2xl font-black font-mono text-slate-100 mt-1">
                {formatCurrency(totalRevenue, currency)}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-0.5 mt-1 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{completedOrders.length} Transactions</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimated Net Profit
              </span>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {formatCurrency(grossProfit, currency)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Avg Margin: <strong className="text-emerald-400">{profitMargin.toFixed(1)}%</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Average Basket Size
              </span>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                {formatCurrency(avgBasketSize, currency)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Per transaction ticket</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {taxConfig.taxName} Collected
              </span>
              <div className="text-2xl font-black font-mono text-slate-200 mt-1">
                {formatCurrency(totalTax, currency)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {taxConfig.enableTax ? `Configured at ${taxConfig.taxRate}%` : 'Tax Exempt'}
              </div>
            </div>
          </div>

          {/* Grids: Top Products & Payment Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3">
                Top Revenue Drivers
              </h3>
              <div className="space-y-2.5">
                {topProducts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No sales recorded yet.</p>
                ) : (
                  topProducts.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-black font-mono flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.qty} units sold</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-100">
                        {formatCurrency(p.revenue, currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment Method Distribution */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3">
                Payment Channel Breakdown
              </h3>
              <div className="space-y-2.5">
                {Object.keys(paymentBreakdown).length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No payment history yet.</p>
                ) : (
                  Object.entries(paymentBreakdown).map(([method, amt]) => {
                    const pct = totalRevenue > 0 ? (amt / totalRevenue) * 100 : 0;
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize font-semibold text-slate-300">{method}</span>
                          <span className="font-mono font-bold text-slate-200">
                            {formatCurrency(amt, currency)} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTER SHIFT Z-REPORT */}
      {activeReportTab === 'zreport' && (
        <div className="mt-4 max-w-xl mx-auto space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="text-center pb-3 border-b border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                Cashier Shift Reconciliation
              </span>
              <h3 className="text-base font-black text-slate-100">Official Register Z-Report</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Session Started: {formatDateTime(currentSession.openedAt)}
              </p>
            </div>

            {/* Session numbers */}
            <div className="space-y-2 text-xs divide-y divide-slate-800/80">
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Opening Float Cash:</span>
                <span className="font-mono text-slate-200">
                  {formatCurrency(currentSession.openingCash, currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Cash Sales Collected:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  +{formatCurrency(currentSession.totalCashSales, currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Card / POS Sales:</span>
                <span className="font-mono text-slate-200 font-bold">
                  {formatCurrency(currentSession.totalCardSales, currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Digital / Other Tenders:</span>
                <span className="font-mono text-slate-200 font-bold">
                  {formatCurrency(currentSession.totalOtherSales, currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Refunds Processed:</span>
                <span className="font-mono text-rose-400 font-bold">
                  -{formatCurrency(currentSession.refundsTotal, currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-black text-amber-400">
                <span>Expected Cash In Drawer:</span>
                <span className="font-mono">
                  {formatCurrency(
                    currentSession.openingCash + currentSession.totalCashSales - currentSession.refundsTotal,
                    currency
                  )}
                </span>
              </div>
            </div>

            {/* Reconciliation field */}
            <div className="pt-3 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Physical Cash Counted at Close ({currency.symbol})
              </label>
              <input
                type="number"
                step="0.01"
                value={actualDrawerCash}
                onChange={(e) => setActualDrawerCash(e.target.value)}
                placeholder={(
                  currentSession.openingCash +
                  currentSession.totalCashSales -
                  currentSession.refundsTotal
                ).toFixed(2)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-lg font-black text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>Print Z-Report</span>
              </button>

              <button
                type="button"
                onClick={handleCloseShift}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Close Shift & Reconcile Till</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
