import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface BusinessDashboardProps {
  onBackToRegister?: () => void;
}

interface GooglePlacesData {
  nombre_encontrado?: string;
  direccion?: string;
  place_id?: string;
  porcentaje_coincidencia?: number;
  reason?: string;
}

interface BusinessDashboardData {
  id: string;
  cif: string;
  razon_social: string;
  nombre_comercial?: string | null;
  domicilio_fiscal: string;
  ciudad: string;
  tipo_entidad: string;
  verification_status: 'pending_verification' | 'verified' | 'partially_verified' | 'rejected';
  verification_data?: { google_places?: GooglePlacesData } | null;
  verified_at?: string | null;
}

const BusinessDataList: React.FC<{ business: BusinessDashboardData }> = ({ business }) => {
  const fechaVerificacion = business.verified_at
    ? new Date(business.verified_at).toLocaleDateString('es-ES')
    : '—';

  const googlePlaces = business.verification_data?.google_places;
  const googlePlacesConfirmados = !!(googlePlaces && googlePlaces.nombre_encontrado);

  const items = [
    { label: 'Razón social', value: business.razon_social },
    { label: 'CIF/NIF', value: business.cif },
    { label: 'Domicilio fiscal', value: business.domicilio_fiscal },
    { label: 'Ciudad', value: business.ciudad },
    { label: 'Fecha de verificación', value: fechaVerificacion },
  ];

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos de tu negocio</h3>
      <dl className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 sm:w-44 sm:shrink-0">{item.label}</dt>
            <dd className="text-sm text-gray-900">{item.value}</dd>
          </div>
        ))}
      </dl>

      {googlePlacesConfirmados && (
        <div className="mt-5 rounded-xl bg-teal-50 border border-teal-100 p-4">
          <p className="text-sm font-semibold text-teal-800 mb-2">
            Datos confirmados en Google Places:
          </p>
          <dl className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-sm font-medium text-teal-700 sm:w-44 sm:shrink-0">Nombre encontrado</dt>
              <dd className="text-sm text-gray-900">{googlePlaces?.nombre_encontrado}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-sm font-medium text-teal-700 sm:w-44 sm:shrink-0">Dirección</dt>
              <dd className="text-sm text-gray-900">{googlePlaces?.direccion ?? '—'}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};

const UpcomingSection: React.FC = () => (
  <section className="mt-6 rounded-2xl bg-gray-100 p-6">
    <h3 className="text-lg font-semibold text-gray-700 mb-2">Próximamente</h3>
    <p className="text-sm text-gray-600">
      Aquí podrás gestionar tus ofertas, ver reseñas de tus clientes y consultar tu Nota Real. Estas funciones estarán disponibles próximamente.
    </p>
  </section>
);

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ onBackToRegister }) => {
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<BusinessDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBusiness = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    setBusiness((data as BusinessDashboardData | null) ?? null);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBusiness();
    }
  }, [user, fetchBusiness]);

  if (authLoading || (user && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8] px-4">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8] px-4">
        <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-md p-8 text-center">
          <p className="text-gray-700">Debes iniciar sesión para acceder al panel de empresa.</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] px-4 py-12">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Panel de tu negocio</h1>
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-gray-700 mb-6">Aún no has registrado ningún negocio.</p>
            {onBackToRegister && (
              <button
                onClick={onBackToRegister}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Registrar mi negocio
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const status = business.verification_status;

  if (status === 'pending_verification') {
    return (
      <div className="min-h-screen bg-[#F5F6F8] px-4 py-12">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Panel de tu negocio</h1>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-8 shadow-md">
            <div className="flex items-start gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-amber-900 mb-2">Verificando tu empresa</h2>
                <p className="text-sm text-amber-800">
                  Estamos verificando los datos de tu negocio. Esto puede tardar unos segundos. Refresca la página en un momento.
                </p>
              </div>
            </div>
            <button
              onClick={fetchBusiness}
              className="mt-6 inline-flex items-center gap-2 border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar estado
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'verified') {
    return (
      <div className="min-h-screen bg-[#F5F6F8] px-4 py-12">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Panel de tu negocio</h1>
          <div className="rounded-2xl border border-green-300 bg-green-50 p-8 shadow-md">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-green-900 mb-2">Empresa verificada</h2>
                <p className="text-sm text-green-800">
                  Tu empresa está verificada en ReseñIA. Ya puedes gestionar tu negocio.
                </p>
              </div>
            </div>
          </div>
          <BusinessDataList business={business} />
          <UpcomingSection />
        </div>
      </div>
    );
  }

  if (status === 'partially_verified') {
    return (
      <div className="min-h-screen bg-[#F5F6F8] px-4 py-12">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Panel de tu negocio</h1>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-8 shadow-md">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-amber-900 mb-2">Verificación parcial</h2>
                <p className="text-sm text-amber-800">
                  Hemos confirmado tu CIF/NIF pero no encontramos tu negocio en Google Places. Revisa que la razón social y la ciudad sean correctas, o contacta con soporte si crees que hay un error.
                </p>
              </div>
            </div>
          </div>
          <BusinessDataList business={business} />
          <UpcomingSection />
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#F5F6F8] px-4 py-12">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Panel de tu negocio</h1>
          <div className="rounded-2xl border border-red-300 bg-red-50 p-8 shadow-md">
            <div className="flex items-start gap-4">
              <XCircle className="w-8 h-8 text-red-600 shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-red-900 mb-2">Verificación fallida</h2>
                <p className="text-sm text-red-800">
                  El CIF/NIF que proporcionaste no es válido. Revisa los datos e intenta registrar tu negocio de nuevo.
                </p>
              </div>
            </div>
            {onBackToRegister && (
              <button
                onClick={onBackToRegister}
                className="mt-6 inline-flex items-center gap-2 border border-red-300 bg-white hover:bg-red-100 text-red-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Volver a registrar
              </button>
            )}
          </div>
          <UpcomingSection />
        </div>
      </div>
    );
  }

  return null;
};