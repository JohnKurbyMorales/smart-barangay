import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function generateReportNumber() {
  const now = new Date()
  return `RPT-${format(now, 'yyyyMMddHHmmss')}`
}

export function truncate(str: string, length: number) {
  return str.length > length ? str.slice(0, length) + '...' : str
}
