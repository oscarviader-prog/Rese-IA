# AGENTS.md — Contexto y guía de trabajo para ReseñIA

> Este archivo es la fuente de verdad para cualquier agente de IA (opencode, Claude, Gemini) o desarrollador que trabaje en este proyecto. Léelo entero antes de generar código o tomar decisiones.

---

## 1. Qué es ReseñIA

Plataforma web que analiza y sintetiza reseñas de negocios para dar un veredicto claro al consumidor y detectar reseñas falsas (bots). Sirve tanto a consumidores como a empresas, con dos experiencias diferenciadas.

**Propuesta de valor central:** la **Nota Real** — una puntuación ponderada que filtra reseñas sospechosas y da al consumidor una lectura más fiable que la media pública de Google.

**Diferenciador secundario:** funnel de conversión integrado (búsqueda → ficha → reserva por email) sin salir de la plataforma.

**Público objetivo:**
- Consumidores 18-35 años que buscan negocios (restaurantes principalmente en fase inicial).
- Dueños de negocios que quieren gestionar su reputación y captar clientes.

**Ámbito geográfico inicial:** Canarias (Las Palmas de Gran Canaria como zona piloto).

---

## 2. Stack técnico

- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS v4
- **Package manager:** Bun (nunca npm o yarn)
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions, Storage)
- **IA:** Google Gemini via `@google/genai` (frontend) — pendiente mover al backend
- **Integración datos negocios:** Google Places API (New) — llamada solo desde Edge Functions
- **Pagos (planificado):** Stripe Checkout + webhooks
- **Iconos:** lucide-react
- **Animaciones:** motion
- **Entorno de desarrollo:** WSL Debian sobre Windows
- **Repositorio:** GitHub privado

---

## 3. Estado actual del proyecto (última actualización: agosto 2026)

### Cerrado y funcionando
- Sistema de autenticación con Supabase (registro, login, logout)
- Login rechaza contraseñas incorrectas correctamente
- Buscador de negocios con Google Places API (via Edge Function `search-places`)
- Ficha de detalle de negocio con reseñas reales de Google (via Edge Function `get-place-details`)
- Sistema de reservas por email (`ReservationEmailModal.tsx` + `bookings.ts`)
- Vista diferenciada consumidor / empresa (`ConsumerView.tsx`)

### En desarrollo o pendiente crítico
- **Nota Real real** — actualmente es una **maqueta con datos inventados**. El algoritmo real de scoring y filtrado de reseñas fake NO existe. Es el diferenciador central y sin él ReseñIA no tiene propuesta única.
- Panel completo del dueño de negocio (reclamación, gestión, ofertas)
- Verificación de empresas registradas (planificado con Stripe)
- Sistema de badges de verificación en fichas públicas
- Analytics del funnel de conversión
- Chat/asistente conversacional para consumidor
- SEO por negocio (SSR) — feedback de mentoría, pendiente

### Aplazado (roadmap futuro, NO tocar todavía)
- Sugerencias de ofertas con IA
- Detección de tendencias de mercado con IA
- Resúmenes periódicos configurables
- Notificaciones de competencia nueva

---

## 4. Arquitectura y convenciones

### Estructura del proyecto
```
src/
├── components/         # Componentes React reutilizables
├── context/            # React Context (AuthContext, etc.)
├── lib/                # Clientes y utilidades (supabase.ts, bookings.ts)
├── App.tsx             # Componente raíz
├── main.tsx            # Entry point
├── types.ts            # Tipos TypeScript compartidos
└── index.css           # Estilos globales Tailwind
```

### Convenciones de nombrado
- **Componentes:** PascalCase — `SearchBar.tsx`, `PlaceDetailModal.tsx`
- **Módulos de lib:** camelCase — `supabase.ts`, `bookings.ts`
- **Edge Functions:** kebab-case — `search-places`, `get-place-details`
- **Variables de entorno frontend:** prefijo `VITE_` obligatorio para que Vite las inyecte

### Estilos
- Tailwind exclusivamente. No CSS-in-JS, no CSS modules.
- Paleta principal: teal (`#0F766E`) como color de acento.
- Fondo base: `#F5F6F8`.
- Tipografías: Fraunces (titulares), Instrument Sans (interfaz), JetBrains Mono (datos numéricos).
- Diseño: mucho espacio en blanco, tarjetas con bordes suaves, esquinas redondeadas.
- Accesibilidad: respetar `prefers-reduced-motion` en todas las animaciones.

