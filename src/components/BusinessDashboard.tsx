import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BusinessMetricsDashboard } from './BusinessMetricsDashboard';
import { BusinessAlertsSection } from './BusinessAlertsSection';
import { BusinessAlertSettingsSection } from './BusinessAlertSettingsSection';
import { BusinessReportsSection } from './BusinessReportsSection';
import { BusinessCompetitiveAnalysisSection } from './BusinessCompetitiveAnalysisSection';

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
  codigo_postal?: string;
  provincia?: string;
  pais?: string;
  email_facturacion?: string | null;
  report_frequency?: 'weekly' | 'biweekly' | 'monthly' | null;
}

const BusinessDataList: React.FC<{
  business: BusinessDashboardData;
  onUpdated: (updates: Partial<BusinessDashboardData>) => void;
}> = ({ business, onUpdated }) => {
  const fechaVerificacion = business.verified_at
    ? new Date(business.verified_at).toLocaleDateString('es-ES')
    : '—';

  const googlePlaces = business.verification_data?.google_places;
  const googlePlacesConfirmados = !!(googlePlaces && googlePlaces.nombre_encontrado);

  const canEdit =
    business.verification_status === 'verified' ||
    business.verification_status === 'partially_verified';

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [nombreComercial, setNombreComercial] = useState(business.nombre_comercial ?? '');
  const [emailFacturacion, setEmailFacturacion] = useState(business.email_facturacion ?? '');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const openEditModal = () => {
    setNombreComercial(business.nombre_comercial ?? '');
    setEmailFacturacion(business.email_facturacion ?? '');
    setEditError(null);
    setEditSuccess(false);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditError(null);

    const updates = {
      nombre_comercial: nombreComercial.trim() || null,
      email_facturacion: emailFacturacion.trim() || null,
    };

    const { error } = await supabase.from('businesses').update(updates).eq('id', business.id);

    setSavingEdit(false);

    if (error) {
      setEditError('No se pudieron guardar los cambios. Vuelve a intentarlo.');
      return;
    }

    setIsEditOpen(false);
    onUpdated(updates);
    setEditSuccess(true);
  };

  const items = [
    { label: 'Razón social', value: business.razon_social },
    { label: 'CIF/NIF', value: business.cif },
    { label: 'Domicilio fiscal', value: business.domicilio_fiscal },
    { label: 'Ciudad', value: business.ciudad },
    { label: 'Código postal', value: business.codigo_postal || '—' },
    { label: 'Provincia', value: business.provincia || '—' },
    { label: 'País', value: business.pais || '—' },
    ...(business.email_facturacion
      ? [{ label: 'Email de facturación', value: business.email_facturacion }]
      : []),
    { label: 'Fecha de verificación', value: fechaVerificacion },
  ];

  return (
    <>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Datos de tu negocio</h3>
          {canEdit && (
            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800 font-medium border border-teal-200 hover:border-teal-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar datos editables
            </button>
          )}
        </div>

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

        {editSuccess && (
          <div className="mt-5 flex items-center gap-2 bg-green-50 text-green-800 border border-green-200 rounded-lg p-3 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Cambios guardados correctamente.
          </div>
        )}
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Editar datos editables</h4>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-5">
              Los datos verificados no se pueden modificar. Contacta soporte si hay un cambio importante.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label
                  htmlFor="editNombreComercial"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nombre comercial
                </label>
                <input
                  id="editNombreComercial"
                  type="text"
                  value={nombreComercial}
                  onChange={(e) => setNombreComercial(e.target.value)}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label
                  htmlFor="editEmailFacturacion"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email de facturación
                </label>
                <input
                  id="editEmailFacturacion"
                  type="email"
                  value={emailFacturacion}
                  onChange={(e) => setEmailFacturacion(e.target.value)}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {editError && (
                <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">
                  {editError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const UpcomingSection: React.FC = () => (
  <section className="mt-6 rounded-2xl bg-gray-100 p-6">
    <h3 className="text-lg font-semibold text-gray-700 mb-2">Próximamente</h3>
    <p className="text-sm text-gray-600">
      Aquí podrás gestionar tus ofertas, ver reseñas de tus clientes y consultar tus análisis. Estas funciones estarán disponibles próximamente.
    </p>
  </section>
);

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ onBackToRegister }) => {
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<BusinessDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataExpanded, setIsDataExpanded] = useState(false);

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

  const handleBusinessUpdated = (updates: Partial<BusinessDashboardData>) => {
    setBusiness((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  if (!user) return null;

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
        <div className="max-w-6xl mx-auto">
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

  const inicialNegocio = business.razon_social.trim().charAt(0).toUpperCase();

  const dashboardHeader = (
    <div className="mb-6 flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md">
        <span className="text-white text-2xl font-bold">{inicialNegocio}</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{business.razon_social}</h1>
        <p className="text-sm text-gray-500">Panel de control de tu negocio</p>
      </div>
    </div>
  );

  if (status === 'pending_verification') {
    return (
      <div className="min-h-screen bg-[#F5F6F8] px-4 py-12">
        <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto">
          {dashboardHeader}

          <div className="space-y-8">
            {/* Card verde de verificación */}
            <div className="rounded-2xl border border-green-300 bg-green-50 p-8 shadow-md">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-green-900 mb-2 inline-flex items-center gap-2">
                    <BadgeCheck className="w-6 h-6 text-green-600" />
                    Verificada por ReseñIA
                  </h2>
                  <p className="text-sm text-green-800">
                    Tu empresa está verificada en ReseñIA. Ya puedes gestionar tu negocio.
                  </p>
                </div>
              </div>
            </div>

            {/* Sección colapsable: Datos de tu negocio */}
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <button
                type="button"
                onClick={() => setIsDataExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
                aria-expanded={isDataExpanded}
              >
                <h3 className="text-lg font-semibold text-gray-900">Datos de tu negocio</h3>
                {isDataExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                )}
              </button>
              {isDataExpanded && (
                <BusinessDataList business={business} onUpdated={handleBusinessUpdated} />
              )}
            </div>

            {/* Evolución del rating (ancho completo) */}
            <BusinessMetricsDashboard businessId={business.id} />

            {/* Alertas + Informes en 2 columnas (1 columna en móvil) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BusinessAlertsSection businessId={business.id} />
              <BusinessReportsSection
                businessId={business.id}
                initialFrequency={business.report_frequency || 'weekly'}
              />
            </div>

            <BusinessAlertSettingsSection businessId={business.id} />

            <BusinessCompetitiveAnalysisSection businessId={business.id} />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'partially_verified') {
    return (
      <div className="min-h-screen bg-[#F5F6F8] px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {dashboardHeader}
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
          <BusinessDataList business={business} onUpdated={handleBusinessUpdated} />
          <BusinessAlertSettingsSection businessId={business.id} />
          <BusinessCompetitiveAnalysisSection businessId={business.id} />
          <UpcomingSection />
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#F5F6F8] px-4 py-12">
        <div className="max-w-6xl mx-auto">
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