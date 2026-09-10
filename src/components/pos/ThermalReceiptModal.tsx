import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Download,
  Copy,
  Check,
  Coins,
  Share2,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatCurrency, formatDateTime, renderBarcodeSvg, renderQrCodeSvg } from '../../utils/formatters';
import { posAudio } from '../../utils/audio';

export const ThermalReceiptModal: React.FC = () => {
  const {
    receiptModalOpen,
    setReceiptModalOpen,
    lastCompletedOrder,
    receiptConfig,
    currency,
    taxConfig,
  } = usePOS();

  const [paperFormat, setPaperFormat] = useState<'80mm' | '58mm' | 'a4'>(receiptConfig.paperSize);
  const [copied, setCopied] = useState(false);

  if (!receiptModalOpen || !lastCompletedOrder) return null;

  const order = lastCompletedOrder;

  const handlePrint = () => {
    posAudio.playClick();
    window.print();
  };

  const handleCopyText = () => {
    let text = `=== ${receiptConfig.storeName} ===\n`;
    text += `${receiptConfig.address}\nTel: ${receiptConfig.phone}\n`;
    text += `Tax Reg: ${receiptConfig.taxId}\n`;
    text += `Order: ${order.orderNumber}\n`;
    text += `Date: ${formatDateTime(order.createdAt)}\n`;
    text += `Cashier: ${order.cashierName}\n`;
    text += `--------------------------------\n`;
    order.items.forEach((item) => {
      text += `${item.name} x${item.quantity} = ${formatCurrency(item.unitPrice * item.quantity, currency)}\n`;
    });
    text += `--------------------------------\n`;
    text += `Subtotal: ${formatCurrency(order.subtotal, currency)}\n`;
    text += `Tax: ${formatCurrency(order.taxTotal, currency)}\n`;
    text += `GRAND TOTAL: ${formatCurrency(order.grandTotal, currency)}\n`;
    text += `Payment: ${order.paymentMethod.toUpperCase()}\n`;
    if (order.paymentDetails.change) {
      text += `Change Due: ${formatCurrency(order.paymentDetails.change, currency)}\n`;
    }
    text += `================================\n`;
    text += `${receiptConfig.footerMessage}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const kickCashDrawer = () => {
    posAudio.playCashDrawerDing();
  };

  const widthStyle =
    paperFormat === '58mm'
      ? 'w-[280px]'
      : paperFormat === '80mm'
      ? 'w-[360px]'
      : 'w-[520px]';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 shadow-2xl flex flex-col max-h-[95vh]">
        {/* Controls Header (Non-printable) */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">Receipt & Invoice Workflow</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Size selector */}
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              {(['80mm', '58mm', 'a4'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setPaperFormat(fmt)}
                  className={`px-2 py-1 rounded font-bold uppercase ${
                    paperFormat === fmt
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <button
              onClick={() => setReceiptModalOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar (Non-printable) */}
        <div className="py-2.5 flex items-center justify-between gap-2 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print to POS Printer</span>
            </button>

            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>

          <button
            onClick={kickCashDrawer}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg text-xs flex items-center gap-1 border border-slate-700"
            title="Open physical cash drawer via printer signal"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Kick Drawer</span>
          </button>
        </div>

        {/* Printable Receipt Paper Stage */}
        <div className="flex-1 overflow-y-auto py-4 flex justify-center bg-slate-950 rounded-xl my-3 p-4">
          <div
            id="printable-receipt"
            className={`printable-receipt-container bg-white text-black p-5 shadow-2xl font-mono text-xs leading-tight ${widthStyle} transition-all duration-200`}
            style={{ fontFamily: `'JetBrains Mono', monospace` }}
          >
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-400">
              <div className="font-extrabold text-sm uppercase tracking-wider">{receiptConfig.storeName}</div>
              <div className="text-[10px] text-gray-700">{receiptConfig.tagline}</div>
              <div className="text-[10px] text-gray-700">{receiptConfig.address}</div>
              <div className="text-[10px] text-gray-700">Tel: {receiptConfig.phone}</div>
              <div className="text-[10px] font-bold text-gray-800">Tax Reg / TRN: {receiptConfig.taxId}</div>
            </div>

            {/* Meta info */}
            <div className="py-2 space-y-0.5 text-[11px] border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date/Time:</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{order.cashierName}</span>
              </div>
              {order.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{order.customerName}</span>
                </div>
              )}
              {order.tableNumber && (
                <div className="flex justify-between font-bold">
                  <span>Dining Table:</span>
                  <span>{order.tableNumber}</span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between font-bold pb-1 text-[11px] uppercase border-b border-gray-200">
                <span>Item [Qty x Price]</span>
                <span>Total</span>
              </div>

              <div className="space-y-1 pt-1.5">
                {order.items.map((item, idx) => {
                  const lineTotal = item.unitPrice * item.quantity;
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between">
                        <span className="font-semibold">{item.name}</span>
                        <span>{formatCurrency(lineTotal, currency)}</span>
                      </div>
                      <div className="text-[10px] text-gray-600 flex items-center justify-between">
                        <span>
                          {item.quantity} {item.unit} @ {formatCurrency(item.unitPrice, currency)}
                        </span>
                        {item.serialNumber && (
                          <span className="font-bold">SN: {item.serialNumber}</span>
                        )}
                      </div>
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <div className="text-[9px] text-gray-500 italic">
                          + {item.selectedModifiers.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal, currency)}</span>
              </div>

              {order.discountTotal > 0 && (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Discounts Applied:</span>
                  <span>-{formatCurrency(order.discountTotal, currency)}</span>
                </div>
              )}

              {taxConfig.enableTax && (
                <div className="flex justify-between">
                  <span>{taxConfig.taxName} ({taxConfig.taxRate}%):</span>
                  <span>{formatCurrency(order.taxTotal, currency)}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-300">
                <span>TOTAL DUE:</span>
                <span>{formatCurrency(order.grandTotal, currency)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 space-y-0.5 text-[11px] border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>Paid via:</span>
                <span className="font-bold uppercase">{order.paymentMethod}</span>
              </div>
              {order.paymentDetails.tendered !== undefined && (
                <div className="flex justify-between">
                  <span>Amount Tendered:</span>
                  <span>{formatCurrency(order.paymentDetails.tendered, currency)}</span>
                </div>
              )}
              {order.paymentDetails.change !== undefined && order.paymentDetails.change > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Change Given:</span>
                  <span>{formatCurrency(order.paymentDetails.change, currency)}</span>
                </div>
              )}
              {order.paymentDetails.reference && (
                <div className="flex justify-between text-[10px]">
                  <span>Approval Ref:</span>
                  <span>{order.paymentDetails.reference}</span>
                </div>
              )}
            </div>

            {/* Loyalty points info */}
            {order.loyaltyEarned > 0 && (
              <div className="py-1.5 text-center text-[10px] text-gray-700 border-b border-dashed border-gray-400">
                ★ Points Earned Today: <strong>+{order.loyaltyEarned} pts</strong> ★
              </div>
            )}

            {/* Barcode & QR Code */}
            <div className="pt-3 pb-1 flex flex-col items-center space-y-2">
              {receiptConfig.showBarcode && (
                <div
                  className="w-full max-w-[220px]"
                  dangerouslySetInnerHTML={{
                    __html: renderBarcodeSvg(order.orderNumber, 220, 42),
                  }}
                />
              )}

              {receiptConfig.showQR && (
                <div
                  className="w-20 h-20"
                  dangerouslySetInnerHTML={{
                    __html: renderQrCodeSvg(
                      `INV:${order.orderNumber}|AMT:${order.grandTotal}|DATE:${order.createdAt}`,
                      80
                    ),
                  }}
                />
              )}
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[10px] text-gray-600 pt-2 border-t border-dashed border-gray-400">
              <p>{receiptConfig.footerMessage}</p>
              <p className="mt-1 font-semibold">Powered by Ahmar iPOS International</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setReceiptModalOpen(false)}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-lg no-print"
        >
          Dismiss & Return to Checkout
        </button>
      </div>
    </div>
  );
};
