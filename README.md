# Crash Platform Prototype

Prototipo técnico de una plataforma web de juego tipo crash/multiplicador para pruebas con **créditos ficticios**.

> Este repositorio NO implementa dinero real, depósitos, retiros, KYC real, pagos ni operación regulada. Está pensado para validar UX, arquitectura, WebSockets, rondas, wallet demo y flujo de juego.

## Stack
- Frontend: Next.js + TypeScript + Tailwind CSS
- Game UI: Canvas/DOM con lógica de presentación
- Backend: NestJS + TypeScript
- DB: PostgreSQL + Prisma
- Tiempo real: Socket.IO
- Cache/estado efímero: Redis
- Infra: Docker Compose

## Estructura
```text
crash-platform-prototype/
├─ apps/
│  ├─ backend/
│  │  ├─ src/
│  │  │  ├─ auth/
│  │  │  ├─ users/
│  │  │  ├─ games/
│  │  │  ├─ bets/
│  │  │  ├─ wallet/
│  │  │  ├─ admin/
│  │  │  └─ common/
│  │  └─ prisma/
│  └─ frontend/
├─ infra/
├─ docs/
└─ docker-compose.yml
```

## Requisitos
- Node.js 20+
- Docker Desktop
- npm 10+

## Ejecutar infraestructura
```bash
docker compose up -d postgres redis
```

## Backend
```bash
cd apps/backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

API: http://localhost:4000
Socket: ws://localhost:4000/game

## Frontend
En otra terminal:
```bash
cd apps/frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

## Desplegar para pruebas

Para una primera prueba en internet, despliega `apps/frontend` en Vercel y ejecuta el backend NestJS como un único servicio Node.js persistente. El backend actual mantiene el ciclo de rondas y su estado en memoria; no lo escales a varias instancias todavía, porque cada instancia iniciaría su propio ciclo.

### Vercel (frontend)

1. Importa el repositorio y selecciona `apps/frontend` como **Root Directory**.
2. Define `NEXT_PUBLIC_API_URL` con la URL pública HTTPS del backend, por ejemplo `https://api.example.com`.
3. Despliega de nuevo después de guardar la variable, ya que Next.js la incorpora durante la compilación.

### Backend persistente

Configura estas variables en el proveedor del backend:

- `DATABASE_URL`: URL de PostgreSQL accesible desde el backend desplegado.
- `JWT_SECRET`: secreto aleatorio único; no uses `change-me-in-development`.
- `CORS_ORIGIN`: URL exacta del frontend de Vercel. Se aceptan varios orígenes separados por coma.
- `PORT`: usa el puerto que proporcione el proveedor, si corresponde.

Usa `npm run build` y `npm start` desde `apps/backend`. Aplica las migraciones con `npm run prisma:migrate:deploy` antes de iniciar la aplicación por primera vez. Para las primeras pruebas, conserva una sola instancia del backend. El Redis de Docker Compose es local y este prototipo todavía no lo usa para coordinar rondas.

Las conexiones WebSocket de Vercel están en beta y una conexión queda asociada a una instancia de función durante su vida útil; las instancias distintas necesitan estado y publicación compartidos, además de reconexión. El ciclo actual de rondas vive en memoria, así que el backend persistente de una sola instancia es la opción más sencilla para validar el juego ahora.

La cuenta demo del README es compartida. Si varias personas la usan al mismo tiempo, también compartirán sus créditos y su historial.

## Usuario demo
- email: demo@example.com
- password: Demo1234!

## Flujo de prueba
1. Entrar al frontend.
2. Iniciar sesión con el usuario demo.
3. El backend crea rondas automáticamente.
4. Usar créditos ficticios para apostar.
5. Retirar manualmente durante la ronda.
6. Revisar historial.
7. Entrar al panel admin para consultar rondas.

## Próxima fase
Antes de cualquier integración con dinero real, se debe hacer una fase independiente de requisitos regulatorios, seguridad, certificación, KYC/AML, pagos, juego responsable, auditoría y propiedad intelectual.
