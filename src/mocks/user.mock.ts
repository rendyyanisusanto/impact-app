export interface MockUser {
  id: number
  name: string
  role: string
  initials: string
  email?: string
}

export const mockUser: MockUser = {
  id: 1,
  name: 'Superadmin',
  role: 'Superadmin',
  initials: 'SA',
  email: 'admin@impactfurniture.co.id'
}
