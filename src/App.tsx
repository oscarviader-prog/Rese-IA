import { useState, useEffect } from 'react';
import { ViewState } from './types';
import { Starfield } from './components/Starfield';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { ConsumerView } from './components/ConsumerView';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { PlaceDetailModal } from './components/PlaceDetailModal';
import { Footer } from './components/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessRegistrationForm } from './components/BusinessRegistrationForm';
import { BusinessDashboard } from './components/BusinessDashboard';
import { PlaceResult } from './components/SearchBar';
import { supabase } from './lib/supabase';

function MainApp() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);

  // Consultar si el usuario tiene un negocio registrado
  useEffect(() => {
    const checkBusiness = async () => {
      if (!user?.id) {
        setHasBusiness(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error consultando negocio del usuario:', error);
          setHasBusiness(false);
          return;
        }

        setHasBusiness(!!data);
      } catch (err) {
        console.error('Error consultando negocio del usuario:', err);
        setHasBusiness(false);
      }
    };

    checkBusiness();
  }, [user?.id]);

  const handleNavigate = (view: ViewState) => {
    // Lógica especial cuando el usuario intenta ir a "business"
    if (view === 'business') {
      if (!user) {
        setCurrentView('login');
      } else if (hasBusiness) {
        setCurrentView('business_dashboard');
      } else {
        setCurrentView('business_register');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlace = (placeId: string, place?: PlaceResult) => {
    setSelectedPlaceId(placeId);
    if (place) {
      setSelectedPlace(place);
    }
    if (currentView !== 'consumer') {
      setCurrentView('consumer');
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col relative font-sans-ui selection:bg-[#00f2ff] selection:text-black">
      {/* Black Space Starfield with tiny glowing phosphorescent blue stars */}
      <Starfield />

      {/* Foreground Content Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
        />

        <main className="flex-1">
          {currentView === 'landing' && (
            <LandingView onNavigate={handleNavigate} />
          )}

          {currentView === 'consumer' && (
            <ConsumerView 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              onSelectPlace={handleSelectPlace}
              selectedPlace={selectedPlace}
            />
          )}

          {currentView === 'login' && (
            <LoginPage onNavigate={handleNavigate} />
          )}

          {currentView === 'register' && (
            <RegisterPage onNavigate={handleNavigate} />
          )}

          {currentView === 'forgot_password' && (
            <ForgotPasswordPage onNavigate={handleNavigate} />
          )}

          {currentView === 'business_register' && (
            <BusinessRegistrationForm
              onSuccess={(businessId) => {
                console.log('Negocio creado con ID:', businessId);
                setHasBusiness(true);
                setCurrentView('business_dashboard');
              }}
            />
          )}

          {currentView === 'business_dashboard' && (
            <BusinessDashboard
              onBackToRegister={() => {
                setCurrentView('business_register');
              }}
            />
          )}
        </main>

        <Footer />
      </div>

      {/* Global Place Detail Modal */}
      <PlaceDetailModal
        placeId={selectedPlaceId}
        onClose={() => setSelectedPlaceId(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}