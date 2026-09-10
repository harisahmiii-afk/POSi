import React from 'react';
import { Layers, Clock, Check, CheckCircle2, Flame, Utensils } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatTime } from '../../utils/formatters';

export const KDSView: React.FC = () => {
  const { kitchenTickets, updateTicketStatus, toggleKitchenItemComplete } = usePOS();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-rose-500 bg-rose-500/10 text-rose-400';
      case 'preparing':
        return 'border-amber-500 bg-amber-500/10 text-amber-400';
      case 'ready':
        return 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
      default:
        return 'border-slate-800 bg-slate-900 text-slate-400';
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Kitchen Display System (KDS)
          </h2>
          <p className="text-xs text-slate-400">
            Real-time ticket routing, preparation timers, modifier checklist & chef dispatch
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            {kitchenTickets.filter((t) => t.status === 'pending').length} Pending
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
            {kitchenTickets.filter((t) => t.status === 'preparing').length} Cooking
          </span>
        </div>
      </div>

      {/* Ticket Grid */}
      {kitchenTickets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-16">
          <Utensils className="w-12 h-12 stroke-[1.2] mb-3 text-slate-600" />
          <p className="text-sm font-bold text-slate-300">All Kitchen Orders Cleared</p>
          <p className="text-xs text-slate-500 mt-1">
            New orders rung up in Restaurant mode will immediately route to this kitchen screen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 mt-4">
          {kitchenTickets.map((ticket) => {
            const allItemsDone = ticket.items.every((i) => i.completed);
            return (
              <div
                key={ticket.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 shadow-lg"
              >
                <div>
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <span className="font-extrabold text-sm text-slate-100">
                        {ticket.tableNumber ? `Table ${ticket.tableNumber}` : ticket.orderType.toUpperCase()}
                      </span>
                      <div className="text-[10px] font-mono text-slate-400">
                        {ticket.orderNumber}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(ticket.createdAt)}</span>
                    </div>
                  </div>

                  {/* Status banner */}
                  <div className="my-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border inline-block ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2 py-1">
                    {ticket.items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleKitchenItemComplete(ticket.id, idx)}
                        className={`w-full p-2 rounded-lg border text-left flex items-start justify-between gap-2 transition-all ${
                          item.completed
                            ? 'bg-slate-950/40 border-slate-800/60 opacity-50 line-through text-slate-500'
                            : 'bg-slate-950 border-slate-800 text-slate-100 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold leading-tight">
                            <span className="text-amber-400 mr-1.5 font-mono">x{item.quantity}</span>
                            {item.name}
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="text-[10px] text-amber-400/90 italic mt-0.5">
                              • {item.modifiers.join(', ')}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-[10px] text-rose-300 font-semibold mt-0.5">
                              Note: {item.notes}
                            </div>
                          )}
                        </div>

                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 border ${
                            item.completed
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                              : 'border-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Progression Controls */}
                <div className="pt-2 border-t border-slate-800 flex gap-2">
                  {ticket.status === 'pending' && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'preparing')}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Start Cooking
                    </button>
                  )}

                  {ticket.status === 'preparing' && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'ready')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                    >
                      Mark Food Ready
                    </button>
                  )}

                  {ticket.status === 'ready' && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'served')}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
                    >
                      Dismiss / Served
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
