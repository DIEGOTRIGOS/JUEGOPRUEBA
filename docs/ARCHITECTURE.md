# Arquitectura del prototipo

## Separación de responsabilidades
- Next.js: UX, navegación y presentación.
- Phaser/Canvas: se incorporará en la siguiente iteración para sustituir la animación demo por una escena de juego.
- NestJS: API, autenticación, apuestas demo, wallet demo y administración.
- Socket.IO: eventos de ronda en tiempo real.
- PostgreSQL: persistencia transaccional.
- Redis: reservado para estado efímero, rate limiting y escalado horizontal en la siguiente iteración.

## Flujo de una ronda
1. Estado WAITING.
2. Backend genera server seed.
3. Backend publica hash del server seed.
4. Se inicia la ronda.
5. El backend calcula el multiplicador.
6. El backend emite ticks por WebSocket.
7. La ronda termina en el multiplicador calculado.
8. Se cierran apuestas abiertas como LOST.
9. Se revela el server seed para permitir verificación del prototipo.

## Lo que deliberadamente no existe
- Dinero real.
- Depósitos.
- Retiros bancarios.
- Pasarelas de pago.
- KYC real.
- AML real.
- Promociones monetarias.
- Operación con usuarios reales.
- Integración con proveedores regulados.

Esas piezas deben diseñarse después de completar la fase jurídica, regulatoria, de certificación y seguridad.
