import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { DatabaseBackup } from '../../types';
import { 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Trash2, 
  FileText 
} from 'lucide-react';

export const BackupRecoveryView: React.FC = () => {
  const { backups, createDatabaseBackup, restoreDatabaseBackup, settings, updateSettings } = useStore();

  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [uploadedJson, setUploadedJson] = useState('');
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  const handleCreateManualBackup = () => {
    const bkp = createDatabaseBackup();
    // Auto-download JSON file
    const blob = new Blob([bkp.dataJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TOP_LAPTOP_BACKUP_${new Date().toISOString().slice(0, 10)}_${bkp.dataHash}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setUploadedJson(text);
        setRestoreError('');
      } catch (err) {
        setRestoreError('Fichier de sauvegarde illisible.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = (dataToRestore: string) => {
    if (!window.confirm('ATTENTION : La restauration remplacera toutes les données actuelles de la base de données. Voulez-vous continuer ?')) {
      return;
    }

    const success = restoreDatabaseBackup(dataToRestore);
    if (success) {
      setRestoreSuccess(true);
      setRestoreError('');
      setUploadedJson('');
      setConfirmRestoreId(null);
      setTimeout(() => setRestoreSuccess(false), 4000);
    } else {
      setRestoreError('Échec de la restauration : Le fichier de sauvegarde est corrompu ou invalide.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#080F1C] p-6 rounded-2xl border border-blue-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <span>Sauvegarde & Restauration Sécurisée de la Base de Données</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Exportez des instantanés complets chiffrés (produits, commandes, clients, transporteurs, employés) avec intégrité SHA.
            </p>
          </div>

          <button
            onClick={handleCreateManualBackup}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,140,255,0.4)] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Créer & Télécharger un Backup JSON</span>
          </button>
        </div>

        {/* Feedback messages */}
        {restoreSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Base de données restaurée avec succès ! Toutes les données ont été rechargées.</span>
          </div>
        )}

        {restoreError && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{restoreError}</span>
          </div>
        )}
      </div>

      {/* Manual File Restore Section */}
      <div className="bg-[#080F1C] p-6 rounded-2xl border border-blue-900/40 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-cyan-400" />
          <span>Restaurer une Sauvegarde Externe</span>
        </h4>
        <p className="text-xs text-slate-400">
          Sélectionnez un fichier `.json` exporté précédemment depuis TOP LAPTOP.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-950 file:text-cyan-300 hover:file:bg-blue-900"
          />

          {uploadedJson && (
            <button
              onClick={() => handleConfirmRestore(uploadedJson)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Lancer la Restauration du Fichier</span>
            </button>
          )}
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-[#080F1C] rounded-2xl border border-blue-900/40 overflow-hidden">
        <div className="p-4 bg-[#050A14] border-b border-blue-900/40 flex justify-between items-center">
          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            Historique des Sauvegardes Disponibles ({backups.length})
          </h4>
        </div>

        <div className="divide-y divide-blue-900/30 text-xs">
          {backups.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              Aucune sauvegarde locale enregistrée pour l'instant. Cliquez sur "Créer & Télécharger un Backup" pour en générer une.
            </div>
          ) : (
            backups.map(b => (
              <div key={b.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-blue-950/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300 text-sm">{b.dataHash}</span>
                    <span className="text-[10px] bg-blue-950 text-slate-400 px-2 py-0.5 rounded font-mono">
                      v{b.version}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {b.summary.productsCount} Produits • {b.summary.ordersCount} Commandes • {b.summary.employeesCount} Employés
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 text-xs">
                    {new Date(b.timestamp).toLocaleString('fr-DZ')}
                  </span>

                  <button
                    onClick={() => handleConfirmRestore(b.dataJson)}
                    className="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-cyan-300 hover:text-white font-bold text-xs"
                  >
                    Restaurer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
