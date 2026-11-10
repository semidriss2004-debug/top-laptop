import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { Employee, EmployeeRole, EmployeePermission } from '../../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  History, 
  Key, 
  X 
} from 'lucide-react';

const ALL_ROLES: { role: EmployeeRole; labelFr: string; labelAr: string; desc: string }[] = [
  { role: 'SUPER_ADMIN', labelFr: 'Super Administrateur', labelAr: 'المدير العام', desc: 'Accès total à l\'ensemble du système et des sauvegardes' },
  { role: 'MANAGER', labelFr: 'Directeur d\'Opérations', labelAr: 'مدير العمليات', desc: 'Gestion globale de la boutique, commandes et clients' },
  { role: 'PRODUCT_MANAGER', labelFr: 'Gestionnaire Catalogue', labelAr: 'مسؤول المنتجات', desc: 'Gestion des PC, logiciels numériques, stocks et licences' },
  { role: 'ACCOUNTANT', labelFr: 'Comptable & Finance', labelAr: 'المحاسب المالي', desc: 'Accès aux prix d\'achat, bénéfices nets et bilans financiers' },
  { role: 'DELIVERY_MANAGER', labelFr: 'Responsable Expéditions', labelAr: 'مسؤول الشحن والتوصيل', desc: 'Gestion des transporteurs, wilayas et expéditions' },
  { role: 'SALES_AGENT', labelFr: 'Conseiller Commercial', labelAr: 'مسؤول المبيعات', desc: 'Validation des commandes et suivi client WhatsApp' }
];

const ALL_PERMISSIONS: { perm: EmployeePermission; label: string }[] = [
  { perm: 'manage_products', label: 'Gestion des produits & stocks' },
  { perm: 'view_costs_profits', label: 'Accès aux prix d\'achat et bénéfices' },
  { perm: 'manage_orders', label: 'Gestion des commandes et statuts' },
  { perm: 'manage_delivery', label: 'Gestion des transporteurs et wilayas' },
  { perm: 'view_analytics', label: 'Consultation des analyses et KPIs' },
  { perm: 'manage_employees', label: 'Gestion des employés et rôles' },
  { perm: 'manage_inventory', label: 'Mouvements d\'inventaire détaillés' },
  { perm: 'manage_backups', label: 'Sauvegardes et restauration' },
  { perm: 'manage_settings', label: 'Configuration générale de la boutique' }
];

