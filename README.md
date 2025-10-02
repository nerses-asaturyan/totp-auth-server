
# TOTP Authentication Server (POC)

This is a simple Proof-of-Concept **TOTP (Time-based One-Time Password)** authentication server built with **Node.js**, **Express**, **otplib**, and **qrcode**.  
It demonstrates how to generate secrets, register users with a QR code for Google Authenticator / Authy, and verify TOTP tokens.

---

## 📦 Setup

Clone/download this repo, then install dependencies:

```bash
npm install
````

Create a `.env` file in the project root:

```
NODE_ENV=development
PORT=3000
```

* `NODE_ENV=development` → shows the secret in API responses (for testing).
* `NODE_ENV=production` → hides the secret (safer).

---

## ▶️ Run the server

```bash
npm start
```

Expected output:

```
TOTP POC listening on port 3000
```

The server is now live at `http://localhost:3000`.

---

## 🧪 Testing

### 1. Register a user

Send a POST request to register a user (example with PowerShell):

```powershell
$body = @{ email = 'alice@example.com' } | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://localhost:3000/user/register' -Method Post -Body $body -ContentType 'application/json'
$response | ConvertTo-Json -Depth 6
```

Response includes:

* `email`
* `qrCodeUrl` (data URI with a base64-encoded PNG QR code)
* `secret` (only visible in development mode)

### 2. Save and open the QR code

Extract the QR code image and open it:

```powershell
$data = $response.qrCodeUrl -replace '^data:image\/png;base64,',''
[System.IO.File]::WriteAllBytes("qr.png", [System.Convert]::FromBase64String($data))
Start-Process "qr.png"
```

This creates and opens a file called `qr.png` in your current folder.
📱 Scan it with **Google Authenticator** or **Authy**.

### 3. Verify a TOTP code

Read the **6-digit code** from your authenticator app and verify it:

```powershell
$token = Read-Host 'Enter current TOTP code from your app'
$verifyBody = @{ email = 'alice@example.com'; token = $token } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/user/verify' -Method Post -Body $verifyBody -ContentType 'application/json'
```

✅ Example success:

```json
{ "verified": true }
```

❌ Example failure:

```json
{ "verified": false, "message": "Invalid token" }
```

### 4. Debug users (development only)

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/_debug/users'
```

Shows the stored secrets in memory.

---

## 🔧 Tips

* Codes expire every **30 seconds**. Always enter a fresh code.
* If verification fails, ensure your system clock is synced.
* Secrets are stored **in memory** — they reset if you restart the server.
* To test production mode, edit `.env`:

  ```
  NODE_ENV=production
  PORT=3000
  ```

  Restart and secrets will no longer be returned by `/user/register`.


