import { calc, fmt, fmtDate, num } from '../lib.js'

export default function Preview({ inv, biz }) {
  const c = calc(inv), f = (n) => fmt(inv.currency, n), cu = inv.customer
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-2 sm:p-4">
      <div className="mx-auto min-w-[560px] max-w-[720px] bg-white p-8 text-[13px] leading-relaxed text-slate-800 shadow-md">
        <div className="flex justify-between gap-6">
          <div className="flex gap-3">
            {biz.logo && <img src={biz.logo} alt="" className="h-14 w-14 object-contain" />}
            <div>
              <div className="text-lg font-bold text-slate-900">{biz.name || 'Your business'}</div>
              <div className="whitespace-pre-line text-slate-500">{biz.address}</div>
              <div className="text-slate-500">{[biz.phone, biz.email].filter(Boolean).join('  |  ')}</div>
              {biz.gstin && <div className="text-slate-500">GSTIN: {biz.gstin}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tracking-wide text-blue-600">INVOICE</div>
            <div className="mt-1 text-slate-500">No. <strong className="text-slate-900">{inv.number}</strong></div>
            <div className="text-slate-500">Issued {fmtDate(inv.date)}</div>
            {inv.due && <div className="text-slate-500">Due {fmtDate(inv.due)}</div>}
            {inv.terms && <div className="text-slate-500">{inv.terms}</div>}
          </div>
        </div>
        <hr className="my-4 border-t-2 border-blue-600" />
        <div className="text-xs font-semibold text-blue-600">Bill to</div>
        <div className="text-base font-bold text-slate-900">{cu.name || 'Customer name'}</div>
        <div className="whitespace-pre-line text-slate-500">{cu.address}</div>
        <div className="text-slate-500">{cu.contact}</div>
        {cu.gstin && <div className="text-slate-500">GSTIN: {cu.gstin}</div>}

        <table className="mt-5 w-full text-left">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="px-2 py-1.5">#</th><th className="px-2 py-1.5">Description</th><th className="px-2 py-1.5 text-right">Qty</th><th className="px-2 py-1.5 text-right">Rate</th>
              {c.disc > 0 && <th className="px-2 py-1.5 text-right">Disc</th>}{inv.gstOn && <th className="px-2 py-1.5 text-right">GST</th>}<th className="px-2 py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {c.lines.map((l, i) => (
              <tr key={l.id} className={i % 2 ? '' : 'bg-blue-50/50'}>
                <td className="px-2 py-1.5">{i + 1}</td><td className="break-words px-2 py-1.5">{l.desc}</td>
                <td className="px-2 py-1.5 text-right">{num(l.qty)}</td><td className="px-2 py-1.5 text-right">{f(num(l.price))}</td>
                {c.disc > 0 && <td className="px-2 py-1.5 text-right">{num(l.discount) ? num(l.discount) + '%' : '-'}</td>}
                {inv.gstOn && <td className="px-2 py-1.5 text-right">{num(l.tax)}%</td>}
                <td className="px-2 py-1.5 text-right font-medium">{f(l.total)}</td>
              </tr>
            ))}
            {!c.lines.length && <tr><td colSpan={7} className="px-2 py-4 text-center text-slate-400">Add an item to see it here</td></tr>}
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-64 space-y-1">
          <Row l="Subtotal" v={f(c.sub)} />
          {c.disc > 0 && <Row l="Discount" v={'-' + f(c.disc)} />}
          {inv.gstOn && <Row l="Tax (GST)" v={f(c.tax)} />}
          <Row l="Total" v={f(c.total)} bold />
          {c.paid > 0 && <><Row l="Amount paid" v={'-' + f(c.paid)} /><Row l="Balance due" v={f(c.balance)} bold /></>}
        </div>

        {[['Payment instructions', inv.payment], ['Notes', inv.notes]].map(([t, v]) => v?.trim() && (
          <div key={t} className="mt-4"><div className="font-semibold text-slate-900">{t}</div><div className="whitespace-pre-line text-slate-500">{v}</div></div>
        ))}
        {inv.thanks && <div className="mt-5 font-semibold text-blue-600">{inv.thanks}</div>}
      </div>
    </div>
  )
}
const Row = ({ l, v, bold }) => (
  <div className={'flex justify-between ' + (bold ? 'border-t border-slate-200 pt-1 text-sm font-bold text-blue-600' : 'text-slate-600')}><span>{l}</span><span>{v}</span></div>
)
