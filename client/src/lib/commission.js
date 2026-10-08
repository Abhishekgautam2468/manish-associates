// The same commission rule as the server (server/src/db.js commissionFor), so forms show what will be saved.
// A fixed % (typed for this entry, or the service's own) wins; otherwise the Settings slab for the amount,
// else the default %. Then the minimum commission applies. Amounts are paise; the result is rounded to the rupee.
export function commissionRule(amount, settings, fixedPercent = null) {
  const s = settings ?? { commission_percent: 1, min_commission: 0, slabs: [] }
  let percent = fixedPercent
  let source = 'fixed'
  if (percent == null) {
    const slab = (s.slabs ?? []).find((x) => x.up_to == null || amount <= x.up_to * 100)
    percent = slab ? slab.percent : s.commission_percent
    source = slab ? 'slab' : 'default'
  }
  if (!amount) return { fee: 0, percent, source, min: false }
  const raw = Math.round((amount * percent) / 100 / 100) * 100
  const min = Math.round((s.min_commission ?? 0) * 100)
  return { fee: Math.max(raw, min), percent, source, min: min > raw }
}
