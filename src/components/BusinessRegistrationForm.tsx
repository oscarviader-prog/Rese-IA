import React, { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type TipoEntidad = 'Empresa' | 'Autónomo';

interface BusinessRegistrationFormProps {
  onSuccess?: (businessId: string) => void;
}

const CIF_REGEX_EMPRESA = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/;
const CIF_REGEX_AUTONOMO = /^\d{8}[A-Z]$/;
const CODIGO_POSTAL_REGEX = /^\d{5}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const BusinessRegistrationForm: React.FC<BusinessRegistrationFormProps> = ({
  onSuccess,
}) => {
  const { user } = useAuth();

  const [tipoEntidad, setTipoEntidad] = useState<TipoEntidad>('Empresa');
  const [cif, setCif] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [domicilioFiscal, setDomicilioFiscal] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [provincia, setProvincia] = useState('');
  const [pais, setPais] = useState('España');
  const [emailFacturacion, setEmailFacturacion] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [spinnerMessage, setSpinnerMessage] = useState('Registrando tu negocio...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cifNormalizado = cif.trim().toUpperCase();
  const cifRegex = tipoEntidad === 'Empresa' ? CIF_REGEX_EMPRESA : CIF_REGEX_AUTONOMO;
  const cifFormatValido = cifNormalizado.length > 0 && cifRegex.test(cifNormalizado);

  const codigoPostalValido = CODIGO_POSTAL_REGEX.test(codigoPostal.trim());
  const emailFacturacionValido =
    emailFacturacion.trim().length === 0 || EMAIL_REGEX.test(emailFacturacion.trim());

  const isFormValid =
    cifFormatValido &&
    razonSocial.trim().length >= 3 &&
    domicilioFiscal.trim().length > 0 &&
    ciudad.trim().length > 0 &&
    codigoPostalValido &&
    provincia.trim().length > 0 &&
    pais.trim().length > 0 &&
    emailFacturacionValido;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMsg('Debes iniciar sesión para registrar tu negocio.');
      return;
    }

    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSpinnerMessage('Registrando tu negocio...');

    const { data, error } = await supabase
      .from('businesses')
      .insert({
        owner_user_id: user.id,
        cif: cifNormalizado,
        razon_social: razonSocial.trim(),
        nombre_comercial: nombreComercial.trim() || null,
        domicilio_fiscal: domicilioFiscal.trim(),
        ciudad: ciudad.trim(),
        codigo_postal: codigoPostal.trim(),
        provincia: provincia.trim(),
        pais: pais.trim(),
        email_facturacion: emailFacturacion.trim() || null,
        tipo_entidad: tipoEntidad === 'Empresa' ? 'empresa' : 'autonomo',
      })
      .select('id')
      .single();

    if (error) {
      setSubmitting(false);
      if (error.code === '23505') {
        setErrorMsg('Este CIF ya está registrado en ReseñIA');
      } else {
        setErrorMsg('Error al registrar. Vuelve a intentarlo.');
      }
      return;
    }

    const nuevoId = data?.id;
    setSpinnerMessage('Verificando tu empresa. Esto tarda unos segundos...');

    if (nuevoId) {
      const { error: verifyError } = await supabase.functions.invoke('verify-business', {
        body: { businessId: nuevoId },
      });

      if (verifyError) {
        console.error('Error al verificar el negocio:', verifyError);
      }
    }

    setSubmitting(false);

    if (onSuccess) {
      onSuccess(nuevoId ?? '');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8] px-4 py-8">
      <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Registra tu negocio en ReseñIA
        </h1>
        <p className="text-gray-600 mb-8">
          Verificaremos automáticamente que tu empresa existe antes de activar tu panel
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de entidad
            </span>
            <div className="flex gap-3">
              {(['Empresa', 'Autónomo'] as const).map((option) => (
                <label
                  key={option}
                  className={`flex-1 cursor-pointer rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors ${
                    tipoEntidad === option
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipoEntidad"
                    value={option}
                    checked={tipoEntidad === option}
                    onChange={() => setTipoEntidad(option)}
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="cif" className="block text-sm font-medium text-gray-700 mb-2">
              CIF/NIF
            </label>
            <div className="relative">
              <input
                id="cif"
                type="text"
                value={cif}
                onChange={(e) => setCif(e.target.value)}
                placeholder="Ej: B12345678"
                required
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
              {cifNormalizado.length > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cifFormatValido ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700 mb-2">
              Razón social
            </label>
            <input
              id="razonSocial"
              type="text"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              placeholder="Nombre legal de la empresa"
              required
              minLength={3}
              className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label htmlFor="nombreComercial" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre comercial
            </label>
            <input
              id="nombreComercial"
              type="text"
              value={nombreComercial}
              onChange={(e) => setNombreComercial(e.target.value)}
              placeholder="Nombre con el que el público te conoce"
              className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label htmlFor="domicilioFiscal" className="block text-sm font-medium text-gray-700 mb-2">
              Domicilio fiscal
            </label>
            <textarea
              id="domicilioFiscal"
              rows={3}
              value={domicilioFiscal}
              onChange={(e) => setDomicilioFiscal(e.target.value)}
              placeholder="Calle, número, piso, código postal"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 resize-y"
            />
          </div>

          <div>
            <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad
            </label>
            <input
              id="ciudad"
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ciudad donde opera tu negocio"
              required
              className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label htmlFor="codigoPostal" className="block text-sm font-medium text-gray-700 mb-2">
              Código postal
            </label>
            <input
              id="codigoPostal"
              type="text"
              value={codigoPostal}
              onChange={(e) => setCodigoPostal(e.target.value)}
              placeholder="Ej: 28001"
              required
              pattern="\d{5}"
              maxLength={5}
              className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 mb-2">
              Provincia
            </label>
            <input
              id="provincia"
              type="text"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              placeholder="Provincia donde opera tu negocio"
              required
              className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label htmlFor="pais" className="block text-sm font-medium text-gray-700 mb-2">
              País
            </label>
            <input
              id="pais"
              type="text"
              value={pais}
              onChange={(e) => setPais(e.target.value)}
              placeholder="País donde opera tu negocio"
              required
              className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label htmlFor="emailFacturacion" className="block text-sm font-medium text-gray-700 mb-2">
              Email de facturación
            </label>
            <input
              id="emailFacturacion"
              type="email"
              value={emailFacturacion}
              onChange={(e) => setEmailFacturacion(e.target.value)}
              placeholder="facturacion@tuempresa.com"
              className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || submitting}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {spinnerMessage}
              </>
            ) : (
              'Verificar y registrar mi negocio'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
