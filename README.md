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
