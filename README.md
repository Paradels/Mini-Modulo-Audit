# Mini módulo de Auditorías

Módulo web para gestionar auditorías con API simulada y comportamiento realista.

## Qué incluye

- **Listado de auditorías** con búsqueda, filtros, orden y paginación server-side.
- **Filtros persistidos en URL** (`q`, `status`, `process`, `ownerId`, `sort`, `page`) para mantener estado al recargar/compartir enlaces.
- **Wizard de creación (2 pasos)** con validación.
- **Detalle de auditoría + checks** con ejecución automática o manual.

## Decisiones técnicas

- **Frontend:** Vue 3 + Vue Router + Vite para una SPA ligera con navegación declarativa.
- **UI:** componentes reutilizables (`UiCard`, `UiBadge`, `UiTable`, `UiModal`, `UiToast`, `UiSkeleton`) para consistencia visual y estados de carga/error.
- **Capa de datos:** servicio mock en frontend (`src/services/auditService.js`) separado de la UI para mantener el contrato tipo API.
- **Mock HTTP opcional:** `mock-api/server.js` para probar endpoints con herramientas externas (Postman).
- **Estado en URL:** el listado toma query params como fuente de verdad para filtros y paginación.

## Trade-offs

- Se priorizó una implementación de producto funcional con buena UX frente a introducir gestión de estado global adicional.
- La simulación de ejecución usa polling al detalle en lugar de eventos en tiempo real para reducir complejidad.
- Se mantiene doble estrategia de mocks (servicio frontend + servidor HTTP) para flexibilidad de demo y validación de contrato.

## Reglas de simulación

- Latencia por request: **300–1200 ms**
- Errores aleatorios configurables: **10%–20%**
- Paginación real: `items + total + page + totalPages`
- Consistencia:
  - `DRAFT` = 0%
  - `IN_PROGRESS` = 1..99%
  - `DONE` = 100% sin KO
  - `BLOCKED` = 100% con KO

## Endpoints simulados

- `GET /audits`
- `GET /audits/:id`
- `POST /audits`
- `POST /audits/:id/run`
- `PATCH /audits/:id/checks/:checkId`
- `GET /templates`

## Dataset

- 40+ auditorías
- múltiples procesos, responsables y plantillas
- checks por auditoría según plantilla

## Arranque

### Frontend
```bash
npm install
npm run dev
```

### Mock API HTTP (Postman)
```bash
npm run mock:api
```

Base URL: `http://localhost:4000`

## Variables opcionales

- `MOCK_API_PORT` (default: 4000)
- `MOCK_API_ERROR_RATE` (ej: 0.12)
- `MOCK_API_KO_RATE` (ej: 0.15)

Ejemplo:
```bash
MOCK_API_PORT=4001 MOCK_API_ERROR_RATE=0.1 MOCK_API_KO_RATE=0.2 npm run mock:api
```

## Nota de persistencia

- Seed base: `src/mocks/auditDb.json`
- En frontend mock: `localStorage` (`mini-audit-mock-db`)

## Próximos pasos

- Añadir tests automáticos (2-3 unitarios en servicio y 1 smoke e2e de flujo listado → creación → detalle).
- Implementar UI optimista en `PATCH /audits/:id/checks/:checkId` con rollback controlado.
- Añadir modo offline parcial con fallback al último listado cacheado y aviso explícito.
- Publicar demo (deploy) y/o contenedor Docker para evaluación remota.