---

## 5. Reglas duras (nunca romper)

### Seguridad
1. **NUNCA hardcodear API keys ni secrets en el frontend.** Todo va en `.env` (nunca en `.env.example`) y en Supabase Secrets para Edge Functions.
2. **NUNCA llamar a Google Places API directamente desde el frontend.** Siempre a través de Edge Functions que actúan como proxy.
3. **NUNCA subir `.env` al repo.** Verificar `git status` antes de cada commit.
4. **Row Level Security (RLS) obligatorio** en todas las tablas de Supabase. Sin RLS, la publishable key permite acceso libre.
5. **La `service_role` key de Supabase NUNCA va al frontend.** Solo en Edge Functions.
6. **La API key de Gemini actualmente está en el frontend con prefijo VITE_.** Es un problema pendiente. Cuando se toque IA, migrar la lógica a una Edge Function.

### Calidad de código
1. **No inventar datos.** Si un componente muestra información de un negocio, debe venir de una fuente real (Google Places, Supabase). No hardcodear datos de ejemplo en producción.
2. **Manejo de errores obligatorio** en cualquier llamada asíncrona (`supabase.functions.invoke`, `fetch`, `await` en general).
3. **Loading states obligatorios** cuando hay operaciones asíncronas visibles al usuario.
4. **Console.logs con contexto** durante desarrollo. Retirar antes de merge a main.
5. **Nombres de variables descriptivos.** No `data`, `temp`, `x`. Usar `placesResult`, `businessProfile`, `pendingReservations`.

### Verificación antes de declarar hecho
1. **"Hecho" significa probado end-to-end**, no "el código compila".
2. **Probar cada feature con al menos 3 escenarios distintos** antes de cerrar (ejemplo buscador: pizza, cafeterías, hamburguesas).
3. **Verificar en consola del navegador (F12)** que no hay errores ni warnings.
4. **Verificar que no rompe features anteriores** (regresión).

---

## 6. Patrones a evitar (aprendidos a la mala)

Estos patrones han costado tiempo real en este proyecto. Cualquier IA o dev debe conocerlos.

### Antipatrón 1: Declarar cerrado sin verificar
El síntoma: se despliega una Edge Function, se ve "Deployed" en Supabase y se asume que funciona. Realidad: puede estar con código "Hello World" por defecto. **Regla:** siempre invocar la función real desde el frontend y ver la respuesta esperada antes de dar por cerrado.

### Antipatrón 2: Maquetar features en lugar de construirlas
El síntoma: mostrar en la UI "NOTA REAL 4.1" con un número inventado. Realidad: el algoritmo no existe. **Regla:** si la lógica no existe, la UI debe mostrar "próximamente" o un estado vacío honesto, nunca datos inventados. Un producto que aparenta funcionar y no funciona es peor que uno que reconoce lo que le falta.

### Antipatrón 3: Abrir frentes sin cerrar el anterior
El síntoma: mientras se arregla el login, empezar a construir el buscador; mientras se construye el buscador, planificar el chatbot. Realidad: 5 features al 40% valen menos que 2 al 100%. **Regla:** una tarea activa a la vez. Cerrar completamente antes de abrir la siguiente.

### Antipatrón 4: Mezclar entornos de desarrollo
El síntoma: instalar Bun en Windows PowerShell y luego trabajar en Debian donde no está. Realidad: los entornos son mundos separados. **Regla:** este proyecto vive en Debian (WSL). Todo el desarrollo en Debian. Windows solo para VS Code conectado remotamente vía extensión WSL.

### Antipatrón 5: Aceptar valores por defecto sin leer
El síntoma: crear Edge Function y aceptar el nombre autogenerado (`swift-action`) en vez del nombre correcto (`search-places`). Realidad: horas de debugging preguntándose por qué el frontend no encuentra la función. **Regla:** leer siempre lo que se acepta antes de confirmar.

### Antipatrón 6: Depender de IA para decidir el producto
El síntoma: dejar que Google AI Studio invente el nombre de una nota, el porcentaje de reseñas fake, el nombre de un badge. Realidad: acabas con un producto que no has diseñado tú. **Regla:** las decisiones de producto las toma el equipo, no la IA. La IA implementa lo que se le pide con especificidad, no rellena huecos.

