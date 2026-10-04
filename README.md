# Employee Verification

A single NestJS application serves the browser interface at `/` and verifies Kenyan National ID numbers against a CSV file. OCR runs locally in the browser with Tesseract.js; the server receives only the entered ID number.

## Run

Requires Node.js 18 or newer.

```bash
npm install
npm run start
```

Open [http://localhost:3000](http://localhost:3000/). The server listens on `0.0.0.0`, so it is also reachable from other devices on the host's network at `http://<host-ip>:3000/`. Camera access requires a secure context: use `localhost` or HTTPS and grant browser permission. Image upload works as a fallback. Bootstrap 5 and Tesseract.js are loaded from jsDelivr, so those browser features require an internet connection. After OCR recognizes one ID number, verification runs automatically; the button remains available for manual checks.

## Data and audit log

- Employee records: `data/employees.csv`
- Verification audit: `logs/verifications.csv` (created automatically)

The employee CSV is loaded into memory during startup and checked for file changes on each verification request. Add, edit, or remove rows in `data/employees.csv`; the next verification uses the updated records without restarting the app or reloading the browser page. Keep the same header columns. Audit entries contain a UTC timestamp, submitted ID number, and `VERIFIED` or `NOT VERIFIED` outcome.

## API

`POST /api/verify` accepts a JSON object with a 7- or 8-digit `idNumber`.

```json
{
  "idNumber": "12345678"
}
```

Known ID numbers return `{ "verified": true, "employee": { ... } }`; unknown numbers return `{ "verified": false }`. Invalid request bodies receive a validation error.