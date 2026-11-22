# ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION ARCHITECTURE

**Impact Furniture v2 — Frontend Modernization**  
**Sprint 3 Architecture Documentation**

---

### 1. Overview & Principles

Impact Furniture v2 applies a multi-layered Defense-in-Depth security model for RBAC:

1. **Layer 1: Navigation Menu (`navigation.config.ts`)**  
   Items and submenus are filtered based on user permissions before being rendered.
2. **Layer 2: Router Navigation Guards (`guards.ts`)**  
   Every route transition checks `to.meta.permission` against `useAuthStore().hasPermission(...)`. Unauthorized transitions are intercepted and redirected to `/unauthorized`.
3. **Layer 3: UI Action Component State**  
   Action buttons (Create, Edit, Delete, Import) check permissions via `usePermissions()`. If lacking permission, buttons are hidden or disabled.
4. **Layer 4: Service Boundaries (`service-guard.ts`)**  
   Mock and future API services invoke `assertPermission(resource, action)`. Unauthorized calls reject immediately with a security exception, protecting against client console tampering.

---

### 2. Standardized Master Data Permissions

| Resource             | Read Permission    | Create Permission    | Update Permission    | Delete Permission    |
| :------------------- | :----------------- | :------------------- | :------------------- | :------------------- |
| **Suppliers**        | `procurement:read` | `procurement:create` | `procurement:update` | `procurement:delete` |
| **Customers**        | `sales:read`       | `sales:create`       | `sales:update`       | `sales:delete`       |
| **Materials**        | `inventory:read`   | `inventory:create`   | `inventory:update`   | `inventory:delete`   |
| **Products**         | `inventory:read`   | `inventory:create`   | `inventory:update`   | `inventory:delete`   |
| **Warehouses**       | `settings:read`    | `settings:create`    | `settings:update`    | `settings:delete`    |
| **Banks**            | `settings:read`    | `settings:create`    | `settings:update`    | `settings:delete`    |
| **Categories**       | `settings:read`    | `settings:create`    | `settings:update`    | `settings:delete`    |
| **Units of Measure** | `settings:read`    | `settings:create`    | `settings:update`    | `settings:delete`    |
| **Tax (PPN)**        | `settings:read`    | `settings:create`    | `settings:update`    | `settings:delete`    |
| **App Settings**     | `settings:read`    | `settings:create`    | `settings:update`    | `settings:delete`    |
| **Positions**        | `settings:read`    | `settings:create`    | `settings:update`    | `settings:delete`    |
| **Employee Status**  | `settings:read`    | `settings:create`    | `settings:update`    | `settings:delete`    |

---

### 3. Role Persona Matrix

#### A. Superadmin (`admin`)

- Has wildcard or full permissions across all modules (`*:*`).
- Can perform all operations (List, Detail, Create, Update, Delete, Import, Export).

#### B. Internal Auditor (`viewer`)

- Has read-only permissions across all modules (`procurement:read`, `inventory:read`, `sales:read`, `settings:read`).
- Can view lists, details, and trigger exports.
- Blocked by `service-guard.ts` when calling create, update, delete, or import methods.

#### C. Staff Penjualan (`staff_penjualan`)

- Has access to Sales (`sales:read`, `sales:create`, `sales:update`).
- Blocked by router guards when attempting to access Procurement, Inventory, or Settings (`/unauthorized` redirection).