---

## 7. Flujo de trabajo con Git

### Configuración base
- Cada dev trabaja en su rama, nunca directo en `main`.
- Convención de ramas: `feature/nombre-corto`, `fix/nombre-corto`, `refactor/nombre-corto`.
- Commits en español, imperativo, breves: `add: buscador google places`, `fix: login rechaza contraseña incorrecta`, `refactor: extraer lógica de reservas a hook`.

### Antes de empezar a trabajar
```bash
git checkout main
git pull
git checkout -b feature/lo-que-vas-a-hacer
```

### Antes de commitear
```bash
git status        # verificar que .env NO aparece
bun run lint      # tsc sin errores
```

### Al terminar
```bash
git add .
git commit -m "descripción imperativa"
git push -u origin feature/lo-que-vas-a-hacer
```

Abrir Pull Request en GitHub. Mergear a `main` solo tras revisión del compañero.

---

## 8. Edge Functions activas

### `search-places`
- **Recibe:** `{ query: string }`
- **Devuelve:** `{ places: Place[] }` con hasta 10 resultados de Google Places
- **Sesgo geográfico:** radio de 50 km desde Las Palmas (28.1235, -15.4363)
- **Idioma:** español, región España
- **JWT verification:** desactivado (endpoint público para clientes sin login)

### `get-place-details`
- **Recibe:** `{ placeId: string }`
- **Devuelve:** detalle completo del negocio con hasta 5 reseñas
- **JWT verification:** desactivado

### Pendientes de crear
- `analyze-reviews` — análisis con IA para calcular Nota Real
- `create-checkout-session` — crear sesión de Stripe para suscripción empresa
- `stripe-webhook` — recibir eventos de Stripe y actualizar estado de empresas

### Secretos usados
- `GOOGLE_PLACES_API_KEY` — API key de Google Places (activa)
- `STRIPE_SECRET_KEY` — pendiente
- `STRIPE_WEBHOOK_SECRET` — pendiente
- `GEMINI_API_KEY` — pendiente migración desde frontend

---

## 9. Modelo de datos (Supabase)

### Tablas actuales
- `auth.users` (gestionada por Supabase Auth)
- `profiles` — datos extendidos del usuario (nombre, apellido, rol consumidor/empresa)
- `bookings` — reservas creadas por consumidores

### Tablas planificadas
- `businesses` — negocios reclamados por dueños (google_place_id, cif, razón social, domicilio fiscal, estado_verificacion, owner_user_id)
- `subscriptions` — suscripciones activas con Stripe (stripe_customer_id, stripe_subscription_id, estado, próximo_cobro)
- `offers` — ofertas creadas por empresas (business_id, título, descripción, tipo_descuento, valor, fecha_inicio, fecha_fin)
- `nota_real_cache` — resultados cacheados del análisis de Nota Real (place_id, nota, reseñas_analizadas, reseñas_descartadas, fecha_calculo)
- `verification_attempts` — historial de intentos de verificación de empresa

---

## 10. Cómo pedir cambios a este agente (opencode / Claude)

Cuando le pidas al agente que construya algo, hazlo así para minimizar errores:

### Ejemplo de petición mala
> "Añade la Nota Real"

Demasiado ambiguo. El agente inventará qué es, cómo se calcula, qué datos usa, cómo se muestra.

### Ejemplo de petición buena
> "En `PlaceDetailModal.tsx`, añade un bloque bajo el rating de Google llamado 'Nota Real'. Debe llamar a la Edge Function `analyze-reviews` pasándole el `placeId` actual. La Edge Function devolverá `{ nota: number, reseñas_analizadas: number, reseñas_descartadas: number }`. Mostrar la nota con 1 decimal, junto al número de reseñas analizadas. Si la Edge Function devuelve error o menos de 10 reseñas, mostrar 'Nota Real no disponible'. Añadir un icono de información al lado con tooltip que explique el cálculo. NO tocar otros componentes."

Específico, con alcance limitado, con manejo de errores explícito.

### Reglas para pedir
1. **Un cambio a la vez.** No mezclar arreglar login con añadir feature nueva.
2. **Especificar qué NO tocar** cuando hay riesgo de que el agente se pase de scope.
3. **Definir el criterio de éxito** desde el principio (qué tiene que pasar para considerar hecho).
4. **Pedir manejo de errores explícito.** Los agentes tienden a implementar el "happy path" y olvidar el error.

