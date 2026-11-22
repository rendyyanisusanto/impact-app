# Master Data CRUD Architecture — Impact Furniture v2

## 1. Overview

The Master Data CRUD Architecture in **Impact Furniture v2** provides a unified, highly typed, and reactive pattern across all ERP resource modules. Designed to run completely on modern browser standards without proprietary component frameworks, the architecture cleanly decouples:

1. **Domain Contract Layer**: Interface definitions for entities, DTOs, and queries.
2. **State Management Composable (`useCrud`)**: Centralized reactive logic for list pagination, multi-field filtering, sorting, modals, toasts, and confirmation dialogs.
3. **Data Service Layer**: Asynchronous service abstraction (`CrudService<T, CreateDto, UpdateDto>`) ready to seamlessly swap mock services with NestJS REST APIs in future sprints.
4. **Presentation Layer**: Tailwind CSS-powered tables, accessible skeletons, responsive modals, and action toolbars.

---

## 2. Composable Anatomy: `useCrud<T, CreateDto, UpdateDto>`

Located in `app/src/shared/composables/useCrud.ts`, `useCrud` accepts any service implementing `CrudService<T, CreateDto, UpdateDto>` and options:

```ts
export interface UseCrudOptions<T> {
  resourceName: string // e.g. 'procurement.suppliers' for RBAC permission check
  entityLabel: string // e.g. 'Supplier' for toast/dialog labels
  defaultPageSize?: number // defaults to 10
  defaultSortBy?: string // defaults to 'id'
  defaultSortOrder?: 'asc' | 'desc'
  initialFilters?: Record<string, unknown>
}
```

### Reactive State Exposed

- `items`: Ref array of typed domain records currently displayed.
- `totalItems`, `currentPage`, `pageSize`, `totalPages`: Pagination state synced with `AppPagination.vue`.
- `searchQuery`: Debounce-compatible reactive search string.
- `statusFilter`: Reactive dropdown filter ('all', 1, 0).
- `sortBy`, `sortOrder`: Reactive sorting parameters with toggling helper `handleSort(field)`.
- `isLoading`: Boolean loading indicator controlling `AppTableSkeleton.vue`.
- `isFormOpen`, `formMode`, `selectedItem`, `isSaving`: Manages the create/edit modal lifecycle.
- `isDetailOpen`: Manages the read-only inspection modal.
- `isImportOpen`: Manages the batch Excel upload modal.

---

## 3. Data Flow Diagram

```text
+-------------------+      User Actions        +------------------------+
|                   |  (Search, Filter, Sort)  |                        |
|   Master Data     | -----------------------> |    useCrud Composable  |
|    List Page      |                          | (Reactive State & UX)  |
|                   | <----------------------- |                        |
+-------------------+      Reactive State      +------------------------+
         |                                                 |
         | Form / Delete / Export                          | Service Call
         v                                                 v
+-------------------+                          +------------------------+
| AppCrudForm Modal |                          |   CrudService<T>       |
| & Confirm Dialog  |                          | (Mock / Future NestJS) |
+-------------------+                          +------------------------+
```

---

## 4. UI States & Zero-Layout-Shift Loading

To prevent Cumulative Layout Shift (CLS) when users navigate between pages or update filters:

1. `isLoading` initializes to `true` while initial data is fetched asynchronously.
2. `AppTableSkeleton.vue` renders geometric placeholder table rows matching the requested `pageSize`.
3. If the returned record count is 0, `AppEmptyState.vue` is rendered with clear guidance to reset active search or filters.
4. Once data arrives, the table smoothly transitions to the actual data rows without layout jumping.
