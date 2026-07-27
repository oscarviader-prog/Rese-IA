import React, { useState } from 'react';
import { ViewState } from './types';
import { Starfield } from './components/Starfield';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { ConsumerView } from './components/ConsumerView';
import { BusinessView } from './components/BusinessView';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { Footer } from './components/Footer';
import { AuthProvider } from './context/AuthContext';

function MainApp() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [searchQuery, setSearchQuery] = useState('La Tasca de Marea · Las Palmas');

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1">
          {currentView === 'landing' && (
            <LandingView onNavigate={handleNavigate} />
          )}

          {currentView === 'consumer' && (
            <ConsumerView />
          )}

          {currentView === 'business' && (
            <BusinessView />
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
        </main>

        <Footer />
      </div>
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