---

## 11. Roadmap priorizado

### Fase actual: consolidación del MVP funcional
1. Construir el algoritmo real de **Nota Real** (Edge Function que analice reseñas con Gemini).
2. Limpiar todas las maquetas de Nota Real inventada en `ConsumerView.tsx`.
3. Verificar que el sistema completo funciona end-to-end sin humo.

### Fase siguiente: panel empresa + monetización
1. Registro de empresa con reclamación de negocio desde Google Places.
2. Panel de gestión para dueños.
3. Integración con Stripe Checkout para suscripción mensual.
4. Webhooks de Stripe para activar/suspender empresas.
5. Sistema de badges de verificación en fichas públicas.

### Fase posterior: gestión avanzada
1. Sistema de ofertas manuales publicables en ficha.
2. Analytics básico del funnel para empresas.
3. Sistema de denuncias de fichas falsas.

### Roadmap futuro (no tocar antes de las fases anteriores)
- Sugerencias de ofertas con IA
- Detección de tendencias de mercado
- Resúmenes periódicos configurables
- Chatbot conversacional para consumidor
- SEO por negocio con SSR

---

## 12. Deuda técnica conocida

- **API key de Gemini en frontend** con prefijo `VITE_`. Expuesta al navegador. Migrar a Edge Function cuando se toque cualquier feature de IA.
- **Maquetas de Nota Real** en `ConsumerView.tsx` con datos inventados (`NOTA INFLADA`, `1284 reseñas analizadas`, `12% patrones sospechosos`). Deben eliminarse cuando exista la Edge Function real, o antes si se hace demo pública.
- **El repositorio fue público durante un período** con la anon key legacy expuesta. Ya migrado a publishable key nueva, pero rotar credenciales antes de lanzar producción es recomendable.
- **`.env.example` contuvo valores reales** en versiones anteriores. Ya corregido, pero histórico de git aún los contiene.
- **Sin tests automatizados** actualmente. Testing manual es la única red de seguridad. Antes de producción con usuarios reales, valorar añadir Vitest para lógica crítica (cálculo de Nota Real, flujo de pago).
- **Sin CI/CD.** Cada dev prueba en local. Antes de producción, configurar GitHub Actions para al menos correr `bun run lint` en cada PR.

---

## 13. Definición de "hecho" (Definition of Done)

Una tarea se considera hecha SOLO cuando cumple TODOS estos puntos:

- [ ] El código compila sin errores ni warnings (`bun run lint`)
- [ ] La feature funciona en `localhost:3000` end-to-end
- [ ] Probada con al menos 3 casos distintos (happy path, edge case, error)
- [ ] Consola del navegador (F12) sin errores rojos
- [ ] No rompe features anteriores (verificar login + buscador + reservas siguen funcionando)
- [ ] Sin `console.log` de debug olvidados
- [ ] Sin datos hardcodeados de prueba
- [ ] Commit descriptivo en rama propia
- [ ] Pull Request abierto y revisado por el compañero
- [ ] Mergeado a `main`

Si alguno falta, no está hecho. Punto.

---

## 14. Enlaces y recursos del proyecto

- **Prototipo Figma:** https://www.figma.com/make/hagVYwcIi8n4F2AePmMSOl/Prototipo-de-página-web
- **Tablero Miro:** https://miro.com/app/board/uXjVH7NfUiA=/
- **Reunión con tutora (Patricia):** https://eu.bbcollab.com/collab/ui/session/guest/fbca11c8731742b4a424b5e20125780b
- **Supabase Dashboard:** [URL del proyecto]
- **GitHub Repo:** [URL privada]

---

## 15. Nota final para cualquier agente que lea esto

Este proyecto tiene un patrón repetido documentado en la sección 6: **construir la fachada antes que el motor**. Antes de aceptar cualquier tarea, pregúntate:

- ¿Estoy construyendo el diferenciador central o una feature secundaria?
- ¿La lógica que voy a implementar existe realmente o estoy maquetando algo que aparenta funcionar?
- ¿Estoy cerrando una tarea o abriendo un frente nuevo sin haber cerrado el anterior?

Si la respuesta es "estoy maquetando" o "estoy abriendo frente nuevo", para y devuelve la pregunta al equipo. El valor de este proyecto está en la Nota Real real, no en tener más pantallas bonitas.
