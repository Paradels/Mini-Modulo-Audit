# Mini módulo de Auditorías

Aplicación web para gestionar auditorías y checklist con una API simulada y comportamiento realista.

## Entrega mínima

Este repositorio incluye:

- Aplicación web con 3 pantallas principales (listado, wizard, detalle).
- API mock con contrato de endpoints y simulación de latencia/errores.
- README con instrucciones de arranque, decisiones técnicas, trade-offs y mejoras pendientes.

## Funcionalidades implementadas

- **Listado de auditorías** con búsqueda, filtros, orden y paginación server-side.
- **Persistencia de filtros en URL** (`q`, `status`, `process`, `ownerId`, `sort`, `page`).
- **Wizard de creación de 2 pasos** con validación y bloqueo de avance hasta completar datos básicos.
- **Detalle de auditoría** con resumen de estado/progreso y lista de checks.
- **Ejecución simulada** de auditoría (progreso por checks con transición `QUEUED → RUNNING → OK/KO`).
- **Estados de UI**: loading (skeleton), error (reintento) y vacío (con CTA).

## Decisiones técnicas

- **Frontend:** Vue 3 + Vue Router + Vite.
- **Backend simulado:** Node.js + Express + `cors` en `mock-api/server.js`.
- **Componentes UI reutilizables:** `UiCard`, `UiBadge`, `UiTable`, `UiModal`, `UiToast`, `UiSkeleton`.
- **Separación de capas:** lógica de datos en `src/services/auditService.js` y presentación en vistas/componentes.
- **Doble estrategia de mock:**
  - Mock frontend (servicio con persistencia en `localStorage`) para flujo de la app.
  - Mock HTTP (Express) para validar endpoints con Postman/herramientas externas.

## Trade-offs

- Se priorizó simplicidad y claridad del flujo sobre añadir un estado global más complejo.
- La ejecución automática usa polling en detalle en lugar de eventos en tiempo real (menos complejidad).

## Contrato de API simulada

- `GET /audits`
  - Query params: `page`, `pageSize`, `q`, `status` (multi), `process`, `ownerId`, `sort`
  - Respuesta: `items + total` (y metadatos de paginación)
- `GET /audits/:id`
  - Respuesta: `{ audit, checks }`
- `POST /audits`
  - Crea auditoría + checks `PENDING` desde `templateId`
- `POST /audits/:id/run`
  - Devuelve `runId` e inicia ejecución progresiva
- `PATCH /audits/:id/checks/:checkId`
  - Actualiza check (`reviewed`, `evidence`, `status`)
- `GET /templates`
  - Listado de plantillas para wizard/preview

## Reglas de simulación

- Latencia variable por request: **300–1200 ms**.
- Errores aleatorios configurables: **10%–20%**.
- Paginación server-side real.
- Consistencia de negocio:
  - `DRAFT` = 0%
  - `IN_PROGRESS` = 1..99%
  - `DONE` = 100% sin checks `KO`
  - `BLOCKED` = incidencias (incluye finalización con `KO`)

## Dataset

- 60 auditorías (rango objetivo 40–80)
- 8 plantillas
- 10 responsables
- 6 procesos
- checks por auditoría según plantilla

## Instalación y arranque

> **Importante:** para ejecutar el mock API debes crear tu archivo `.env` local a partir de `.env.example`.

Instalar dependencias del proyecto:

```bash
npm install
```

Crear archivo de entorno para centralizar configuración del mock API:

```bash
cp .env.example .env
```

Después, ajusta en `.env` los valores que quieras usar (puerto, latencia, error rate, KO rate).

Si necesitas instalar explícitamente dependencias del mock API:

```bash
npm install express cors
```

Ejecutar frontend:

```bash
npm run dev
```

Ejecutar mock API HTTP:

```bash
npm run mock:api
```

Base URL mock API: `http://localhost:4000`

## Pruebas

Ejecutar tests unitarios:

```bash
npm run test
```

La cobertura actual incluye tests de servicio para paginación, filtros y reglas de consistencia de estado en `src/services/auditService.test.js`.

## Variables opcionales del mock API

- `MOCK_API_PORT` (default: `4000`)
- `MOCK_API_MIN_LATENCY` (default: `300`)
- `MOCK_API_MAX_LATENCY` (default: `1200`)
- `MOCK_API_ERROR_RATE` (ej: `0.12`)
- `MOCK_API_KO_RATE` (ej: `0.15`)

Ejemplo:

```bash
MOCK_API_PORT=4001 MOCK_API_MIN_LATENCY=250 MOCK_API_MAX_LATENCY=900 MOCK_API_ERROR_RATE=0.1 MOCK_API_KO_RATE=0.2 npm run mock:api
```

## Persistencia en entorno local

- Seed base: `src/mocks/auditDb.json`
- Mock frontend: persiste en `localStorage` con la clave `mini-audit-mock-db`

## Mejoras pendientes (si hubiera más tiempo)

- Ampliar cobertura de tests con pruebas de componentes y 1 flujo smoke e2e.
- Implementar UI optimista en actualización de checks con rollback.
- Añadir modo offline parcial con cache del último listado.
- Publicar deploy y/o contenedor Docker para evaluación remota.
