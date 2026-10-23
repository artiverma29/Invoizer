import { Plus, Trash2, FilePlus, Eraser, Save, Sparkles } from 'lucide-react'
import { Field, Card, Btn, BusinessFields } from './ui.jsx'
import { CURRENCIES, GST, blankItem, calc, fmt } from '../lib.js'

export default function Editor({ inv, setInv, biz, setBiz, errors, onNew, onClear, onSample, onSave }) {
  const up = (k, v) => setInv((i) => ({ ...i, [k]: v }))
  const upC = (k, v) => setInv((i) => ({ ...i, customer: { ...i.customer, [k]: v } }))
  const upI = (id, k, v) => setInv((i) => ({ ...i, items: i.items.map((x) => (x.id === id ? { ...x, [k]: v } : x)) }))
  const nn = (v) => (String(v).startsWith('-') ? '' : v)
  const c = calc(inv)
  const lineTotal = (id) => c.lines.find((l) => l.id === id)?.total ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Btn icon={FilePlus} onClick={onNew}>New invoice</Btn>
        <Btn icon={Sparkles} onClick={onSample}>Load sample</Btn>
        <Btn icon={Save} onClick={onSave}>Save draft</Btn>
        <Btn icon={Eraser} onClick={onClear}>Clear form</Btn>
      </div>

      <Card title="Your business">
        <BusinessFields biz={biz} setBiz={setBiz} errors={errors} />
        <p className="mt-2 text-xs text-slate-500">Saved in this browser, so you only enter it once.</p>
      </Card>

      <Card title="Customer">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer or company name *" value={inv.customer.name} error={errors.custName} onChange={(e) => upC('name', e.target.value)} />
          <Field label="Phone or email" value={inv.customer.contact} onChange={(e) => upC('contact', e.target.value)} />
          <Field label="Billing address" area className="sm:col-span-2" value={inv.customer.address} onChange={(e) => upC('address', e.target.value)} />
          <Field label="Customer GSTIN (optional)" value={inv.customer.gstin} onChange={(e) => upC('gstin', e.target.value.toUpperCase())} />
        </div>
      </Card>

      <Card title="Invoice details">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Invoice number *" value={inv.number} error={errors.number} onChange={(e) => up('number', e.target.value)} />
          <Field label="Invoice date *" type="date" value={inv.date} error={errors.date} onChange={(e) => up('date', e.target.value)} />
          <Field label="Due date" type="date" value={inv.due} error={errors.due} onChange={(e) => up('due', e.target.value)} />
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Currency</span>
            <select value={inv.currency} onChange={(e) => up('currency', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{k} ({v.trim()})</option>)}
            </select>
          </label>
          <Field label="Payment terms" placeholder="e.g. Due on receipt" className="sm:col-span-2" value={inv.terms} onChange={(e) => up('terms', e.target.value)} />
        </div>
      </Card>

      <Card title="Items" action={
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
          <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={inv.gstOn} onChange={(e) => up('gstOn', e.target.checked)} /> Apply GST
        </label>}>
        {errors.items && <p className="mb-2 text-xs text-red-600">{errors.items}</p>}
        <div className="space-y-3">
          {inv.items.map((it) => (
            <div key={it.id} className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
              <Field label="Item or service" value={it.desc} onChange={(e) => upI(it.id, 'desc', e.target.value)} />
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Field label="Qty" type="number" min="0" step="any" value={it.qty} onChange={(e) => upI(it.id, 'qty', nn(e.target.value))} />
                <Field label="Unit price" type="number" min="0" step="any" value={it.price} onChange={(e) => upI(it.id, 'price', nn(e.target.value))} />
                <Field label="Discount %" type="number" min="0" max="100" step="any" value={it.discount} onChange={(e) => upI(it.id, 'discount', nn(e.target.value))} />
                {inv.gstOn && (
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">GST rate</span>
                    <select value={it.tax} onChange={(e) => upI(it.id, 'tax', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                      {GST.map((r) => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </label>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">Line total <strong className="ml-1 text-slate-900">{fmt(inv.currency, lineTotal(it.id))}</strong></span>
                <button aria-label="Remove item" disabled={inv.items.length === 1} onClick={() => setInv((i) => ({ ...i, items: i.items.filter((x) => x.id !== it.id) }))} className="text-slate-400 hover:text-red-600 disabled:opacity-30"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        <Btn icon={Plus} className="mt-3" onClick={() => setInv((i) => ({ ...i, items: [...i.items, blankItem()] }))}>Add item</Btn>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Amount paid (optional)" type="number" min="0" step="any" value={inv.paid} onChange={(e) => up('paid', nn(e.target.value))} />
        </div>
      </Card>

      <Card title="Notes and payment">
        <div className="grid gap-3">
          <Field label="Payment instructions" area value={inv.payment} onChange={(e) => up('payment', e.target.value)} />
          <Field label="Notes" area value={inv.notes} onChange={(e) => up('notes', e.target.value)} />
          <Field label="Thank-you message" value={inv.thanks} onChange={(e) => up('thanks', e.target.value)} />
        </div>
      </Card>
    </div>
  )
}
