import React, { useState, useEffect, useRef } from 'react';
import { 
  Product, 
  ProductBrand, 
  ProductCategory, 
  ProductCondition, 
  ProductStatus,
  SoftwareSubcategory,
  BagSubcategory,
  CompatibleLaptopSize
} from '../../types';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  Save, 
  Image, 
  Cpu, 
  Layers, 
  HardDrive, 
  Monitor, 
  DollarSign, 
  Barcode, 
  Key, 
  Briefcase, 
  Wand2,
  Upload,
  Trash2,
  Plus,
  Star,
  Link
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

const BRANDS: ProductBrand[] = [
  'ASUS', 'Apple', 'Lenovo', 'Dell', 'HP', 'Acer', 'MSI',
  'Microsoft', 'Kaspersky', 'ESET', 'Adobe', 'Autodesk',
  'Targus', 'Samsonite', 'Other'
];

const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'gaming', label: 'Gaming & e-Sport' },
  { id: 'professional', label: 'Créateurs & Pro' },
  { id: 'business', label: 'Bureautique & Entreprise' },
  { id: 'laptops', label: 'PC Portables Ultra' },
  { id: 'software_digital', label: 'Logiciels & Produits Numériques (Phase 8)' },
  { id: 'laptop_bags_cases', label: 'Sacs & Housses PC (Phase 9)' },
  { id: 'desktops', label: 'PC de Bureau & Tours' },
  { id: 'accessories', label: 'Accessoires & Périphériques' },
  { id: 'components', label: 'Composants & Pièces' },
  { id: 'printers', label: 'Imprimantes' }
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit
}) => {
  const { addProduct, updateProduct, hasPermission } = useStore();
  const { t } = useLanguage();

  const [name, setName] = useState(productToEdit?.name || '');
  const [brand, setBrand] = useState<ProductBrand>(productToEdit?.brand || 'ASUS');
  const [category, setCategory] = useState<ProductCategory>(productToEdit?.category || 'gaming');
  const [sku, setSku] = useState(productToEdit?.sku || '');
  const [barcode, setBarcode] = useState(productToEdit?.barcode || '');

  // Pricing & Financials (Phase 6 & 7)
  const [purchasePriceDZD, setPurchasePriceDZD] = useState<number>(productToEdit?.purchasePriceDZD || 120000);
  const [priceDZD, setPriceDZD] = useState<number>(productToEdit?.priceDZD || 150000);
  const [originalPriceDZD, setOriginalPriceDZD] = useState<number | undefined>(productToEdit?.originalPriceDZD);

  const [stock, setStock] = useState<number>(productToEdit?.stock || 5);
  const [minStockAlert, setMinStockAlert] = useState<number>(productToEdit?.minStockAlert || 3);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(productToEdit?.warrantyMonths || 12);
  const [condition, setCondition] = useState<ProductCondition>(productToEdit?.condition || 'new');
  const [status, setStatus] = useState<ProductStatus>(productToEdit?.status || 'available');

  // Hardware Specs
  const [processor, setProcessor] = useState(productToEdit?.processor || '');
  const [ram, setRam] = useState(productToEdit?.ram || '');
  const [storage, setStorage] = useState(productToEdit?.storage || '');
  const [gpu, setGpu] = useState(productToEdit?.gpu || '');
  const [screenSize, setScreenSize] = useState(productToEdit?.screenSize || '');

  // Software & Digital Products (Phase 8)
  const [softSubcategory, setSoftSubcategory] = useState<SoftwareSubcategory>(
    productToEdit?.digitalDetails?.subcategory || 'operating_systems'
  );
  const [licenseType, setLicenseType] = useState<'Retail' | 'OEM' | 'Volume' | 'Subscription'>(
    productToEdit?.digitalDetails?.licenseType || 'Retail'
  );
  const [licenseDuration, setLicenseDuration] = useState<'Lifetime' | '1 Year' | '2 Years' | '3 Years' | 'Monthly'>(
    productToEdit?.digitalDetails?.duration || 'Lifetime'
  );
  const [devicesCount, setDevicesCount] = useState<number>(productToEdit?.digitalDetails?.devicesCount || 1);
  const [licenseKeysText, setLicenseKeysText] = useState(
    productToEdit?.digitalDetails?.licenseKeys?.map(k => k.key).join('\n') || ''
  );
  const [activationFr, setActivationFr] = useState(
    productToEdit?.digitalDetails?.activationInstructions?.fr || ''
  );
  const [activationAr, setActivationAr] = useState(
    productToEdit?.digitalDetails?.activationInstructions?.ar || ''
  );

  // Laptop Bags & Cases (Phase 9)
  const [bagSubcategory, setBagSubcategory] = useState<BagSubcategory>(
    productToEdit?.bagDetails?.subcategory || 'backpack'
  );
  const [compatibleSizes, setCompatibleSizes] = useState<CompatibleLaptopSize[]>(
    productToEdit?.bagDetails?.compatibleSizes || ['15.6"']
  );
  const [bagMaterial, setBagMaterial] = useState(productToEdit?.bagDetails?.material || 'Polyester 900D');
  const [bagColor, setBagColor] = useState(productToEdit?.bagDetails?.color || 'Noir');
  const [isWaterResistant, setIsWaterResistant] = useState(productToEdit?.bagDetails?.isWaterResistant ?? true);

  const [imagesList, setImagesList] = useState<string[]>(
    productToEdit?.images || []
  );
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [descFr, setDescFr] = useState(productToEdit?.description.fr || '');
  const [descAr, setDescAr] = useState(productToEdit?.description.ar || '');

  // Compress and convert local image file from computer to lightweight Data URL
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Invalid image file'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const processed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await processImageFile(files[i]);
        processed.push(dataUrl);
      }
      setImagesList(prev => [...prev, ...processed]);
    } catch (e) {
      console.error('Error uploading image:', e);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddExternalUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setImagesList(prev => [...prev, trimmed]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImagesList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImagesList(prev => {
      const copy = [...prev];
      const [chosen] = copy.splice(index, 1);
      return [chosen, ...copy];
    });
  };

  // Auto-calculated Profit & Margin
  const profitDZD = Number(priceDZD) - Number(purchasePriceDZD);
  const profitMargin = priceDZD > 0 ? Number(((profitDZD / priceDZD) * 100).toFixed(2)) : 0;

  // Auto-generate SKU & Barcode
  const handleAutoGenerateSkuBarcode = () => {
    const brandClean = brand.toUpperCase().slice(0, 4);
    const catClean = category.toUpperCase().slice(0, 3);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newSku = `TL-${brandClean}-${catClean}-${randNum}`;
    const newBarcode = '693' + Math.floor(1000000000 + Math.random() * 9000000000);
    setSku(newSku);
    setBarcode(newBarcode);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (productToEdit) {
      setName(productToEdit.name || '');
      setBrand(productToEdit.brand || 'ASUS');
      setCategory(productToEdit.category || 'gaming');
      setSku(productToEdit.sku || '');
      setBarcode(productToEdit.barcode || '');
      setPurchasePriceDZD(productToEdit.purchasePriceDZD || 120000);
      setPriceDZD(productToEdit.priceDZD || 150000);
      setOriginalPriceDZD(productToEdit.originalPriceDZD);
      setStock(productToEdit.stock ?? 5);
      setMinStockAlert(productToEdit.minStockAlert ?? 3);
      setWarrantyMonths(productToEdit.warrantyMonths ?? 12);
      setCondition(productToEdit.condition || 'new');
      setStatus(productToEdit.status || 'available');
      setProcessor(productToEdit.processor || '');
      setRam(productToEdit.ram || '');
      setStorage(productToEdit.storage || '');
      setGpu(productToEdit.gpu || '');
      setScreenSize(productToEdit.screenSize || '');
      setSoftSubcategory(productToEdit.digitalDetails?.subcategory || 'operating_systems');
      setLicenseType(productToEdit.digitalDetails?.licenseType || 'Retail');
      setLicenseDuration(productToEdit.digitalDetails?.duration || 'Lifetime');
      setDevicesCount(productToEdit.digitalDetails?.devicesCount || 1);
      setLicenseKeysText(productToEdit.digitalDetails?.licenseKeys?.map(k => k.key).join('\n') || '');
      setActivationFr(productToEdit.digitalDetails?.activationInstructions?.fr || '');
      setActivationAr(productToEdit.digitalDetails?.activationInstructions?.ar || '');
      setBagSubcategory(productToEdit.bagDetails?.subcategory || 'backpack');
      setCompatibleSizes(productToEdit.bagDetails?.compatibleSizes || ['15.6"']);
      setBagMaterial(productToEdit.bagDetails?.material || 'Polyester 900D');
      setBagColor(productToEdit.bagDetails?.color || 'Noir');
      setIsWaterResistant(productToEdit.bagDetails?.isWaterResistant ?? true);
      setImagesList(productToEdit.images || []);
      setImageUrlInput('');
      setDescFr(productToEdit.description?.fr || '');
      setDescAr(productToEdit.description?.ar || '');
    } else {
      setName('');
      setBrand('ASUS');
      setCategory('gaming');
      setPurchasePriceDZD(120000);
      setPriceDZD(150000);
      setOriginalPriceDZD(undefined);
      setStock(5);
      setMinStockAlert(3);
      setWarrantyMonths(12);
      setCondition('new');
      setStatus('available');
      setProcessor('');
      setRam('');
      setStorage('');
      setGpu('');
      setScreenSize('');
      setLicenseKeysText('');
      setActivationFr('');
      setActivationAr('');
      setImagesList([]);
      setImageUrlInput('');
      setDescFr('');
      setDescAr('');
      const randNum = Math.floor(1000 + Math.random() * 9000);
      setSku(`TL-ASUS-GAM-${randNum}`);
      setBarcode('693' + Math.floor(1000000000 + Math.random() * 9000000000));
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const images = imagesList.filter(url => url.trim().length > 0);

    // Digital details payload
    let digitalDetails = undefined;
    if (category === 'software_digital') {
      const keys = licenseKeysText
        .split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .map((key, i) => ({
          id: 'k-' + Date.now().toString(36) + i,
          key,
          isUsed: false
        }));

      digitalDetails = {
        subcategory: softSubcategory,
        licenseType,
        duration: licenseDuration,
        devicesCount: Number(devicesCount),
        activationInstructions: {
          fr: activationFr.trim() || 'Instructions d\'activation transmises par email et WhatsApp.',
          ar: activationAr.trim() || 'تعليمات التنشيط يتم إرسالها عبر الواتساب والإيميل.'
        },
        licenseKeys: keys,
        isAutoDelivery: true
      };
    }

    // Bag details payload
    let bagDetails = undefined;
    if (category === 'laptop_bags_cases') {
      bagDetails = {
        subcategory: bagSubcategory,
        compatibleSizes,
        material: bagMaterial.trim(),
        color: bagColor.trim(),
        isWaterResistant
      };
    }

    const payload = {
      sku: sku.trim() || `TL-${Date.now().toString(36).toUpperCase()}`,
      barcode: barcode.trim() || '6931234567890',
      name: name.trim(),
      brand,
      category,
      purchasePriceDZD: Number(purchasePriceDZD),
      priceDZD: Number(priceDZD),
      originalPriceDZD: originalPriceDZD ? Number(originalPriceDZD) : undefined,
      stock: Number(stock),
      minStockAlert: Number(minStockAlert),
      warrantyMonths: Number(warrantyMonths),
      condition,
      status,
      processor: processor.trim(),
      ram: ram.trim(),
      storage: storage.trim(),
      gpu: gpu.trim(),
      screenSize: screenSize.trim(),
      isDigital: category === 'software_digital',
      digitalDetails,
      bagDetails,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80'],
      description: {
        fr: descFr.trim() || name.trim(),
        ar: descAr.trim() || name.trim()
      }
    };

    if (productToEdit) {
      updateProduct(productToEdit.id, payload);
    } else {
      addProduct(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#091122] rounded-3xl border border-cyan-500/40 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-blue-900/40 bg-[#060C18] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-white">
              {productToEdit ? 'Modifier le Produit' : 'Créer une Nouvelle Référence'}
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-blue-950 px-2 py-0.5 rounded">
              SKU: {sku || 'Génération auto'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-blue-950/60 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Name & SKU / Barcode */}
          <div className="space-y-1">
            <label className="font-bold text-slate-300">Nom commercial du produit *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: ASUS ROG Strix G16 (2024)"
              className="w-full bg-[#050A14] text-white rounded-xl px-3.5 py-2.5 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* SKU & Barcode Generator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#050A14] p-3.5 rounded-2xl border border-blue-900/40">
            <div>
              <label className="font-bold text-slate-300 flex items-center justify-between mb-1">
                <span>Code SKU Unique *</span>
                <button
                  type="button"
                  onClick={handleAutoGenerateSkuBarcode}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Régénérer</span>
                </button>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-[#080F1C] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Code-barres EAN-13 / Code128</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="ex: 6931234560012"
                className="w-full bg-[#080F1C] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60 text-xs"
              />
            </div>
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Catégorie Principale *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2.5 border border-blue-900/60"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#091122]">{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Marque *</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as ProductBrand)}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2.5 border border-blue-900/60"
              >
                {BRANDS.map(b => (
                  <option key={b} value={b} className="bg-[#091122]">{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">État *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2.5 border border-blue-900/60"
              >
                <option value="new" className="bg-[#091122]">Neuf scellé (Garantie)</option>
                <option value="used" className="bg-[#091122]">Occasion (Importé Europe)</option>
              </select>
            </div>
          </div>

          {/* Financials & Profit Calculations (Phase 6 & 7) */}
          <div className="p-4 bg-[#050A14] rounded-2xl border border-blue-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300 uppercase tracking-wider text-xs font-mono flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>Gestion des Coûts, Prix et Marge Bénéficiaire</span>
              </span>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Confidentiel (Employés autorisés uniquement)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 text-xs block mb-1">Prix d'Achat (COGS) DZD *</label>
                <input
                  type="number"
                  required
                  value={purchasePriceDZD}
                  onChange={(e) => setPurchasePriceDZD(Number(e.target.value))}
                  className="w-full bg-[#080F1C] text-white font-mono rounded-lg px-3 py-2 border border-blue-900/60"
                />
              </div>

              <div>
                <label className="text-cyan-300 text-xs font-bold block mb-1">Prix de Vente Public DZD *</label>
                <input
                  type="number"
                  required
                  value={priceDZD}
                  onChange={(e) => setPriceDZD(Number(e.target.value))}
                  className="w-full bg-[#080F1C] text-white font-mono font-bold rounded-lg px-3 py-2 border border-cyan-400/60"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs block mb-1">Prix Barré (Promo)</label>
                <input
                  type="number"
                  value={originalPriceDZD || ''}
                  onChange={(e) => setOriginalPriceDZD(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="ex: 180000"
                  className="w-full bg-[#080F1C] text-slate-400 font-mono rounded-lg px-3 py-2 border border-blue-900/60"
                />
              </div>

              {/* Real-time Profit Display */}
              <div className="bg-[#080F1C] p-2 rounded-lg border border-emerald-500/40 flex flex-col justify-center">
                <div className="text-[10px] text-emerald-400 font-bold">Bénéfice Net Calculé :</div>
                <div className="font-mono font-black text-sm text-emerald-300">
                  +{profitDZD.toLocaleString('fr-DZ')} DZD
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Marge : <strong className="text-cyan-300">{profitMargin}%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Stock & Alerts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Quantité en Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>

            <div>
              <label className="font-bold text-amber-400 block mb-1">Seuil d'Alerte Stock Faible *</label>
              <input
                type="number"
                required
                min="1"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(Number(e.target.value))}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Garantie Magasin (mois)</label>
              <input
                type="number"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
          </div>

          {/* Dynamic Section: Digital Software Licenses (Phase 8) */}
          {category === 'software_digital' && (
            <div className="p-4 bg-[#050A14] rounded-2xl border border-indigo-500/40 space-y-3">
              <span className="font-bold text-indigo-400 uppercase tracking-wider text-xs font-mono flex items-center gap-1.5">
                <Key className="w-4 h-4" />
                <span>Paramètres des Logiciels & Licences Numériques</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Sous-catégorie logicielle</label>
                  <select
                    value={softSubcategory}
                    onChange={(e) => setSoftSubcategory(e.target.value as SoftwareSubcategory)}
                    className="w-full bg-[#080F1C] text-white rounded-lg px-3 py-2 border border-blue-900/60 text-xs"
                  >
                    <option value="operating_systems">Systèmes d'exploitation (Windows...)</option>
                    <option value="office_productivity">Bureautique (Office 2024, 365...)</option>
                    <option value="security_antivirus">Sécurité & Antivirus (Kaspersky...)</option>
                    <option value="engineering_design">Ingénierie & Design (AutoCAD, Adobe...)</option>
                    <option value="other_digital">Autres produits digitaux</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Type de Licence</label>
                  <select
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value as any)}
                    className="w-full bg-[#080F1C] text-white rounded-lg px-3 py-2 border border-blue-900/60 text-xs"
                  >
                    <option value="Retail">Retail (Originale Grand Public)</option>
                    <option value="OEM">OEM (Liée à la carte mère)</option>
                    <option value="Volume">Volume / Entreprise</option>
                    <option value="Subscription">Abonnement Annuel</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Durée & Postes</label>
                  <div className="flex gap-2">
                    <select
                      value={licenseDuration}
                      onChange={(e) => setLicenseDuration(e.target.value as any)}
                      className="w-1/2 bg-[#080F1C] text-white rounded-lg px-2 py-2 border border-blue-900/60 text-xs"
                    >
                      <option value="Lifetime">À Vie</option>
                      <option value="1 Year">1 An</option>
                      <option value="2 Years">2 Ans</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={devicesCount}
                      onChange={(e) => setDevicesCount(Number(e.target.value))}
                      placeholder="Postes"
                      className="w-1/2 bg-[#080F1C] text-white rounded-lg px-2 py-2 border border-blue-900/60 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">
                  Pool de Clés d'Activation (Une clé par ligne — Masquées aux clients jusqu'à l'achat)
                </label>
                <textarea
                  rows={2}
                  value={licenseKeysText}
                  onChange={(e) => setLicenseKeysText(e.target.value)}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY-YYYYY"
                  className="w-full bg-[#080F1C] text-white font-mono text-xs rounded-xl px-3 py-2 border border-blue-900/60"
                />
              </div>
            </div>
          )}

          {/* Dynamic Section: Laptop Bags & Cases (Phase 9) */}
          {category === 'laptop_bags_cases' && (
            <div className="p-4 bg-[#050A14] rounded-2xl border border-amber-500/40 space-y-3">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-xs font-mono flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>Spécifications Sacs, Sacoches et Housses pour PC</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Type de bagagerie</label>
                  <select
                    value={bagSubcategory}
                    onChange={(e) => setBagSubcategory(e.target.value as BagSubcategory)}
                    className="w-full bg-[#080F1C] text-white rounded-lg px-3 py-2 border border-blue-900/60 text-xs"
                  >
                    <option value="backpack">Sac à dos (Backpack)</option>
                    <option value="shoulder_bag">Sacoche bandoulière</option>
                    <option value="sleeve">Housse de protection (Sleeve)</option>
                    <option value="hard_case">Mallette rigide antichoc</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Matériau de fabrication</label>
                  <input
                    type="text"
                    value={bagMaterial}
                    onChange={(e) => setBagMaterial(e.target.value)}
                    placeholder="ex: Polyester hydrofuge 900D"
                    className="w-full bg-[#080F1C] text-white rounded-lg px-3 py-2 border border-blue-900/60 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Couleur</label>
                  <input
                    type="text"
                    value={bagColor}
                    onChange={(e) => setBagColor(e.target.value)}
                    placeholder="ex: Noir ROG / Gris Anthracite"
                    className="w-full bg-[#080F1C] text-white rounded-lg px-3 py-2 border border-blue-900/60 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5">Tailles de PC compatibles :</label>
                <div className="flex flex-wrap gap-3">
                  {(['13"', '14"', '15.6"', '16"', '17.3"'] as CompatibleLaptopSize[]).map(sz => (
                    <label key={sz} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compatibleSizes.includes(sz)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCompatibleSizes([...compatibleSizes, sz]);
                          } else {
                            setCompatibleSizes(compatibleSizes.filter(s => s !== sz));
                          }
                        }}
                        className="rounded text-amber-500"
                      />
                      <span>{sz}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hardware Specs (for physical PCs) */}
          {category !== 'software_digital' && category !== 'laptop_bags_cases' && (
            <div className="p-4 bg-[#050A14] rounded-2xl border border-blue-900/50 space-y-3">
              <span className="font-bold text-cyan-300 uppercase tracking-wider text-xs font-mono">
                Spécifications Hardware (CPU, RAM, Stockage, GPU, Écran)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={processor}
                  onChange={(e) => setProcessor(e.target.value)}
                  placeholder="Processeur (ex: Intel Core i7-14700HX)"
                  className="bg-[#080F1C] text-white rounded-lg px-3 py-2 border border-blue-900/50 text-xs"
                />
                <input
                  type="text"
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                  placeholder="RAM (ex: 32 GB DDR5 5600MHz)"
                  className="bg-[#080F1C] text-white rounded-lg px-3 py-2 border border-blue-900/50 text-xs"
                />
                <input
                  type="text"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  placeholder="Stockage (ex: 1 TB NVMe Gen4 SSD)"
                  className="bg-[#080F1C] text-white rounded-lg px-3 py-2 border border-blue-900/50 text-xs"
                />
                <input
                  type="text"
                  value={gpu}
                  onChange={(e) => setGpu(e.target.value)}
                  placeholder="GPU (ex: NVIDIA RTX 4070 8GB)"
                  className="bg-[#080F1C] text-white rounded-lg px-3 py-2 border border-blue-900/50 text-xs"
                />
                <input
                  type="text"
                  value={screenSize}
                  onChange={(e) => setScreenSize(e.target.value)}
                  placeholder='Écran (ex: 16.0" QHD+ 240Hz Nebula)'
                  className="sm:col-span-2 bg-[#080F1C] text-white rounded-lg px-3 py-2 border border-blue-900/50 text-xs"
                />
              </div>
            </div>
          )}

          {/* Images Direct Upload & Drag-and-Drop Zone */}
          <div className="p-4 bg-[#050A14] rounded-2xl border border-blue-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-bold text-cyan-300 text-xs sm:text-sm flex items-center gap-2">
                <Image className="w-4 h-4 text-cyan-400" />
                <span>صور المنتج — رفع مباشر من الحاسوب أو سحب وإفلات (Images du Produit)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {imagesList.length} صورة مضافة
              </span>
            </div>

            {/* Hidden Native File Input (Opens Computer File Explorer Directly) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />

            {/* Clickable & Drag-and-Drop Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingImage(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingImage(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingImage(false);
                handleFilesSelected(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                isDraggingImage
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_25px_rgba(0,212,255,0.25)] scale-[1.01]'
                  : 'border-blue-800/70 hover:border-cyan-400/80 bg-[#080F1C]/90 hover:bg-blue-950/30'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
                <Upload className={`w-6 h-6 ${isUploadingImage ? 'animate-bounce' : ''}`} />
              </div>

              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-extrabold text-white">
                  {isUploadingImage
                    ? 'جاري تجهيز ورفع الصورة...'
                    : 'اضغط هنا لاختيار صورة من الحاسوب أو الهاتف، أو اسحب الصورة وأفلتها هنا'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Cliquez ici pour parcourir votre ordinateur (JPG, PNG, WEBP) ou glissez-déposez vos photos directement
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>اختيار صورة من الجهاز (Parcourir...)</span>
              </button>
            </div>

            {/* Uploaded Images Preview Grid */}
            {imagesList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {imagesList.map((imgSrc, idx) => (
                  <div
                    key={idx}
                    className={`relative group rounded-xl overflow-hidden border-2 bg-black aspect-[16/11] ${
                      idx === 0 ? 'border-cyan-400 shadow-[0_0_12px_rgba(0,212,255,0.25)]' : 'border-blue-900/50'
                    }`}
                  >
                    <img
                      src={imgSrc}
                      alt={`Product ${idx + 1}`}
                      className="w-full h-full object-cover object-center"
                    />

                    {/* Main Image Badge */}
                    {idx === 0 && (
                      <span className="absolute top-1.5 start-1.5 px-2 py-0.5 rounded-md bg-cyan-500 text-black font-black text-[10px] flex items-center gap-1 shadow">
                        <Star className="w-3 h-3 fill-black" />
                        <span>الرئيسية</span>
                      </span>
                    )}

                    {/* Hover Actions: Set as Primary / Delete */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="px-2 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] flex items-center gap-1 shadow cursor-pointer"
                          title="تعيين كصورة رئيسية"
                        >
                          <Star className="w-3 h-3" />
                          <span>رئيسية</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow cursor-pointer"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Optional Secondary Input for External Image Link */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Link className="w-3.5 h-3.5 text-slate-500 absolute inset-y-0 start-3 my-auto pointer-events-none" />
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExternalUrl();
                    }
                  }}
                  placeholder="أو ألصق رابط صورة خارجي هنا (اختياري https://...)"
                  className="w-full bg-[#080F1C] text-white font-mono text-xs rounded-xl ps-8 pe-3 py-2 border border-blue-900/50 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddExternalUrl}
                className="px-3 py-2 rounded-xl bg-blue-950/70 hover:bg-blue-900 text-cyan-300 border border-blue-800/50 text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                + إضافة رابط
              </button>
            </div>
          </div>

          {/* Bilingual Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Description (Français)</label>
              <textarea
                rows={2}
                value={descFr}
                onChange={(e) => setDescFr(e.target.value)}
                className="w-full bg-[#050A14] text-white text-xs rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">الوصف (العربية)</label>
              <textarea
                rows={2}
                dir="rtl"
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                className="w-full bg-[#050A14] text-white text-xs rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-blue-900/40 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-blue-950/60 text-slate-300 font-bold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(0,140,255,0.4)] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer la référence</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
