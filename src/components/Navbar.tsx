import React, { useState } from 'react';
import { ViewState } from '../types';
import { ArrowLeft, Search, ShieldCheck, Building2, User, LogIn, UserPlus, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileModal } from './ProfileModal';
import { SearchBar, PlaceResult } from './SearchBar';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectPlace?: (placeId: string, place?: PlaceResult) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  searchQuery,
  setSearchQuery,
  onSelectPlace,
}) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const displayName = user
    ? user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0]
    : '';

  const initialLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 glass-nav px-4 py-3 sm:px-8 transition-all">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => onNavigate('landing')} 
              className="cursor-pointer group flex items-center gap-2"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-[#00f2ff]/40 flex items-center justify-center text-[#00f2ff] font-bold shadow-[0_0_12px_rgba(0,242,255,0.3)]">
                <ShieldCheck className="w-5 h-5 text-[#00f2ff]" />
              </div>
              <h1 className="text-2xl font-display font-extrabold tracking-tighter text-white">
                RESEÑ<span className="text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.7)]">IA</span>
              </h1>
            </div>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded border border-white/20 text-[10px] font-mono-code font-bold bg-white/5 text-cyan-300">
              BETA PÚBLICA
            </span>
          </div>

          {/* View Switcher & Search (Consumer) */}
          {currentView === 'consumer' && (
            <div className="relative w-full sm:w-96 md:w-[480px] my-1 sm:my-0">
              <SearchBar 
                onSelectPlace={(id, place) => onSelectPlace?.(id, place)}
                placeholder="Buscar en Google Places..."
              />
            </div>
          )}

          {/* Right Nav Actions */}
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <button
              onClick={() => onNavigate('consumer')}
              className={`px-2.5 py-1.5 rounded text-xs font-mono-code transition-all flex items-center gap-1.5 ${
                currentView === 'consumer' 
                  ? 'text-[#00f2ff] bg-[#00f2ff]/10 border border-[#00f2ff]/40' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span className="hidden sm:inline">CONSUMIDOR</span>
            </button>

            <button
              onClick={() => onNavigate('business')}
              className={`px-2.5 py-1.5 rounded text-xs font-mono-code transition-all flex items-center gap-1.5 ${
                currentView === 'business' 
                  ? 'text-purple-300 bg-purple-900/40 border border-purple-500/40' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">EMPRESA</span>
            </button>

            {/* User Auth Buttons or Profile Badge */}
            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-white/15">
                {/* Profile Circle Avatar Button */}
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 border border-white/10 hover:border-[#00f2ff]/50 transition-all cursor-pointer group text-left"
                  title="Ver datos personales y mi perfil"
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full border border-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.4)] bg-slate-950 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={displayName} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xs font-mono-code font-bold text-[#00f2ff]">
                          {initialLetter}
                        </span>
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
                  </div>

                  <div className="hidden md:block">
                    <p className="text-xs font-bold text-white group-hover:text-[#00f2ff] transition-colors truncate max-w-[120px]">
                      {displayName}
                    </p>
                    <span className="text-[9px] font-mono-code text-cyan-300 block uppercase tracking-wider">
                      {user.role === 'business' ? 'Empresa' : 'Consumidor'}
                    </span>
                  </div>
                </button>

                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-white/20 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-white/15">
                <button
                  onClick={() => onNavigate('login')}
                  className={`px-3 py-1.5 rounded text-xs font-bold font-mono-code transition-all flex items-center gap-1.5 ${
                    currentView === 'login'
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-slate-900/90 text-[#00f2ff] border border-[#00f2ff]/40 hover:bg-slate-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>INICIAR SESIÓN</span>
                </button>

                <button
                  onClick={() => onNavigate('register')}
                  className={`hidden sm:flex px-3 py-1.5 rounded text-xs font-bold font-mono-code transition-all items-center gap-1.5 ${
                    currentView === 'register'
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-[#0F766E]/20 text-white border border-[#0F766E]/50 hover:bg-[#0F766E]/40'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#00f2ff]" />
                  <span>REGISTRARSE</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
};

