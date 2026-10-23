import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const CURRENCIES = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ' }
export const GST = [0, 5, 12, 18, 28]
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
export const num = (v) => { const n = parseFloat(v); return isFinite(n) && n > 0 ? n : 0 }

export const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
export const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage full or blocked */ } }

export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
export const fmtDate = (s) => s ? new Date(s + 'T00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
export const fmt = (cur, n, pdf) => {
  let sym = CURRENCIES[cur] || ''
  if (pdf && sym === '₹') sym = 'Rs. ' // built-in PDF fonts have no rupee glyph
  return (n < 0 ? '-' : '') + sym + Math.abs(n).toLocaleString(cur === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const blankItem = () => ({ id: crypto.randomUUID(), desc: '', qty: 1, price: '', discount: '', tax: 18 })
export const newInvoice = (s) => ({
  id: crypto.randomUUID(), number: 'INV-' + String(s.counter).padStart(4, '0'), date: today(), due: '',
  currency: s.currency, terms: '', gstOn: !!s.biz.gstin, paid: '',
  customer: { name: '', address: '', contact: '', gstin: '' },
  items: [blankItem()], notes: s.notes, payment: s.payment, thanks: s.thanks,
})
export const sampleInvoice = (s) => ({
  ...newInvoice(s), gstOn: true, terms: 'Due within 7 days',
  customer: { name: 'Sharma Traders', address: '45 Ashram Road, Ahmedabad, Gujarat 380009', contact: 'sharma@example.com', gstin: '' },
  items: [
    { id: crypto.randomUUID(), desc: 'Laptop screen replacement (15.6" FHD)', qty: 1, price: 4500, discount: '', tax: 18 },
    { id: crypto.randomUUID(), desc: 'Labour and service charge', qty: 2, price: 250, discount: 10, tax: 18 },
  ],
})

export function calc(inv) {
  const items = inv.items.filter((i) => i.desc.trim() || num(i.price) > 0)
  let sub = 0, disc = 0, tax = 0
  const lines = items.map((it) => {
    const gross = r2(num(it.qty) * num(it.price))
    const d = r2(gross * Math.min(num(it.discount), 100) / 100)
    const net = r2(gross - d)
    const t = inv.gstOn ? r2(net * num(it.tax) / 100) : 0
    sub += gross; disc += d; tax += t
    return { ...it, gross, d, net, t, total: r2(net + t) }
  })
  const total = r2(sub - disc + tax)
  const paid = Math.min(num(inv.paid), total)
  return { lines, sub: r2(sub), disc: r2(disc), tax: r2(tax), total, paid, balance: r2(total - paid) }
}

export function validate(inv, biz) {
  const e = {}
  if (!biz.name?.trim()) e.bizName = 'Business name is required'
  if (!inv.number.trim()) e.number = 'Invoice number is required'
  if (!inv.date) e.date = 'Invoice date is required'
  if (inv.due && inv.due < inv.date) e.due = 'Due date is before the invoice date'
  if (!inv.customer.name.trim()) e.custName = 'Customer name is required'
  if (!inv.items.some((i) => i.desc.trim() && num(i.qty) > 0 && num(i.price) > 0)) e.items = 'Add at least one item with a description, quantity and price'
  return e
}

export function buildPdf(inv, biz) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const c = calc(inv), W = 210, M = 15, f = (n) => fmt(inv.currency, n, true)
  const BLUE = [37, 99, 235], INK = [30, 41, 59], MUTE = [100, 116, 139]
  let y = 18, tx = M
  if (biz.logo) {
    try {
      const ar = biz.logoAR || 1, h = ar > 1 ? 22 : 22 * ar, w = ar > 1 ? 22 / ar : 22
      doc.addImage(biz.logo, 'PNG', M, y - 4, w, h); tx = M + w + 5
    } catch { /* skip unreadable logo */ }
  }
  doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(...INK).text(biz.name || 'Your business', tx, y + 2)
  const bl = [...doc.splitTextToSize(biz.address || '', 85), biz.phone, biz.email, biz.gstin && 'GSTIN: ' + biz.gstin].filter(Boolean)
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTE).text(bl, tx, y + 8)
  doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(...BLUE).text('INVOICE', W - M, y + 2, { align: 'right' })
  const meta = [['Invoice no.', inv.number], ['Issue date', fmtDate(inv.date)], ...(inv.due ? [['Due date', fmtDate(inv.due)]] : []), ...(inv.terms ? [['Terms', inv.terms]] : [])]
  doc.setFontSize(9)
  meta.forEach((m, i) => {
    doc.setFont('helvetica', 'normal').setTextColor(...MUTE).text(m[0], W - M - 55, y + 10 + i * 5)
    doc.setFont('helvetica', 'bold').setTextColor(...INK).text(m[1], W - M, y + 10 + i * 5, { align: 'right' })
  })
  y = Math.max(y + 8 + bl.length * 4.2, y + 10 + meta.length * 5) + 6
  doc.setDrawColor(...BLUE).setLineWidth(0.6).line(M, y, W - M, y)
  y += 7
  const cu = inv.customer
  doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(...BLUE).text('Bill to', M, y)
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK).text(cu.name, M, y + 5.5)
  const cl = [...doc.splitTextToSize(cu.address || '', 90), cu.contact, cu.gstin && 'GSTIN: ' + cu.gstin].filter(Boolean)
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTE).text(cl, M, y + 10.5)
  y += 12 + cl.length * 4.2 + 3

  const head = ['#', 'Description', 'Qty', 'Rate', ...(c.disc ? ['Disc'] : []), ...(inv.gstOn ? ['GST'] : []), 'Amount']
  const body = c.lines.map((l, i) => [i + 1, l.desc, num(l.qty), f(num(l.price)), ...(c.disc ? [num(l.discount) ? num(l.discount) + '%' : '-'] : []), ...(inv.gstOn ? [num(l.tax) + '%'] : []), f(l.total)])
  const right = { halign: 'right' }
  autoTable(doc, {
    startY: y, head: [head], body, theme: 'plain', margin: { left: M, right: M, bottom: 22 },
    styles: { fontSize: 9, cellPadding: 2.5, textColor: INK, overflow: 'linebreak' },
    headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 247, 254] },
    columnStyles: { 0: { cellWidth: 9 }, 1: { cellWidth: 'auto' }, 2: { ...right, cellWidth: 14 }, 3: { ...right, cellWidth: 28 }, [head.length - 1]: { ...right, cellWidth: 30 }, ...(head.length > 5 ? { 4: { ...right, cellWidth: 14 } } : {}), ...(head.length > 6 ? { 5: { ...right, cellWidth: 14 } } : {}) },
    didParseCell: (d) => { if (d.section === 'head' && d.column.index >= 2) d.cell.styles.halign = 'right' },
  })
  y = doc.lastAutoTable.finalY + 8
  const rows = [['Subtotal', f(c.sub)], ...(c.disc ? [['Discount', '-' + f(c.disc)]] : []), ...(inv.gstOn ? [['Tax (GST)', f(c.tax)]] : []), ['Total', f(c.total), 'b'], ...(c.paid ? [['Amount paid', '-' + f(c.paid)]] : []), ...(c.paid ? [['Balance due', f(c.balance), 'b']] : [])]
  if (y + rows.length * 6 + 8 > 275) { doc.addPage(); y = 20 }
  rows.forEach((r) => {
    doc.setFont('helvetica', r[2] ? 'bold' : 'normal').setFontSize(r[2] ? 11 : 9).setTextColor(...(r[2] ? BLUE : INK))
    doc.text(r[0], W - M - 60, y); doc.text(r[1], W - M, y, { align: 'right' }); y += r[2] ? 7 : 5.5
  })
  const extras = [['Payment instructions', inv.payment], ['Notes', inv.notes]].filter((x) => x[1]?.trim())
  y += 4
  extras.forEach(([t, v]) => {
    const lines = doc.splitTextToSize(v, W - 2 * M)
    if (y + lines.length * 4.2 + 8 > 280) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK).text(t, M, y)
    doc.setFont('helvetica', 'normal').setTextColor(...MUTE).text(lines, M, y + 5); y += lines.length * 4.2 + 9
  })
  if (inv.thanks) { if (y > 275) { doc.addPage(); y = 20 } doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...BLUE).text(inv.thanks, M, y) }
  const n = doc.getNumberOfPages()
  for (let p = 1; p <= n; p++) {
    doc.setPage(p); doc.setDrawColor(226, 232, 240).setLineWidth(0.3).line(M, 284, W - M, 284)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTE)
    doc.text(`${biz.name || ''} · ${inv.number}`, M, 289); doc.text(`Page ${p} of ${n}`, W - M, 289, { align: 'right' })
  }
  doc.save(`${inv.number || 'invoice'}.pdf`)
}
