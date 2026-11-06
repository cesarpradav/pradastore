import React, { useState, useEffect } from 'react';
import { SellerProfile } from '../types';
import { 
  X, 
  Store, 
  User, 
  Phone, 
  Instagram, 
  ShieldCheck, 
  Check, 
  MapPin, 
  FileText,
  RotateCcw
} from 'lucide-react';
import { DEFAULT_WARRANTY_TERMS, DEFAULT_SELLER_PROFILE } from '../data/initialData';

interface SellerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerProfile: SellerProfile;
  onSaveProfile: (profile: SellerProfile) => void;
}

export const SellerProfileModal: React.FC<SellerProfileModalProps> = ({
  isOpen,
  onClose,
  sellerProfile,
  onSaveProfile,
}) => {
  const [sellerName, setSellerName] = useState(sellerProfile.sellerName);
  const [sellerIdNumber, setSellerIdNumber] = useState(sellerProfile.sellerIdNumber);
  const [sellerPhone, setSellerPhone] = useState(sellerProfile.sellerPhone);
  const [storeName, setStoreName] = useState(sellerProfile.storeName);
  const [instagram, setInstagram] = useState(sellerProfile.instagram);
  const [cityAddress, setCityAddress] = useState(sellerProfile.cityAddress);
  const [warrantyTerms, setWarrantyTerms] = useState(sellerProfile.warrantyTerms);

  useEffect(() => {
    if (isOpen) {
      setSellerName(sellerProfile.sellerName);
      setSellerIdNumber(sellerProfile.sellerIdNumber);
      setSellerPhone(sellerProfile.sellerPhone);
      setStoreName(sellerProfile.storeName);
      setInstagram(sellerProfile.instagram);
      setCityAddress(sellerProfile.cityAddress);
      setWarrantyTerms(sellerProfile.warrantyTerms || DEFAULT_WARRANTY_TERMS);
    }
  }, [isOpen, sellerProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      sellerName: sellerName.trim(),
      sellerIdNumber: sellerIdNumber.trim(),
      sellerPhone: sellerPhone.trim(),
      storeName: storeName.trim(),
      instagram: instagram.trim(),
      cityAddress: cityAddress.trim(),
      warrantyTerms: warrantyTerms.trim(),
    });
    onClose();
  };

  const handleResetDefaultTerms = () => {
    setWarrantyTerms(DEFAULT_WARRANTY_TERMS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl my-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Datos del Emprendimiento &amp; Cláusulas de Garantía
              </h3>
              <p className="text-xs text-slate-400">
                Estos datos aparecerán automáticamente en el encabezado y firmas de cada Orden de Entrega
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Datos Personales y Fiscales */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-400" />
              <span>Tus Datos de Vendedor / Emprendedor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. César Prada"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Cédula de Identidad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V-20.123.456"
                  value={sellerIdNumber}
                  onChange={(e) => setSellerIdNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Teléfono / WhatsApp de Ventas *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 0414-9876543"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nombre Comercial / Marca *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. iPhoneros Store Vzla"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Instagram / Red Social</label>
                <input
                  type="text"
                  placeholder="Ej. @iphoneros.vzla"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Ciudad / Ubicación</label>
                <input
                  type="text"
                  placeholder="Ej. Caracas, Venezuela"
                  value={cityAddress}
                  onChange={(e) => setCityAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Términos y Condiciones Legales */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Condiciones de Entrega y Recepción Conforme</span>
              </div>
              <button
                type="button"
                onClick={handleResetDefaultTerms}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-400 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar texto estricto</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Este texto se incluye en cada Nota de Entrega para dejar constancia legal de que el cliente revisó y aceptó el equipo conforme, impidiendo devoluciones por detalles cosméticos posteriores.
            </p>

            <textarea
              rows={4}
              value={warrantyTerms}
              onChange={(e) => setWarrantyTerms(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-xs focus:outline-hidden focus:border-amber-500 font-mono leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
