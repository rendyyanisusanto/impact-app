import type { BaseEntity } from '@/shared/types/crud.types'

export interface Bank extends BaseEntity {
  id: number
  bank: string | null // nama bank / keterangan akun
  rekening: string | null // nomor rekening dlm bentuk string (menjaga leading zero)
}

export interface CreateBankDto {
  bank: string
  rekening: string
}

export interface UpdateBankDto extends Partial<CreateBankDto> {
  id?: number
}
