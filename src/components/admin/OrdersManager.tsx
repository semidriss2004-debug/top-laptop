import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { BonDeLivraisonModal } from '../documents/BonDeLivraisonModal';
import { 
  Search, 
  Phone, 
  MapPin, 
  MessageCircle, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Clock, 
  Truck, 
  XCircle, 
  Package, 
  FileText, 
  RotateCcw,
  ShieldCheck 
} from 'lucide-react';

export const OrdersManager: React.FC = () => {
  const { orders, updateOrderStatus, hasPermission } = useStore();
  const { t, language } = useLanguage();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrderForBL, setSelectedOrderForBL] = useState<Order | null>(null);

  const canViewCosts = hasPermission('view_costs_profits');
  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' ' + t('dzd');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      o.wilaya.nameFr.toLowerCase().includes(search.toLowerCase()) ||
      (o.bonDeLivraisonRef && o.bonDeLivraisonRef.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return { label: 'Reçue', bg: 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300', icon: Clock };
      case 'confirmed':
        return { label: 'Confirmée', bg: 'bg-blue-950/70 border-blue-500/50 text-blue-300', icon: CheckCircle };
      case 'preparing':
        return { label: 'En préparation', bg: 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300', icon: Package };
      case 'ready_shipping':
        return { label: 'Prête expédition', bg: 'bg-sky-950/70 border-sky-500/50 text-sky-300', icon: Truck };
      case 'shipped':
        return { label: 'Expédiée', bg: 'bg-purple-950/70 border-purple-500/50 text-purple-300', icon: Truck };
      case 'out_for_delivery':
        return { label: 'En livraison', bg: 'bg-amber-950/70 border-amber-500/50 text-amber-300', icon: Truck };
      case 'delivered':
        return { label: 'Livrée', bg: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300', icon: CheckCircle };
      case 'cancelled':
        return { label: 'Annulée', bg: 'bg-rose-950/70 border-rose-500/50 text-rose-300', icon: XCircle };
      case 'returned':
        return { label: 'Retournée', bg: 'bg-stone-900 border-rose-500/60 text-rose-400', icon: RotateCcw };
    }
  };

  const handleWhatsAppContact = (order: Order) => {
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '213' + cleanPhone.substring(1) : cleanPhone;
    const msg = language === 'ar'
      ? `مرحباً ${order.customerName}، نتصل بكم من TOP LAPTOP بخصوص طلبيتكم رقم (${order.id}) إلى ولاية ${order.wilaya.nameAr}.`
      : `Bonjour ${order.customerName}, nous vous contactons depuis TOP LAPTOP concernant votre commande ${order.id} vers ${order.wilaya.nameFr}.`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Search & Status Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par n° commande, BL, client..."
            className="w-full bg-[#050A14] text-xs sm:text-sm text-white rounded-xl ps-9 pe-3 py-2 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* 9 Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs no-scrollbar">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'new', label: 'Reçues' },
            { id: 'confirmed', label: 'Confirmées' },
            { id: 'preparing', label: 'Préparation' },
            { id: 'shipped', label: 'Expédiées' },
            { id: 'delivered', label: 'Livrées' },
            { id: 'cancelled', label: 'Annulées' },
            { id: 'returned', label: 'Retournées' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                statusFilter === st.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-[#080F1C] rounded-2xl border border-blue-900/40">
            Aucune commande trouvée.
          </div>
        ) : (
          filteredOrders.map(order => {
            const badge = getStatusBadge(order.status);
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-[#080F1C] rounded-2xl border border-blue-900/40 hover:border-blue-700/60 transition-all overflow-hidden"
              >
                {/* Main Summary Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-950 border border-blue-800/40 text-cyan-400 font-mono font-black text-sm">
                      {order.id}
                    </div>

                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{order.customerName}</span>
                        <span className="text-xs text-slate-400 font-normal">
                          ({order.wilaya.nameFr} • {order.commune.nameFr})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-cyan-400" />
                          <span>{order.customerPhone}</span>
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {order.deliveryCompanyName || 'Yalidine'} ({order.deliveryMethod === 'home' ? 'Domicile' : 'Stop Desk'})
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString('fr-DZ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status, Pricing, and BL Trigger */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                    {/* Status Dropdown */}
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border focus:outline-none cursor-pointer ${badge.bg}`}
                    >
                      <option value="new" className="bg-[#091122] text-cyan-300">Reçue (Nouvelle)</option>
                      <option value="confirmed" className="bg-[#091122] text-blue-300">Confirmée</option>
                      <option value="preparing" className="bg-[#091122] text-indigo-300">En préparation</option>
                      <option value="ready_shipping" className="bg-[#091122] text-sky-300">Prête expédition</option>
                      <option value="shipped" className="bg-[#091122] text-purple-300">Expédiée</option>
                      <option value="out_for_delivery" className="bg-[#091122] text-amber-300">En livraison</option>
                      <option value="delivered" className="bg-[#091122] text-emerald-300">Livrée</option>
                      <option value="cancelled" className="bg-[#091122] text-rose-300">Annulée</option>
                      <option value="returned" className="bg-[#091122] text-rose-400">Retournée</option>
                    </select>

                    {/* Total Price */}
                    <div className="text-end px-2">
                      <div className="text-sm sm:text-base font-black text-cyan-400 font-mono">
                        {formatPrice(order.totalDZD)}
                      </div>
                      {canViewCosts && (
                        <div className="text-[10px] text-emerald-400 font-mono">
                          Gain: +{formatPrice(order.netProfitDZD || 0)}
                        </div>
                      )}
                    </div>

                    {/* Bon de Livraison Button (Phase 5) */}
                    <button
                      onClick={() => setSelectedOrderForBL(order)}
                      className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-cyan-300 hover:text-white border border-blue-700/50 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      title="Générer & Imprimer le Bon de Livraison A4"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Bon de Livraison</span>
                    </button>

                    {/* WhatsApp Contact */}
                    <button
                      onClick={() => handleWhatsAppContact(order)}
                      className="p-2 rounded-lg bg-[#0F2618] hover:bg-[#163823] text-green-400 border border-green-500/40 text-xs"
                      title="Contacter le client sur WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    {/* Expand Collapse */}
                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-2 rounded-lg bg-blue-950/60 text-slate-400 hover:text-white border border-blue-900/40"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-blue-900/40 bg-[#050A14] text-xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Adresse de livraison :</span>
                        <span className="font-medium text-white">{order.address}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Réf Bon de Livraison :</span>
                        <span className="font-mono text-cyan-300 font-bold">{order.bonDeLivraisonRef || 'N/A'}</span>
                      </div>
                      {order.shippingTrackingNumber && (
                        <div>
                          <span className="text-slate-500 block">N° Tracking Colis :</span>
                          <span className="font-mono text-emerald-400 font-bold">{order.shippingTrackingNumber}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-1">Articles et Licences :</span>
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-[#080F1C] p-2 rounded-lg border border-blue-900/30">
                            <div>
                              <span className="text-white font-medium">
                                {item.name} <span className="text-cyan-400 font-mono font-bold">x{item.quantity}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono ms-2">(SKU: {item.sku})</span>
                              {item.assignedLicenseKey && (
                                <div className="text-[10px] font-mono text-emerald-400">
                                  Clé de licence générée : {item.assignedLicenseKey}
                                </div>
                              )}
                            </div>
                            <span className="font-mono text-cyan-300 font-bold">
                              {formatPrice(item.priceDZD * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bon de Livraison Document Modal */}
      <BonDeLivraisonModal
        isOpen={!!selectedOrderForBL}
        onClose={() => setSelectedOrderForBL(null)}
        order={selectedOrderForBL}
      />
    </div>
  );
};
