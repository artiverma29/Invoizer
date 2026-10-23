import { Download, Pencil, Trash2, FileText, Info } from 'lucide-react'
import { Card, Btn, Field, BusinessFields } from './ui.jsx'
import { calc, fmt, fmtDate, CURRENCIES } from '../lib.js'

export function History({ hist, onOpen, onDownload, onDelete }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="flex items-start gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800"><Info size={16} className="mt-0.5 shrink-0" />Invoices are stored in this browser only, not in a cloud account. Clearing your browser data will remove them.</p>
      {!hist.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white py-14 text-center">
          <FileText className="mx-auto text-slate-300" size={36} />
          <h2 className="mt-3 font-semibold text-slate-900">No invoices yet</h2>
          <p className="mt-1 text-sm text-slate-500">Download or save an invoice and it will appear here.</p>
        </div>
      ) : hist.map((h) => (
        <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <div className="font-semibold text-slate-900">{h.number} <span className="font-normal text-slate-500">· {h.customer.name || 'No customer'}</span></div>
            <div className="text-sm text-slate-500">{fmtDate(h.date)} · {fmt(h.currency, calc(h).total)}</div>
          </div>
          <div className="flex gap-2">
            <Btn icon={Pencil} onClick={() => onOpen(h)}>Edit</Btn>
            <Btn icon={Download} onClick={() => onDownload(h)}>PDF</Btn>
            <Btn icon={Trash2} className="text-red-600" onClick={() => onDelete(h)} aria-label="Delete invoice" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Settings({ s, setS, onWipe }) {
  const up = (k, v) => setS((x) => ({ ...x, [k]: v }))
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card title="Business details"><BusinessFields biz={s.biz} setBiz={(b) => up('biz', b)} /></Card>
      <Card title="Defaults for new invoices">
        <div className="grid gap-3">
          <label className="block"><span className="text-xs font-medium text-slate-600">Currency</span>
            <select value={s.currency} onChange={(e) => up('currency', e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{k} ({v.trim()})</option>)}
            </select></label>
          <Field label="Payment instructions" area value={s.payment} onChange={(e) => up('payment', e.target.value)} />
          <Field label="Notes" area value={s.notes} onChange={(e) => up('notes', e.target.value)} />
          <Field label="Thank-you message" value={s.thanks} onChange={(e) => up('thanks', e.target.value)} />
        </div>
      </Card>
      <Card title="Your data">
        <p className="mb-3 text-sm text-slate-500">Everything is stored in this browser. Nothing is sent to any server.</p>
        <Btn icon={Trash2} className="text-red-600" onClick={onWipe}>Delete all saved data</Btn>
      </Card>
    </div>
  )
}
