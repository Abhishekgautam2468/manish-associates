// Helpers available to every `run` in the UI suites. The runner puts this text in front of each run,
// together with FIX (people, entries and the run tag the setup created). Plain browser JavaScript.
const w = (ms) => new Promise((r) => setTimeout(r, ms));
const notes = []; let ok = true;
const fail = (m) => { ok = false; notes.push('FAIL ' + m); };
const note = (m) => notes.push(m);
const expect = (cond, m) => { if (!cond) fail(m); else note('ok ' + m); };
const setVal = (el, v) => { const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
const all = (sel, root) => [...(root || document).querySelectorAll(sel)];
const btn = (text, root) => all('button, a, [role=radio], [role=tab], [role=option]', root).find((b) => b.textContent.replace(/\s+/g, ' ').trim().includes(text));
// The test database keeps earlier runs' entries, so saving the same entry again the same day shows the
// "looks like a repeat" warning. Saves confirm it, unless a case sets autoRepeat = false to test the warning itself.
let autoRepeat = true;
const click = async (text, root, wait = 350) => {
  const b = typeof text === 'string' ? btn(text, root) : text;
  if (!b) { fail('missing button: ' + text); return false; }
  b.click(); await w(wait);
  const again = b.type === 'submit' && autoRepeat && /looks like a repeat/.test(dlg()?.innerText ?? '') && btn('Yes, save it again', dlg());
  if (again) { again.click(); await w(wait); }
  return true;
};
const dlg = () => all('dialog[open]').at(-1);
const toast = () => document.querySelector('.toasts')?.innerText ?? '';
const api = async (p) => (await fetch('/api' + p)).json();
const pickContact = async (input, name) => { input.focus(); setVal(input, name); await w(900); const o = all('[role=option]').find((x) => x.textContent.includes(name)); if (!o) { fail('no option for ' + name); return; } o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); await w(500); };
const text = () => document.body.innerText;
