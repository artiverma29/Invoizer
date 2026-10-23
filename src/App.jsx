import { useEffect, useState } from 'react'
import { FileText, Clock, Settings as Cog, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Editor from './components/Editor.jsx'
import Preview from './components/Preview.jsx'
import { History, Settings } from './components/Pages.jsx'
import { Btn } from './components/ui.jsx'
import { load, save, newInvoice, sampleInvoice, validate, buildPdf, calc, fmt } from './lib.js'

const DEF = {
  biz: { name: 'Acme Repairs', address: '12 MG Road, Ahmedabad, Gujarat 380001', phone: '+91 98765 43210', email: 'hello@acmerepairs.in', gstin: '', logo: '', logoAR: 1 },
  payment: 'UPI: acme@upi\nBank transfer: Acme Repairs, A/C 1234567890, IFSC HDFC0001234',
  notes: '', thanks: 'Thank you for your business!', currency: 'INR', counter: 1,
}

export default function App() {
  const [page, setPage] = useState('create')
  const [s, setS] = useState(() => ({ ...DEF, ...load('i30:settings', {}) }))
  const [hist, setHist] = useState(() => load('i30:history', []))
  const [inv, setInv] = useState(() => load('i30:draft', null) || sampleInvoice({ ...DEF, ...load('i30:settings', {}) }))
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => save('i30:settings', s), [s])
  useEffect(() => save('i30:history', hist), [hist])
  useEffect(() => save('i30:draft', inv), [inv])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t) } }, [toast])

  const errors = tried ? validate(inv, s.biz) : {}
  const c = calc(inv)

  const saveInv = (silent) => {
    const rec = { ...inv, biz: s.biz, savedAt: Date.now() }
    const exists = hist.some((x) => x.id === inv.id)
    setHist((h) => (exists ? h.map((x) => (x.id === inv.id ? rec : x)) : [rec, ...h].slice(0, 50)))
    if (!exists) setS((x) => ({ ...x, counter: x.counter + 1 }))
    if (!silent) setToast({ ok: true, msg: 'Invoice saved to history.' })
  }
  const download = () => {
    setTried(true)
    if (Object.keys(validate(inv, s.biz)).length) return setToast({ ok: false, msg: 'Please fix the highlighted fields first.' })
    setBusy(true)
    setTimeout(() => {
      try { buildPdf(inv, s.biz); saveInv(true); setToast({ ok: true, msg: `${inv.number}.pdf downloaded and saved to history.` }) }
      catch (e) { console.error(e); setToast({ ok: false, msg: 'Could not generate the PDF. Please try again.' }) }
      setBusy(false)
    }, 50)
  }
  const fresh = () => { setInv(newInvoice({ ...s })); setTried(false) }
  const nav = [['create', 'Create invoice', FileText], ['history', 'History', Clock], ['settings', 'Settings', Cog]]
  const DlBtn = ({ className = '' }) => <Btn primary icon={busy ? Loader2 : Download} disabled={busy} onClick={download} className={className}>{busy ? 'Generating…' : 'Download PDF'}</Btn>

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900"><span className="grid h-7 w-7 place-items-center rounded-md bg-blue-600 text-white"><FileText size={16} /></span>Invoizer</div>
          <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
            {nav.map(([k, l, I]) => (
              <button key={k} onClick={() => setPage(k)} className={'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium sm:flex-none ' + (page === k ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100')}><I size={16} />{l}</button>
            ))}
          </nav>
          {page === 'create' ? <DlBtn className="hidden lg:inline-flex" /> : <span />}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5">
        {page === 'create' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Editor inv={inv} setInv={setInv} biz={s.biz} setBiz={(b) => setS((x) => ({ ...x, biz: b }))} errors={errors}
              onNew={fresh} onSave={() => saveInv(false)}
              onSample={() => { setInv(sampleInvoice(s)); setTried(false) }}
              onClear={() => { if (confirm('Clear the form? Your business details are kept.')) { fresh() } }} />
            <div className="lg:sticky lg:top-20 lg:self-start">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">Live preview</h2>
              <Preview inv={inv} biz={s.biz} />
            </div>
          </div>
        )}
        {page === 'history' && <History hist={hist}
          onOpen={(h) => { const { biz, savedAt, ...rest } = h; setInv(rest); setS((x) => ({ ...x, biz })); setTried(false); setPage('create') }}
          onDownload={(h) => { try { buildPdf(h, h.biz); setToast({ ok: true, msg: `${h.number}.pdf downloaded.` }) } catch { setToast({ ok: false, msg: 'Could not generate the PDF.' }) } }}
          onDelete={(h) => { if (confirm(`Delete ${h.number}? This cannot be undone.`)) setHist((x) => x.filter((i) => i.id !== h.id)) }} />}
        {page === 'settings' && <Settings s={s} setS={setS} onWipe={() => { if (confirm('Delete all saved invoices and settings?')) { localStorage.clear(); location.reload() } }} />}
      </main>

      {page === 'create' && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div><div className="text-xs text-slate-500">{c.paid ? 'Balance due' : 'Total'}</div><div className="font-bold text-slate-900">{fmt(inv.currency, c.paid ? c.balance : c.total)}</div></div>
          <DlBtn />
        </div>
      )}

      {toast && (
        <div role="status" className={'fixed right-4 top-16 z-30 flex max-w-xs items-start gap-2 rounded-md border px-3 py-2 text-sm shadow-lg ' + (toast.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800')}>
          {toast.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}{toast.msg}
        </div>
      )}
    </div>
  )
}
