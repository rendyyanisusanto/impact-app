import type { Component } from 'vue'

export interface NavigationItem {
  id: string
  label: string
  path?: string
  route?: string
  icon?: Component | string
  children?: NavigationItem[]
  permission?: string
  badge?: string | number
}

export interface BreadcrumbItem {
  label: string
  to?: string
  current?: boolean
}
