/**
 * 4 fundamental legacy permission flags
 * C: Create
 * R: Read (includes Print/Export)
 * U: Update
 * D: Delete
 */
export interface SubmenuPermissionFlag {
  c: boolean
  r: boolean
  u: boolean
  d: boolean
}

export interface SubmenuAllowedActions {
  c: boolean
  r: boolean
  u: boolean
  d: boolean
}

export interface SubmenuDefinition {
  id: number | string
  menuId: number | string
  name: string
  alias?: string
  resource: string
  link?: string
  allowedActions: SubmenuAllowedActions
}

export interface MenuCategoryDefinition {
  id: number | string
  name: string
  submenus: SubmenuDefinition[]
}

export interface DashboardWidgetDefinition {
  id: number | string
  name: string
  keterangan: string
  column?: number
}

/**
 * Master Group Entity (matches database table `groups`)
 */
export interface Group {
  id: number
  name: string
  description: string
  userCount?: number
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

/**
 * Matches database table `groups_detail`
 */
export interface LegacyGroupDetailEntity {
  id: number
  groups_id: number
  submenu_id: number | string
  c: number // 1 or 0
  r: number // 1 or 0
  u: number // 1 or 0
  d: number // 1 or 0
}

/**
 * Matches database table `groups_dashboard`
 */
export interface LegacyGroupDashboardEntity {
  id: number
  group_id: number
  dashboard_id: number | string
  column: number
}

/**
 * Matches database table `users_groups`
 */
export interface LegacyUserGroupEntity {
  id: number
  user_id: number | string
  group_id: number
}

/**
 * Form DTO for creating or updating a Group
 */
export interface GroupFormDto {
  name: string
  description: string
  dashboardIds: (number | string)[]
  permissions: Record<string, SubmenuPermissionFlag>
}

/**
 * Filter and pagination parameters for Group List
 */
export interface GroupFilterDto {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: 'id' | 'name' | 'description' | 'userCount'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated result of groups
 */
export interface GroupPaginatedResult {
  items: Group[]
  totalItems: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Summary metrics of selected permissions for UX feedback
 */
export interface GroupPermissionSummary {
  activeCategoriesCount: number
  totalCategoriesCount: number
  submenusWithReadCount: number
  totalSubmenusCount: number
  createCount: number
  updateCount: number
  deleteCount: number
  totalSelectedFlags: number
  dashboardWidgetsCount: number
}

/**
 * Detail ViewModel for Group Look/Detail page
 */
export interface GroupDetailViewModel {
  group: Group
  assignedUserNames: string[]
  dashboardWidgets: DashboardWidgetDefinition[]
  menuCategories: {
    id: number | string
    name: string
    submenus: {
      id: number | string
      name: string
      resource: string
      c: boolean
      r: boolean
      u: boolean
      d: boolean
      allowedActions: SubmenuAllowedActions
    }[]
  }[]
  summary: GroupPermissionSummary
}
