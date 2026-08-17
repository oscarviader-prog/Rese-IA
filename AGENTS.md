# AGENTS.md — Contexto y guía técnica para agentes de IA en ReseñIA

> Este archivo es la fuente de verdad para cualquier agente de IA (opencode, Claude, Gemini) o desarrollador que trabaje en el código de este proyecto. Léelo entero antes de generar código o tomar decisiones técnicas.
> Para contexto de negocio y propuesta de producto, ver `instruciones.md`.

---

## 1. Stack técnico

- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS v4
- **Package manager:** Bun (nunca npm o yarn)
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions, Storage)
- **IA:** Google Gemini via `@google/genai` (pendiente mover al backend)
- **Datos negocios:** Google Places API (New) — solo desde Edge Functions
- **Emails transaccionales:** Resend (`RESEND_API_KEY` configurada)
- **Iconos:** lucide-react
- **Animaciones:** motion
- **Entorno de desarrollo:** WSL Debian sobre Windows + VS Code + opencode
- **Repositorio:** GitHub privado

---

## 2. Estado actual (agosto 2026)

### Cerrado y funcionando
- Autenticación completa (registro, login, logout). Login rechaza contraseñas incorrectas.
- Buscador de negocios con Google Places API (Edge Function `search-places`).
- Ficha de detalle con reseñas reales de Google (Edge Function `get-place-details`).
- Sistema de reservas por email (mantiene el compañero).
- Vista diferenciada consumidor/empresa.
- Sistema de verificación de empresas con 2 capas: validación matemática CIF/NIF + Google Places (Edge Function `verify-business`).

### En desarrollo
- Frontend de registro empresarial (`BusinessRegistrationForm.tsx`).
- Dashboard de empresa (`BusinessDashboard.tsx`).
- Badge de verificación en ficha pública.

### Pendiente crítico (no aplazable)
- **Nota Real real** — sigue siendo maqueta con datos inventados. Es el diferenciador central del producto. Sin ella, ReseñIA no tiene propuesta única.

### Aplazado (roadmap futuro)
- Integración Stripe (cuando se publique con dominio real).
- Sugerencias de ofertas con IA.
- Detección de tendencias de mercado.
- Chat conversacional para consumidor.
- SEO por negocio con SSR.

---

## 3. Convenciones de código

### Nombrado
- **Componentes:** PascalCase — `SearchBar.tsx`, `BusinessRegistrationForm.tsx`
- **Módulos de lib:** camelCase — `supabase.ts`, `bookings.ts`
- **Edge Functions:** kebab-case — `verify-business`, `search-places`
- **Variables de entorno frontend:** prefijo `VITE_` obligatorio

### Estilos
- Solo Tailwind. No CSS-in-JS ni módulos CSS.
- Paleta principal: teal (`#0F766E`).
- Fondo base: `#F5F6F8`.
- Tipografías: Fraunces (titulares), Instrument Sans (interfaz), JetBrains Mono (datos numéricos).
- Diseño: espacio en blanco generoso, cards con bordes suaves, esquinas redondeadas.
- Accesibilidad: respetar `prefers-reduced-motion`.

---

## 4. Reglas de seguridad (no negociables)

1. NUNCA hardcodear API keys ni secrets en frontend. `.env` local (nunca `.env.example`) o Supabase Secrets para Edge Functions.
2. NUNCA llamar a Google Places API directamente desde frontend. Siempre vía Edge Functions.
3. NUNCA subir `.env` al repo. Verificar `git status` antes de cada commit.
4. RLS obligatorio en todas las tablas de Supabase.
5. La `service_role` key nunca va al frontend.
6. La API key de Gemini actualmente está en frontend con prefijo `VITE_`. Es deuda técnica. Migrar cuando se toque IA.

---

## 5. Reglas de calidad

1. No inventar datos. Si un componente muestra info de un negocio, debe venir de una fuente real.
2. Manejo de errores obligatorio en toda llamada asíncrona.
3. Loading states obligatorios en operaciones visibles al usuario.
4. Console.logs con contexto durante desarrollo. Retirar antes de merge a `main`.
5. Nombres de variables descriptivos. Nada de `data`, `temp`, `x`.

---

## 6. Verificación antes de declarar hecho

1. "Hecho" = probado end-to-end, no "el código compila".
2. Probar cada feature con al menos 3 escenarios distintos.
3. Verificar en consola del navegador (F12) que no hay errores.
4. Verificar que no rompe features anteriores (regresión).

