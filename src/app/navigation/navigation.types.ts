import type { Component } from 'vue'

export interface NavigationItem {
  id: string
  label: string
  icon?: Component | string
  route?: string
  path?: string
  children?: NavigationItem[]
  permission?: string
}

export interface BreadcrumbItem {
  label: string
  to?: string
  current?: boolean
}
