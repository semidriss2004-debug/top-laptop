import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Users, 
  Boxes, 
  BarChart3, 
  Calendar, 
  Download, 
  MapPin, 
  PieChart 
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { orders, products, hasPermission } = useStore();
  const { t } = useLanguage();

  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'this_month' | 'prev_month' | 'all'>('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const canViewFinancials = hasPermission('view_costs_profits');

  // Filter Orders based on selected date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      if (dateFilter === 'today') {
        return orderDate.toDateString() === now.toDateString();
      }
      if (dateFilter === '7days') {
        const d7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        return orderDate >= d7;
      }
      if (dateFilter === '30days') {
        const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        return orderDate >= d30;
      }
      if (dateFilter === 'this_month') {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'prev_month') {
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear;
      }
      if (customStart && customEnd) {
        return orderDate >= new Date(customStart) && orderDate <= new Date(customEnd + 'T23:59:59');
      }
      return true;
    });
  }, [orders, dateFilter, customStart, customEnd]);

  // KPIs Calculations
  const nonCancelledOrders = filteredOrders.filter(o => o.status !== 'cancelled' && o.status !== 'returned');
  
  const totalRevenueDZD = nonCancelledOrders.reduce((sum, o) => sum + o.totalDZD, 0);
  const totalProfitDZD = nonCancelledOrders.reduce((sum, o) => sum + (o.netProfitDZD || 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const completedOrdersCount = filteredOrders.filter(o => o.status === 'delivered').length;
  const pendingOrdersCount = filteredOrders.filter(o => o.status === 'new' || o.status === 'confirmed' || o.status === 'preparing' || o.status === 'shipped').length;
  const cancelledOrdersCount = filteredOrders.filter(o => o.status === 'cancelled' || o.status === 'returned').length;
  
  const averageOrderValue = nonCancelledOrders.length > 0 ? Math.round(totalRevenueDZD / nonCancelledOrders.length) : 0;
  
  // Unique Customers Count
  const uniqueCustomersCount = new Set(filteredOrders.map(o => o.customerPhone.trim())).size;
  const lowStockCount = products.filter(p => p.stock <= (p.minStockAlert || 3)).length;

  // Best Selling Products
  const bestSellers = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    nonCancelledOrders.forEach(o => {
      o.items.forEach(item => {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.name, qty: 0, revenue: 0 };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].revenue += item.priceDZD * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [nonCancelledOrders]);

  // Orders By Wilaya
  const ordersByWilaya = useMemo(() => {
    const map: Record<string, number> = {};
    nonCancelledOrders.forEach(o => {
      const wName = o.wilaya.nameFr;
      map[wName] = (map[wName] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [nonCancelledOrders]);

  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' ' + t('dzd');

  // CSV Report Exporter
  const handleExportCSV = () => {
    const headers = ['Order ID,BL Ref,Date,Client,Phone,Wilaya,Commune,Total DZD,Profit DZD,Statut\n'];
    const rows = filteredOrders.map(o => 
      `"${o.id}","${o.bonDeLivraisonRef || ''}","${o.createdAt.slice(0, 10)}","${o.customerName}","${o.customerPhone}","${o.wilaya.nameFr}","${o.commune.nameFr}",${o.totalDZD},${canViewFinancials ? (o.netProfitDZD || 0) : 'N/A'},"${o.status}"`
    );
    const csvContent = headers.concat(rows.join('\n')).join('');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RAPPORT_VENTES_TOP_LAPTOP_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Date Filter Toolbar & Export */}
      <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Calendar className="w-4 h-4 text-cyan-400 me-1" />
          {[
            { id: 'today', label: 'Aujourd\'hui' },
            { id: '7days', label: '7 derniers jours' },
            { id: '30days', label: '30 derniers jours' },
            { id: 'this_month', label: 'Ce mois-ci' },
            { id: 'prev_month', label: 'Mois précédent' },
            { id: 'all', label: 'Tout l\'historique' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                dateFilter === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-950/40 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exporter Rapport CSV</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-[#080F1C] p-5 rounded-2xl border border-blue-900/40 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Chiffre d'Affaires</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatPrice(totalRevenueDZD)}
          </div>
          <div className="text-[11px] text-emerald-400 font-bold">
            Hors commandes annulées
          </div>
        </div>

        {/* Total Profit (Phase 6 & 7) */}
        {canViewFinancials ? (
          <div className="bg-[#080F1C] p-5 rounded-2xl border border-emerald-500/40 space-y-2">
            <div className="flex justify-between items-center text-xs text-emerald-300 font-bold">
              <span>Bénéfice Net Réel</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300 font-mono">
              +{formatPrice(totalProfitDZD)}
            </div>
            <div className="text-[11px] text-slate-400">
              Marge moyenne : <strong className="text-cyan-300">{totalRevenueDZD > 0 ? ((totalProfitDZD / totalRevenueDZD) * 100).toFixed(1) : 0}%</strong>
            </div>
          </div>
        ) : (
          <div className="bg-[#080F1C] p-5 rounded-2xl border border-blue-900/40 space-y-2 opacity-50">
            <div className="text-xs text-slate-400">Bénéfice Net</div>
            <div className="text-sm font-bold text-slate-500">Accès restreint au Comptable</div>
          </div>
        )}

        {/* Total Orders & Completed */}
        <div className="bg-[#080F1C] p-5 rounded-2xl border border-blue-900/40 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Volume de Commandes</span>
            <ShoppingCart className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {totalOrdersCount}
          </div>
          <div className="text-[11px] text-slate-400">
            <span className="text-emerald-400 font-bold">{completedOrdersCount} livrées</span> • <span className="text-amber-400 font-bold">{pendingOrdersCount} en cours</span>
          </div>
        </div>

        {/* Average Order Value (Panier Moyen) */}
        <div className="bg-[#080F1C] p-5 rounded-2xl border border-blue-900/40 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span>Panier Moyen (AOV)</span>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatPrice(averageOrderValue)}
          </div>
          <div className="text-[11px] text-slate-400">
            {uniqueCustomersCount} clients uniques
          </div>
        </div>
      </div>

      {/* Visual Analytics Sections: Best Sellers & Wilayas Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Best Sellers */}
        <div className="lg:col-span-7 bg-[#080F1C] p-5 rounded-2xl border border-blue-900/40 space-y-4">
          <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Top Produits les Plus Vendus (Période Sélectionnée)</span>
          </h4>

          {bestSellers.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Aucune vente sur cette période.
            </div>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((item, idx) => (
                <div key={idx} className="bg-[#050A14] p-3 rounded-xl border border-blue-900/30 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white truncate max-w-sm">{item.name}</span>
                    <span className="font-mono font-bold text-cyan-300">{item.qty} vendus</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>Chiffre généré :</span>
                    <span className="font-mono text-emerald-400 font-semibold">{formatPrice(item.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders by Algerian Wilayas */}
        <div className="lg:col-span-5 bg-[#080F1C] p-5 rounded-2xl border border-blue-900/40 space-y-4">
          <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Répartition par Wilaya (Top Expéditions)</span>
          </h4>

          {ordersByWilaya.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Aucune commande sur cette période.
            </div>
          ) : (
            <div className="space-y-2">
              {ordersByWilaya.map(([wilayaName, count], idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#050A14] p-2.5 rounded-xl border border-blue-900/30 text-xs">
                  <span className="font-bold text-white">{wilayaName}</span>
                  <span className="font-mono font-bold text-cyan-400 bg-blue-950 px-2 py-0.5 rounded">
                    {count} colis
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
