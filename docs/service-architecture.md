# Mock Service Infrastructure Architecture

## 1. Overview

The service layer in **Impact Furniture v2** isolates domain data consumption from transport implementation details. UI components only depend on typed service interfaces, while the underlying transport can switch between in-memory mock adapters and real NestJS HTTP adapters without impacting presentation components.

```text
┌────────────────────────────────────────────────────────┐
│                   Vue 3 UI Components                  │
│     (Pages, Data Tables, Forms, Dashboard Widgets)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               Domain Service Interface                 │
│         (e.g., ISalesOrderService, IAuthService)       │
└───────────────────────────┬────────────────────────────┘
                            │
                 Service Factory Switch
                 (isMockModeEnabled())
               ┌────────────┴────────────┐
               │                         │
       [VITE_USE_MOCK=true]      [VITE_USE_MOCK=false]
               │                         │
               ▼                         ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     Mock Service Adapter  │ │     HTTP Service Adapter  │
│  - In-memory dataset      │ │  - Axios / Fetch Client   │
│  - Configurable Latency   │ │  - Real NestJS API        │
│  - Error scenario testing │ │  - JWT Interceptors       │
└───────────────────────────┘ └───────────────────────────┘
```

---

## 2. Core Service Abstraction

### 2.1 Service Factory (`src/shared/services/service-factory.ts`)

The `createService<T>(name, mockFactory, httpFactory)` function provides environment-driven resolution:

- Reads `import.meta.env.VITE_USE_MOCK` (defaults to `true` for development and test).
- If `VITE_USE_MOCK=false` and no HTTP adapter is supplied, throws `ServiceConfigurationError` immediately to prevent silent fallbacks to mock data in production.

### 2.2 Standardized Pagination & Sorting (`src/shared/types/pagination.types.ts`)

```ts
export interface PaginationParams {
  page: number
  limit: number
}

export interface SortParams {
  field: string
  direction: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
```

### 2.3 Error Handling & Normalization (`src/shared/services/api-error.ts`)

All service errors are normalized into `ApiError` instances:

- `ApiErrorCode`: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `SERVER_ERROR`, `NETWORK_ERROR`, `UNKNOWN_ERROR`.
- `normalizeError(err)` ensures consistent error structure across mock and real network failures.

---

## 3. Mock Adapter Capabilities

### 3.1 Latency Simulation (`src/shared/services/mock/mock-delay.ts`)

Configurable simulated delay (default 200–450ms) to verify skeleton and spinner behavior. Automatically set to 0ms when `import.meta.env.MODE === 'test'` for fast unit tests.

### 3.2 Mock Response Helpers (`src/shared/services/mock/mock-response.ts`)

- `createSuccessResponse(data, meta?)`: Wraps data in standardized envelope.
- `createErrorResponse(code, message, details?)`: Throws normalized `ApiError`.
- `paginateArray(array, page, limit)`: Pure in-memory pagination calculator.
- `sortArray(array, field, direction)`: Multi-type in-memory sort helper.

### 3.3 Query String Utilities (`src/shared/utils/query-params.ts`)

- `buildQueryString(params)`: Encodes complex pagination and filter parameters safely.
- `parseQueryString(queryString)`: Decodes browser URL queries.

---

## 4. Domain Service Example: Sales Order Service

A reference implementation is located in `src/modules/sales/`:

- `types/sales-order.types.ts`: Domain models (`SalesOrder`, `SalesOrderStatus`, `SalesOrderFilterParams`).
- `mocks/sales-orders.mock.ts`: Deeply frozen mock dataset (`Object.freeze`) of 12 realistic orders.
- `services/sales-order.mock.ts`: `MockSalesOrderService` implementing filtering, pagination, sorting, status updates, and error scenario simulation (`validation_error`, `server_error`, `network_error`).
- `services/sales-order.service.ts`: Singleton instance instantiated via `createService`.

---

## 5. Migration Strategy for Sprint 2 (Backend Integration)

When the NestJS backend is deployed in Sprint 2:

1. Create `src/modules/sales/services/sales-order.http.ts` implementing `ISalesOrderService` using Axios / Fetch.
2. Supply `httpFactory` to `createService('SalesOrderService', () => new MockSalesOrderService(), () => new HttpSalesOrderService())`.
3. Set `VITE_USE_MOCK=false` in `.env.production`.
4. Zero changes required in any Vue component or store.
