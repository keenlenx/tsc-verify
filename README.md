# Employee Verification

A single NestJS application serves the browser interface at `/` and verifies Kenyan National ID numbers against a CSV file. OCR runs locally in the browser with Tesseract.js; the server receives only the entered ID number.

## Run

Requires Node.js 18 or newer.

```bash
npm install
npm run start
```

Open the local URL printed at startup. The sample `.env.example` uses port `3000`; this machine's `.env` can choose a different port. The server listens on `0.0.0.0` by default and prints available network URLs. The app includes a PWA manifest, install prompt where supported, and a service worker that caches the app shell and provides an offline page. Employee verification still requires a network connection, and Bootstrap/Tesseract are loaded from jsDelivr.


The app loads settings from `.env` at startup. Copy `.env.example` to `.env` and adjust the values for this machine. `HOST` defaults to `0.0.0.0`; `PORT` defaults to `3000`.

PWA installation and live camera access from a phone require HTTPS with a certificate trusted by the phone and containing the PC's LAN IP in its subject alternative names. Set certificate paths in `.env`:

```dotenv
HOST=0.0.0.0
PORT=3000
TLS_CERT_PATH=C:/certs/employee-verification.crt
TLS_KEY_PATH=C:/certs/employee-verification.key
```

Leave both TLS values empty for HTTP. Trust the issuing CA on the phone, then restart the app, open the printed HTTPS LAN URL, and install from the browser prompt/menu. Plain HTTP on a LAN IP does not allow service-worker registration, PWA installation, or live camera access; use the image picker there.

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