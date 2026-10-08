import { formatFullDate, modeLabel, money } from './format.js'

// A plain-text receipt for one entry, ready to send on WhatsApp.
function receiptText(e, balance) {
  const lines = ['*Manish Associates*', `Receipt · ${formatFullDate(e.date)}`, '']
  if (e.contact_name) lines.push(`Customer: ${e.contact_name}`)
  if (e.type === 'transfer') {
    const service = e.label_name || (e.payee === 'self' ? 'Cash withdrawal' : 'Money transfer')
    lines.push(service)
    if (e.received) lines.push(`Received: ${money(e.received)} (${modeLabel(e.mode)})`)
    if (e.payee === 'self') lines.push(`Given: ${money(e.amount)} (${modeLabel(e.paid_mode ?? e.mode)})`)
    else
      lines.push(
        `Sent: ${money(e.amount)} to ${e.to_name}${e.to_account ? ` (${e.to_account})` : ''} by ${modeLabel(e.paid_mode ?? e.mode)}`,
      )
  } else if (e.type === 'adjust') {
    lines.push(`Balance noted: ${money(e.amount)} ${e.direction === 'owes_you' ? 'due to us' : 'held for you'}`)
  } else {
    lines.push(`${e.type === 'in' ? 'Received' : 'Paid'}: ${money(e.amount)} (${modeLabel(e.mode)})`)
  }
  if (e.note) lines.push(`Note: ${e.note}`)
  if (balance != null && e.contact_name) {
    lines.push('')
    lines.push(balance === 0 ? 'Balance: all settled' : balance < 0 ? `Balance due: ${money(-balance)}` : `Held for you: ${money(balance)}`)
  }
  lines.push('', 'Thank you')
  return lines.join('\n')
}

// WhatsApp link with the receipt; without a phone number WhatsApp lets you pick the chat.
export function receiptLink(e, balance, phone) {
  const text = encodeURIComponent(receiptText(e, balance))
  const digits = (phone ?? '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`
}
