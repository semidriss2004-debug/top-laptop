import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, Lock, X, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { loginEmployee } = useStore();
  const { t, language } = useLanguage();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = loginEmployee(passcode);
    if (emp) {
      setPasscode('');
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#091122] rounded-3xl border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,140,255,0.25)]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-2 rounded-lg bg-blue-950/60 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white">Espace Gestionnaire RBAC</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Authentification par rôle (Super Admin, Gestionnaire, Comptable, Expéditions, Ventes)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Code d'accès incorrect ou compte suspendu.</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3.5 my-auto pointer-events-none" />
              <input
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Code d'accès employé"
                className="w-full bg-[#050A14] text-white text-sm rounded-xl ps-10 pe-4 py-3 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(0,140,255,0.4)] transition-all cursor-pointer"
          >
            Se Connecter
          </button>
        </form>
      </div>
    </div>
  );
};