---

## 7. Antipatrones aprendidos (a evitar siempre)

- **Declarar cerrado sin verificar.** El deploy verde no significa que funcione.
- **Maquetar features en lugar de construirlas.** Datos inventados en UI = producto que aparenta funcionar. Nunca.
- **Abrir frentes sin cerrar el anterior.** Una tarea activa a la vez.
- **Mezclar entornos.** Este proyecto vive en Debian (WSL). Todo el desarrollo en Debian.
- **Aceptar valores por defecto sin leer.** Nombres autogenerados de recursos han costado horas de debugging.
- **Depender de IA para decidir producto.** El equipo decide, la IA implementa lo que se le pide con especificidad.

---

## 8. Edge Functions activas

### `search-places`
- **Recibe:** `{ query: string }`
- **Devuelve:** `{ places: Place[] }` — hasta 10 resultados
- **Sesgo geográfico:** radio 50 km desde Las Palmas
- **JWT verification:** desactivado

### `get-place-details`
- **Recibe:** `{ placeId: string }`
- **Devuelve:** detalle completo con hasta 5 reseñas de Google
- **JWT verification:** desactivado

### `verify-business`
- **Recibe:** `{ businessId: string }`
- **Devuelve:** `{ status, score, results }`
- **Función:** verificación automática en 2 capas:
  - Validación matemática CIF/NIF (incluye rechazo de casos borde: todos ceros, todos iguales, dígito control)
  - Cruce con Google Places (coincidencia de razón social + ciudad)
- **Estados:**
  - `verified` (score 2): ambos checks pasan
  - `partially_verified` (score 1): solo CIF matemático
  - `rejected` (score 0): CIF inválido
- **Efectos:** actualiza `businesses` y registra en `verification_attempts`.
- **JWT verification:** desactivado

### Pendientes de crear
- `analyze-reviews` — análisis con IA para calcular Nota Real (motor central, aún no construido)

### Secretos usados
- `GOOGLE_PLACES_API_KEY` — activa
- `RESEND_API_KEY` — activa
- `GEMINI_API_KEY` — pendiente migración desde frontend

---

## 9. Modelo de datos (Supabase)

### Tablas actuales
- `auth.users` — gestionada por Supabase Auth.
- `profiles` — datos extendidos del usuario (nombre, apellido, rol consumidor/empresa).
- `reservations` — reservas por email (mantiene el compañero).
- `businesses` — empresas registradas y verificadas (14 columnas). Campos clave: `cif`, `razon_social`, `domicilio_fiscal`, `ciudad`, `tipo_entidad` (empresa/autonomo), `google_place_id`, `verification_status`, `verification_score` (0-2), `verification_data` (jsonb), `owner_user_id` (FK a auth.users con CASCADE). RLS con 4 policies.
- `verification_attempts` — auditoría de verificaciones (6 columnas). Campos: `business_id` (FK CASCADE), `check_type`, `result`, `details` (jsonb), `created_at`. RLS con 1 policy.

### Tablas planificadas
- `offers` — ofertas creadas por empresas.
- `nota_real_cache` — resultados cacheados del análisis de Nota Real.

---

## 10. Flujo de Git

- Cada dev trabaja en su rama, nunca directo en `main`.
- Convención: `feature/nombre-corto`, `fix/nombre-corto`, `refactor/nombre-corto`.
- Commits en español, imperativo, breves: `feat: buscador google places`, `fix: login rechaza contraseña incorrecta`.

**Antes de trabajar:**
```bash
git checkout main
git pull
git checkout -b feature/lo-que-vas-a-hacer
```

**Antes de commitear:**
```bash
git status        # verificar que .env NO aparece
bun run lint      # tsc sin errores
```

**Al terminar:**
```bash
git add .
git commit -m "descripción imperativa"
git push -u origin feature/lo-que-vas-a-hacer
```

Pull Request en GitHub → revisión del compañero → merge a main.

---

## 11. Definition of Done

Una tarea está hecha SOLO cuando:

- [ ] Compila sin errores ni warnings (`bun run lint`)
- [ ] Funciona en `localhost:3000` end-to-end
- [ ] Probada con al menos 3 casos distintos
- [ ] Consola del navegador (F12) sin errores rojos
- [ ] No rompe features anteriores
- [ ] Sin `console.log` de debug olvidados
- [ ] Sin datos hardcodeados de prueba
- [ ] Commit descriptivo en rama propia
- [ ] Pull Request abierto y revisado
- [ ] Mergeado a `main`

