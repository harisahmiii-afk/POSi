import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { RestaurantTable } from '../../types/pos';
import { formatTime } from '../../utils/formatters';

export const RestaurantTablesView: React.FC = () => {
  const { tables, updateTableStatus, setSelectedTable, setActiveTab, setOrderType } = usePOS();
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'occupied' | 'billed' | 'reserved'>('all');

  const filteredTables = tables.filter((t) => activeFilter === 'all' || t.status === activeFilter);

  const handleOpenTable = (tbl: RestaurantTable) => {
    setSelectedTable(tbl);
    setOrderType('dine_in');
    if (tbl.status === 'free') {
      updateTableStatus(tbl.id, 'occupied');
    }
    setActiveTab('pos');
  };

  const getStatusBadge = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'free':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'occupied':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'billed':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'reserved':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Floor Plan Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            Dining Floor & Table Management
          </h2>
          <p className="text-xs text-slate-400">
            Real-time table occupancy, diner capacity, bill status, and table transfers
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {(['all', 'free', 'occupied', 'billed', 'reserved'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                activeFilter === filter
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter} (
              {filter === 'all'
                ? tables.length
                : tables.filter((t) => t.status === filter).length}
              )
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mt-4">
        {filteredTables.map((tbl) => {
          return (
            <div
              key={tbl.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-3 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-black text-slate-100 tracking-tight">
                    Table {tbl.tableNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(
                      tbl.status
                    )}`}
                  >
                    {tbl.status}
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    {tbl.capacity} Seats
                  </span>
                  {tbl.openedAt && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-400/80 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatTime(tbl.openedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Actions */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenTable(tbl)}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{tbl.status === 'free' ? 'Seat & Order' : 'Open Bill'}</span>
                </button>

                {tbl.status !== 'free' && (
                  <button
                    onClick={() => updateTableStatus(tbl.id, 'free')}
                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    Clear / Release Table
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
