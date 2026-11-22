import type { BaseEntity } from '@/shared/types/crud.types'

export interface AppSetting extends BaseEntity {
  id: number // maps to id_setting_table
  id_setting_table: number
  table: string | null
  name: string | null
  value: string | null
  keterangan: string | null
}

export interface CreateAppSettingDto {
  table: string
  name: string
  value: string
  keterangan?: string | null
}

export interface UpdateAppSettingDto extends Partial<CreateAppSettingDto> {
  id?: number
}