Si falta uno, no está hecho.

---

## 12. Cómo pedir cambios a un agente (opencode / Claude)

### Petición mala
> "Añade la Nota Real"

Ambigua. El agente inventará qué es, cómo se calcula, cómo se muestra.

### Petición buena
> "En `PlaceDetailModal.tsx`, añade bloque bajo rating de Google llamado 'Nota Real'. Debe llamar a Edge Function `analyze-reviews` pasando `placeId`. La función devuelve `{ nota: number, reseñas_analizadas: number, reseñas_descartadas: number }`. Mostrar nota con 1 decimal + número de reseñas analizadas. Si error o menos de 10 reseñas: mostrar 'Nota Real no disponible'. NO tocar otros componentes."

Específico, con alcance limitado, con manejo de errores explícito.

### Reglas para pedir
1. Un cambio a la vez.
2. Especificar qué NO tocar.
3. Definir criterio de éxito desde el principio.
4. Pedir manejo de errores explícito.

---

## 13. Deuda técnica conocida

- API key de Gemini en frontend con prefijo `VITE_`. Migrar a Edge Function cuando se toque IA.
- Maquetas de Nota Real en `ConsumerView.tsx` con datos inventados. Eliminar cuando exista `analyze-reviews`.
- Sin tests automatizados. Testing manual como única red de seguridad.
- Sin CI/CD. Antes de producción, configurar GitHub Actions con `bun run lint`.
- `AuthContext.tsx` tiene lógica mixta con mock users en localStorage como fallback cuando Supabase Auth falla. Puede provocar que `auth.uid()` sea null aunque el usuario "parezca" logueado. Todo lo que dependa de RLS necesita sesión real de Supabase, no mock. Auditar el flujo cuando se acerque el lanzamiento.
- Componente `BusinessView.tsx` queda huérfano tras la integración del flujo real de verificación. Contiene maqueta con datos hardcodeados (La Tasca de Marea, leads inventados, agente de respuesta con texto fijo, informes de actividad falsos). Sirve como referencia visual para futuras funciones reales (agente de respuesta con IA, informes, gestión de leads). Decisión pendiente: mantenerlo como referencia o eliminarlo cuando construyamos las funciones reales.
- El componente `BusinessDashboard.tsx` sigue usando `.maybeSingle()` internamente. Actualmente no es problema porque `App.tsx` decide antes qué dashboard mostrar y solo hay 1 negocio por usuario. Si algún día se permite que un usuario tenga varios negocios, hay que revisar tanto App.tsx como BusinessDashboard.
- **[CRÍTICO]** Edge Function `get-place-details` falla con error CORS al invocarse desde `localhost:3000`. El modal `PlaceDetailModal.tsx` muestra placeholders ("Establecimiento Seleccionado", "0 opiniones") en lugar de los datos reales de Google Places. Es bloqueante para el consumidor. Arreglar tras cerrar Fase 6 de verificación de empresas.
- El badge de verificación en `PlaceDetailModal.tsx` funciona correctamente y consulta la tabla `businesses` filtrando por `google_place_id`. Depende de que la Edge Function `get-place-details` funcione para que el modal muestre datos reales del negocio junto al badge.
- **Decisión de producto pendiente:** un usuario puede tener 1 solo negocio asociado actualmente. En el futuro, permitir varios negocios por usuario con un selector tipo Instagram (cambiar entre dashboards de distintos negocios sin cerrar sesión). Cuando se implemente: revisar `App.tsx` (query en `useEffect`), `BusinessDashboard.tsx` (query interna con `.maybeSingle()`), y añadir un selector en el Navbar o en el propio dashboard.
---

## 14. Nota final

Este proyecto tiene un patrón documentado: construir la fachada antes que el motor. Antes de aceptar cualquier tarea, pregúntate:

- ¿Estoy construyendo el diferenciador central o una feature secundaria?
- ¿La lógica que voy a implementar existe realmente o estoy maquetando algo que aparenta funcionar?
- ¿Estoy cerrando una tarea o abriendo un frente nuevo sin haber cerrado el anterior?

Si la respuesta es "estoy maquetando" o "estoy abriendo frente nuevo", para y devuelve la pregunta al equipo. El valor de este proyecto está en la Nota Real real, no en tener más pantallas bonitas.