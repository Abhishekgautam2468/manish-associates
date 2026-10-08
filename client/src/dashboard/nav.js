import { BarChart3, BellRing, BookOpenCheck, LayoutDashboard, Scale, ReceiptText, Settings, Tags, Users } from 'lucide-react'

export const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/entries', label: 'Entries', icon: ReceiptText },
  { to: '/dashboard/daybook', label: 'Day book', icon: BookOpenCheck },
  { to: '/dashboard/balances', label: 'Balances', icon: Scale },
  { to: '/dashboard/people', label: 'People', icon: Users },
  { to: '/dashboard/reminders', label: 'Reminders', icon: BellRing, badge: 'reminders' },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
]

export const LABELS_PAGE = { to: '/dashboard/labels', label: 'Labels', icon: Tags }
export const SETTINGS_PAGE = { to: '/dashboard/settings', label: 'Settings', icon: Settings }

// Phones: the pages reached from "More" (the bottom bar has Overview, Entries and Balances).
export const MORE_PAGES = [
  ...NAV.filter((p) => !['/dashboard', '/dashboard/entries', '/dashboard/balances'].includes(p.to)),
  LABELS_PAGE,
  SETTINGS_PAGE,
]

// Everything the search palette can jump to.
export const ALL_PAGES = [...NAV, LABELS_PAGE, SETTINGS_PAGE]
