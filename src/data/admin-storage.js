import { initialAdmins } from './admins'

const ADMINS_STORAGE_KEY = 'wegz-admins'

export function getAdmins() {
  const storedAdmins = localStorage.getItem(ADMINS_STORAGE_KEY)
  return storedAdmins === null ? initialAdmins : JSON.parse(storedAdmins)
}

export function saveAdmins(admins) {
  localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(admins))
}
