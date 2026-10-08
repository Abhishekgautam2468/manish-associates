// Helpers shared by a person's on-screen statement and the printable statement.

// Entries oldest first, each with the person's running balance after it.
// Positive: you hold their money (you owe them). Negative: they owe you.
// The server sends each entry's `effect` on the balance of the person it belongs to.
export function withBalance(items, contactId) {
  let balance = 0
  return [...items]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((e) => {
      // A transfer sent *to* this person on someone else's behalf doesn't touch their balance.
      const forOther = Boolean(contactId && e.contact_id !== contactId)
      if (!forOther) balance += e.effect ?? 0
      // Money sent to this person on someone else's behalf: they only received the amount sent.
      if (forOther) return { ...e, balance, received_for_other: true, cash_in: 0, cash_out: e.amount, commission: 0 }
      return { ...e, balance, received_for_other: false }
    })
}

// Short words for a balance amount: "₹500 due" / "₹500 held" / "settled".
export function balanceWord(balance, money) {
  if (!balance) return { text: 'settled', tone: 'ok' }
  return balance < 0 ? { text: `${money(-balance)} due`, tone: 'attn' } : { text: `${money(balance)} held`, tone: 'out' }
}
