import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api.js'

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return entries.length ? `?${new URLSearchParams(entries)}` : ''
}

export const useOverview = () => useQuery({ queryKey: ['overview'], queryFn: () => api('/reports/overview') })

export const useContacts = (params) =>
  useQuery({ queryKey: ['contacts', params], queryFn: () => api(`/contacts${qs(params)}`), placeholderData: (prev) => prev })

export const useContact = (id) =>
  useQuery({ queryKey: ['contact', id], queryFn: () => api(`/contacts/${id}`), enabled: Boolean(id) })

export const useTransactions = (params, options = {}) =>
  useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api(`/transactions${qs(params)}`),
    placeholderData: (prev) => prev,
    ...options,
  })

export const useReceivers = (contactId) =>
  useQuery({ queryKey: ['receivers', contactId], queryFn: () => api(`/contacts/${contactId}/receivers`), enabled: Boolean(contactId) })

export const useDaybook = (params) =>
  useQuery({ queryKey: ['daybook', params], queryFn: () => api(`/daybook${qs(params)}`), placeholderData: (prev) => prev })

export const useTransaction = (id) =>
  useQuery({ queryKey: ['transaction', id], queryFn: () => api(`/transactions/${id}`), enabled: Boolean(id) })

export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: () => api('/settings'), staleTime: 60_000 })

export const useLabels = () => useQuery({ queryKey: ['labels'], queryFn: () => api('/labels') })

export const useReminders = (params) =>
  useQuery({ queryKey: ['reminders', params], queryFn: () => api(`/reminders${qs(params)}`) })

export const useSeries = (params) =>
  useQuery({ queryKey: ['series', params], queryFn: () => api(`/reports/series${qs(params)}`), placeholderData: (prev) => prev })

export const usePeopleReport = (params) =>
  useQuery({ queryKey: ['people-report', params], queryFn: () => api(`/reports/people${qs(params)}`), placeholderData: (prev) => prev })


export { qs }

// Every write can change balances shown elsewhere, so refresh everything afterwards.
export function useSave() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ path, method = 'POST', body }) => api(path, { method, body }),
    onSuccess: () => client.invalidateQueries(),
  })
}
