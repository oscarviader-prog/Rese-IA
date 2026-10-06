ReseñIA — Análisis de reseñas con IA

Detecta reseñas falsas en Google y calcula una "Nota Real" verificada para cada negocio.

🔗 Demo: rese-ia.vercel.app

Mostrar imagen

El problema

Las valoraciones de Google se pueden manipular: reseñas compradas, campañas de reseñas negativas, perfiles falsos. Un usuario no tiene forma de saber si un 4,7 es real, y un negocio honesto no tiene forma de demostrar que el suyo sí lo es.

La solución

ReseñIA analiza las reseñas de un negocio en Google Places, identifica patrones de reseñas sospechosas mediante IA y calcula una Nota Real que excluye las valoraciones poco fiables.

Para usuarios (B2C): consulta gratuita de cualquier negocio.
Para empresas (B2B): panel propio con su Nota Real verificada, seguimiento en el tiempo y verificación de titularidad.
Funcionalidades principales
Análisis de reseñas con IA (Gemini): detección de reseñas sospechosas y cálculo de la Nota Real.
Verificación empresarial con doble validación: algoritmo oficial de CIF/NIF + cruce con los datos de Google Places API.
Arquitectura multi-tenant: cada empresa solo accede a sus datos mediante Row Level Security en PostgreSQL.
Backend serverless: Edge Functions en Deno que consumen APIs externas.
Snapshots automáticos: histórico de la evolución de cada negocio con pg_cron.
Stack
Capa	Tecnología
Frontend	React 19 · TypeScript · Vite · TailwindCSS
Backend	Supabase · PostgreSQL · Edge Functions (Deno) · pg_cron
Seguridad	Row Level Security (multi-tenant)
IA	Google Gemini
Datos externos	Google Places API
Despliegue	Vercel
Arquitectura
Usuario / Empresa
      │
      ▼
React (Vercel) ──► Supabase Auth
      │
      ▼
Edge Functions (Deno) ──► Google Places API
      │                └──► Gemini (análisis)
      ▼
PostgreSQL + RLS ◄── pg_cron (snapshots periódicos)
Mi papel

Proyecto fin de programa de la Escuela de Organización Industrial (EOI), desarrollado en un equipo de 2 personas.

Fui responsable del lado empresa (panel B2B, verificación de titularidad) y del backend serverless (Edge Functions, modelo de datos, políticas RLS y tareas programadas).

Ejecutar en local
bash
git clone https://github.com/oscarviader-prog/Rese-IA.git
cd Rese-IA
npm install
cp .env.example .env   # añade tus claves de Supabase, Google Places y Gemini
npm run dev   # abre http://localhost:3000
Autores
Oscar Navarro Viader — LinkedIn · GitHub
Noelia — GitHub