export const EmployeesManagerView: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, activityLogs, currentEmployee } = useStore();
  const { t, language } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'logs'>('employees');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [role, setRole] = useState<EmployeeRole>('SALES_AGENT');
  const [permissions, setPermissions] = useState<EmployeePermission[]>([]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setName('');
    setEmail('');
    setPasscode('');
    setRole('SALES_AGENT');
    setPermissions(['manage_orders']);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPasscode(emp.passcode);
    setRole(emp.role);
    setPermissions(emp.customPermissions || []);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (perm: EmployeePermission) => {
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        name: name.trim(),
        email: email.trim(),
        passcode: passcode.trim(),
        role,
        customPermissions: permissions
      });
    } else {
      addEmployee({
        name: name.trim(),
        email: email.trim(),
        passcode: passcode.trim(),
        role,
        isActive: true,
        customPermissions: permissions
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs: Employees List vs Activity Log */}
      <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('employees')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'employees'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Comptes Employés ({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'logs'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
            }`}
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>Journal d'Activité ({activityLogs.length})</span>
          </button>
        </div>

        {activeSubTab === 'employees' && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,140,255,0.4)] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Ajouter un Employé</span>
          </button>
        )}
      </div>

      {/* EMPLOYEES LIST VIEW */}
      {activeSubTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => {
            const roleInfo = ALL_ROLES.find(r => r.role === emp.role) || ALL_ROLES[0];
            const isMe = currentEmployee?.id === emp.id;

            return (
              <div
                key={emp.id}
                className={`bg-[#080F1C] p-5 rounded-2xl border transition-all ${
                  emp.isActive ? 'border-blue-900/40' : 'border-rose-950/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-950 text-cyan-400 flex items-center justify-center font-bold border border-blue-800">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-1.5">
                        <span>{emp.name}</span>
                        {isMe && (
                          <span className="text-[10px] text-cyan-400 font-mono bg-blue-950 px-1.5 py-0.5 rounded">
                            Vous
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{emp.email}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    emp.isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {emp.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-950 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Rôle RBAC :</span>
                    <span className="font-bold text-cyan-300 font-mono">{roleInfo.labelFr}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    {roleInfo.desc}
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-slate-400">Code d'accès :</span>
                    <span className="font-mono text-slate-300 bg-[#050A14] px-2 py-0.5 rounded border border-blue-900/40">
                      ••••••••
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-blue-900/30 flex items-center justify-between">
                  <button
                    onClick={() => updateEmployee(emp.id, { isActive: !emp.isActive })}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    {emp.isActive ? 'Suspendre l\'accès' : 'Réactiver l\'accès'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1.5 rounded-lg bg-blue-950/60 text-slate-300 hover:text-white"
                      title="Modifier les droits"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {emp.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Supprimer l'employé ${emp.name} ?`)) {
                            deleteEmployee(emp.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:text-white"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ACTIVITY LOG AUDIT VIEW (PHASE 14) */}
      {activeSubTab === 'logs' && (
        <div className="bg-[#080F1C] rounded-2xl border border-blue-900/40 overflow-hidden">
          <div className="p-4 bg-[#050A14] border-b border-blue-900/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Historique Inaltérable des Opérations Administratives
            </h4>
            <span className="text-xs text-cyan-400 font-mono">
              {activityLogs.length} événements enregistrés
            </span>
          </div>

          <div className="divide-y divide-blue-900/30 max-h-[600px] overflow-y-auto text-xs">
            {activityLogs.map(log => (
              <div key={log.id} className="p-3.5 flex items-start justify-between gap-4 hover:bg-blue-950/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-cyan-300 border border-blue-800">
                      {log.action}
                    </span>
                    <span className="font-bold text-white">{log.employeeName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({log.employeeRole})</span>
                  </div>
                  <p className="text-slate-300 text-xs">{log.details}</p>
                </div>

                <div className="text-end text-[11px] font-mono text-slate-400 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleString('fr-DZ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Modal: Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#091122] rounded-3xl border border-blue-500/40 p-6 max-w-lg w-full space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-blue-900/40">
              <h4 className="font-bold text-white text-base">
                {editingEmployee ? 'Modifier le Compte Employé' : 'Ajouter un Employé'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nom et Prénom *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Yacine Merah"
                  className="w-full bg-[#050A14] text-white rounded-xl px-3.5 py-2.5 border border-blue-900/60"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Email professionnel *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yacine@toplaptop.dz"
                  className="w-full bg-[#050A14] text-white rounded-xl px-3.5 py-2.5 border border-blue-900/60"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Code Secret d'Accès (Passcode) *</label>
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="ex: code secret"
                  className="w-full bg-[#050A14] text-white rounded-xl px-3.5 py-2.5 border border-blue-900/60 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Rôle Principal (RBAC) *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as EmployeeRole)}
                  className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2.5 border border-blue-900/60"
                >
                  {ALL_ROLES.map(r => (
                    <option key={r.role} value={r.role} className="bg-[#091122]">
                      {r.labelFr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-blue-900/30">
                <label className="text-slate-300 font-bold block">Permissions Granulaires Détaillées</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {ALL_PERMISSIONS.map(p => (
                    <label
                      key={p.perm}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[#050A14] border border-blue-900/30 cursor-pointer text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={permissions.includes(p.perm)}
                        onChange={() => handleTogglePermission(p.perm)}
                        className="rounded text-blue-600"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-blue-900/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-blue-950/60 text-slate-400 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-cyan-500 hover:text-black text-white font-bold"
                >
                  Enregistrer l'Employé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
