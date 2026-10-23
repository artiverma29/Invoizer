import { Upload, Trash2 } from 'lucide-react'

export const Field = ({ label, error, area, className = '', ...p }) => {
  const cls = 'mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 ' + (error ? 'border-red-400' : 'border-slate-300')
  return (
    <label className={'block ' + className}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {area ? <textarea rows={2} {...p} className={cls} /> : <input {...p} className={cls} />}
      {error && <span className="mt-0.5 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export const Card = ({ title, children, action }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-900">{title}</h2>{action}</div>
    {children}
  </section>
)

export const Btn = ({ primary, icon: I, children, className = '', ...p }) => (
  <button {...p} className={'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:opacity-60 ' + (primary ? 'bg-blue-600 text-white hover:bg-blue-700 ' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 ') + className}>
    {I && <I size={16} />}{children}
  </button>
)

export function BusinessFields({ biz, setBiz, errors = {} }) {
  const up = (k, v) => setBiz({ ...biz, [k]: v })
  const onLogo = (e) => {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader()
    r.onload = () => {
      const img = new Image()
      img.onload = () => {
        const k = Math.min(1, 240 / Math.max(img.width, img.height)), cv = document.createElement('canvas')
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k)
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
        setBiz({ ...biz, logo: cv.toDataURL('image/png'), logoAR: cv.height / cv.width })
      }
      img.src = r.result
    }
    r.readAsDataURL(file)
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Business name *" value={biz.name} error={errors.bizName} onChange={(e) => up('name', e.target.value)} />
      <Field label="GSTIN (optional)" value={biz.gstin} onChange={(e) => up('gstin', e.target.value.toUpperCase())} />
      <Field label="Address" area className="sm:col-span-2" value={biz.address} onChange={(e) => up('address', e.target.value)} />
      <Field label="Phone" value={biz.phone} onChange={(e) => up('phone', e.target.value)} />
      <Field label="Email" type="email" value={biz.email} onChange={(e) => up('email', e.target.value)} />
      <div className="flex items-center gap-3 sm:col-span-2">
        {biz.logo && <img src={biz.logo} alt="Logo" className="h-10 w-10 rounded border border-slate-200 object-contain" />}
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Upload size={16} />{biz.logo ? 'Change logo' : 'Upload logo (optional)'}
          <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
        </label>
        {biz.logo && <button className="text-slate-500 hover:text-red-600" aria-label="Remove logo" onClick={() => setBiz({ ...biz, logo: '' })}><Trash2 size={16} /></button>}
      </div>
    </div>
  )
}
