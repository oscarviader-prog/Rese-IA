import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  Check, 
  Camera, 
  Sparkles, 
  LogOut,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, logout } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSavedSuccess(false);

    const res = await updateProfile({
      firstName,
      lastName,
      companyName,
      phone,
      city,
      bio,
      avatarUrl,
    });

    setSaving(false);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      setErrorMsg(res.error || 'No se pudieron guardar los cambios.');
    }
  };

  const displayName = user.role === 'business' && companyName
    ? companyName
    : `${firstName} ${lastName}`.trim() || user.email.split('@')[0];

  const userInitial = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-slate-950 border border-[#00f2ff]/30 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00f2ff]/10 border border-[#00f2ff]/40 flex items-center justify-center text-[#00f2ff]">
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">Perfil de Usuario</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Main User Avatar Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-xl bg-slate-900/80 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f2ff]/5 rounded-full blur-2xl pointer-events-none" />

            {/* Circular Avatar */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.3)] bg-slate-950 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={displayName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-[#00f2ff] font-mono-code">
                    {userInitial}
                  </span>
                )}
              </div>

              {/* Edit Image Button Overlay */}
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#0F766E] text-white hover:bg-[#0d665f] border border-cyan-400 shadow-md transition-transform hover:scale-110 cursor-pointer"
                title="Cambiar foto de perfil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* User Meta Data Info */}
            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{displayName}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider ${
                  user.role === 'business'
                    ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                    : 'bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30'
                }`}>
                  {user.role === 'business' ? 'Empresa' : 'Consumidor'}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-mono-code flex items-center justify-center sm:justify-start gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{user.email}</span>
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px]">
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" /> Correo Verificado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3" /> Verificación Pendiente
                  </span>
                )}

                <span className="inline-flex items-center gap-1 text-slate-400 font-mono-code bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  <Calendar className="w-3 h-3" /> Miembro desde {new Date(user.createdAt || Date.now()).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Avatar Selector Panel */}
          {showAvatarPicker && (
            <div className="p-4 rounded-xl bg-slate-900 border border-[#00f2ff]/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00f2ff]" /> Elige una foto o ingresa una URL:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Ocultar
                </button>
              </div>

              {/* Preset Avatars Row */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      avatarUrl === url ? 'border-[#00f2ff] scale-110 shadow-[0_0_10px_rgba(0,242,255,0.5)]' : 'border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="px-2.5 py-1 text-[11px] font-mono-code text-red-400 hover:text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg shrink-0"
                  >
                    Quitar foto
                  </button>
                )}
              </div>

              {/* Custom Image URL Input */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] text-slate-400 block font-mono-code">URL de Imagen Personalizada:</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://ejemplo.com/mi-foto.jpg"
                  className="w-full bg-slate-950 text-xs text-white px-3 py-1.5 rounded-lg border border-slate-700 focus:border-[#00f2ff] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Edit Profile Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <h4 className="text-xs font-mono-code font-bold text-[#00f2ff] uppercase tracking-wider border-b border-white/10 pb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Datos Personales
            </h4>

            {user.role === 'business' ? (
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" /> Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej. La Tasca de Marea S.L."
                  className="w-full bg-slate-900 text-sm text-white px-3.5 py-2 rounded-xl border border-slate-800 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff] focus:outline-none"
                />
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Nombre</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ej. Oscar"
                  className="w-full bg-slate-900 text-sm text-white px-3.5 py-2 rounded-xl border border-slate-800 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Apellidos</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej. Viader"
                  className="w-full bg-slate-900 text-sm text-white px-3.5 py-2 rounded-xl border border-slate-800 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="w-full bg-slate-900 text-sm text-white px-3.5 py-2 rounded-xl border border-slate-800 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Ciudad / Provincia
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. Las Palmas de Gran Canaria"
                  className="w-full bg-slate-900 text-sm text-white px-3.5 py-2 rounded-xl border border-slate-800 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Biografía / Presentación</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Escribe brevemente sobre ti o tu establecimiento..."
                className="w-full bg-slate-900 text-sm text-white px-3.5 py-2 rounded-xl border border-slate-800 focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff] focus:outline-none resize-none"
              />
            </div>

            {/* Error or Success Notifications */}
            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>¡Perfil actualizado correctamente!</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-red-950/40 text-red-300 hover:bg-red-900/60 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0d665f] text-white text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
