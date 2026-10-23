# Invoizer - Invoice in 30 Seconds

Create a professional invoice and download it as a real A4 PDF. No sign-up, no backend. Everything stays in your browser (LocalStorage).

## Run locally
```
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173).

## Build
```
npm run build
npm run preview
```

## Notes
- Business details, settings, the current draft and up to 50 saved invoices live in this browser only.
- In PDFs the rupee sign is printed as "Rs." because the built-in PDF fonts have no ₹ glyph.
