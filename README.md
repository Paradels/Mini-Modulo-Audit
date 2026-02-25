# Mini módulo de Auditorías

Módulo web para gestionar auditorías con API simulada y comportamiento realista.

## Qué incluye

- **Listado de auditorías** con búsqueda, filtros, orden y paginación server-side.
- **Filtros persistidos en URL** (`q`, `status`, `process`, `ownerId`, `sort`, `page`) para mantener estado al recargar/compartir enlaces.
- **Wizard de creación (2 pasos)** con validación.
- **Detalle de auditoría + checks** con ejecución automática o manual.

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
