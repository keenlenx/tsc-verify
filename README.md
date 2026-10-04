# Employee Verification

A single NestJS application serves the browser interface at `/` and verifies Kenyan National ID numbers against a CSV file. OCR runs locally in the browser with Tesseract.js; the server receives only the entered ID number.

## Run

Requires Node.js 18 or newer.

```bash
npm install
npm run start
```

Open [http://localhost:3000](http://localhost:3000/). The server listens on `0.0.0.0` and prints available network URLs. The app includes a PWA manifest, install prompt where supported, and a service worker that caches the app shell and provides an offline page. Employee verification still requires a network connection, and Bootstrap/Tesseract are loaded from jsDelivr.

PWA installation and live camera access require a secure context. `localhost` is secure over HTTP; a phone using the PC's LAN IP needs HTTPS with a certificate trusted by the phone and containing the LAN IP in its subject alternative names. Configure certificate and key paths before starting:

```powershell
$env:TLS_CERT_PATH = "C:\certs\employee-verification.crt"
$env:TLS_KEY_PATH = "C:\certs\employee-verification.key"
npm run start
```

Trust the issuing CA on the phone, then open the printed HTTPS LAN URL and install from the browser prompt/menu. Plain HTTP on a LAN IP does not allow service-worker registration, PWA installation, or live camera access; use the image picker there.

## Data and audit log

- Employee records: `data/employees.csv`
- Verification audit: `logs/verifications.csv` (created automatically)

The employee CSV is loaded into memory during startup and checked for file changes on each verification request. Add, edit, or remove rows in `data/employees.csv`; the next verification uses the updated records without restarting the app or reloading the browser page. Keep the same header columns. Audit entries contain a timestamp in East Africa Time (EAT, UTC+3) formatted as `YYYY-MM-DD HH:mm:ss` in 24-hour time, the submitted ID number, and a `VERIFIED` or `NOT VERIFIED` outcome.

## API

`POST /api/verify` accepts a JSON object with a 7- or 8-digit `idNumber`.

```json
{
  "idNumber": "12345678"
}
```

Known ID numbers return `{ "verified": true, "employee": { ... } }`; unknown numbers return `{ "verified": false }`. Invalid request bodies receive a validation error.