import { siteConfig } from '@/lib/config'

export type LocalAdminSettings = {
  defaultCity: string
  defaultCategory: string
  resultLimit: number
  attributionMode: string
}

export const defaultAdminSettings: LocalAdminSettings = {
  defaultCity: siteConfig.defaultCity,
  defaultCategory: siteConfig.defaultCategory,
  resultLimit: siteConfig.defaultResultLimit,
  attributionMode: siteConfig.attributionMode
}

export const localStorageKey = 'besttime-starter-admin-settings'
