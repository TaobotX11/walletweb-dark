# Nusacoin Web Wallet v1.2.0

**Unofficial non-custodial (self-custody) web wallet for Nusacoin (NUX).**

Live at: [dompet.nusacoin.org](https://dompet.nusacoin.org)

---

## What is it?

Nusacoin Web Wallet is a browser-based, self-custody wallet that lets you create, manage, send, and receive NUX — all without trusting a third party with your private keys.

Your keys are generated and stored **only in your browser**, encrypted with your password using AES-256-GCM. The server never sees or stores any private keys, mnemonics, or passwords.

## Features

- **Create a new wallet** — generates a BIP39 12-word recovery phrase
- **Import an existing wallet** — restore from your 12-word recovery phrase
- **Wallet** — Provide Bech32 Address
- **Legacy** — Provide Legacy Address (deprecated: new users are directed to bech32; legacy balances should be emptied, and legacy support will be removed in a future version)
- **Send NUX** — build and sign transactions entirely in the browser
- **Receive NUX** — display your address with a QR code for easy sharing
- **Transaction history** — view your recent incoming and outgoing transactions
- **Address Book** — save labelled recipient addresses in this browser, and pick them from the send form; entries are never sent to a server
- **Incoming notice** — while the wallet tab is open, a banner appears when the total balance increases during a refresh; this is not a background push notification
- **Real-time balance** — fetched directly from the Nusacoin blockchain
- **Copy recovery phrase** — one-click copy for safe backup
- **Modern dark UI** — clean, responsive design inspired by MetaMask and Phantom

## Pending transactions

After a send is broadcast, the wallet records the transaction locally
(public data only: txid, spent outpoints, change output, raw hex).
Change from an unconfirmed transaction can be spent again, and inputs
already spent by a pending transaction stay locked until the pending
transaction confirms or disappears from the mempool. In addition,
unconfirmed outputs belonging to the wallet itself, derived from its
own mempool transactions, are spendable before confirmation. Balances
are shown as confirmed, pending, and available (confirmed spendable
plus own unconfirmed outputs, minus locked inputs). Unconfirmed
outputs from third parties are not spendable until confirmation.
This matters on chains with long block intervals, where change would
otherwise look missing for hours.

## Security

- **Non-custodial / Self-custody** — your private keys never leave your browser
- **AES-256-GCM encryption** — wallet data encrypted with your password (PBKDF2, 600,000 iterations)
- **BIP39 / BIP44 / BIP84 standard** — 12-word mnemonic, HD key derivation (`m/84'/662'/0'/0/0`)
- **No server-side accounts** — nothing to hack on the server
- **No tracking, no analytics** — your privacy is respected
- **Rate-limited API** — protection against abuse
- **HTTPS only** — all traffic encrypted in transit

> **Important:** This is a self-custody wallet. If you lose your 12-word recovery phrase and your password, **there is no way to recover your funds**. No one can help you — not even us. Always back up your recovery phrase in a safe place.

## How It Works

```
┌──────────────────────────┐          ┌──────────────────────────┐
│  Your Browser            │  HTTPS   │  Server                  │
│                          │◄────────►│                          │
│  - Generate keys (BIP39) │          │  API Proxy (read-only)   │
│  - Sign transactions     │          │  ├─ Balance              │
│  - Encrypt wallet (AES)  │          │  ├─ UTXOs                │
│  - Store in localStorage │          │  ├─ History              │
│                          │          │  └─ Broadcast signed TX  │
│  Keys NEVER leave here   │          │  No keys. No accounts.   │
└──────────────────────────┘          └──────────────────────────┘
```

There is no application backend. The static frontend talks to an
Esplora-compatible electrs service through the same-origin
`/electrs/` proxy in nginx, which provides:
- Balance lookups
- UTXO data for transaction building
- Transaction history
- Broadcasting of already-signed transactions
- Blockchain info

## Tech Stack

### Frontend
- React + TypeScript + Vite
- Tailwind CSS (dark mode)
- bitcoinjs-lib (transaction building & signing)
- bip39 / bip32 (key generation & derivation)
- Web Crypto API + AES-256-GCM (wallet encryption)
- qrcode.react (QR code generation)

### Data source
- Esplora-compatible electrs REST API, proxied same-origin at
  `/electrs/` by nginx (no application backend, no RPC credentials
  in the wallet deployment)

### Deployment
- Production build only: `npm run build` in `frontend/`, then serve
  `frontend/dist` with nginx (see `nginx/dompet.nusacoin.org.conf`).
  No Vite process and no application server run at runtime.
- Docker Compose (optional, static nginx only)
- Nginx with SSL (Let's Encrypt)

## Nusacoin Network Parameters

| Parameter | Value |
|-----------|-------|
| P2PKH prefix | `0x35` (addresses start with **N**) |
| P2SH prefix | `0x4b` (addresses start with **X**) |
| WIF prefix | `0x57` |
| bech32_hrp | `nu` |
| coin type | `662` |
| Derivation path BIP44 | `m/44'/662'/0'/0/0` |
| Derivation path BIP84 | `m/84'/662'/0'/0/0` |
| Smallest unit | 1 nusan = 0.00000001 NUX |
| P2P magic (message start) | `0x4e 0x55 0x53 0x41` (`NUSA`) |
| Proof of work | X11 |
| P2P port (mainnet) | `28573` |
| RPC port (mainnet) | `28832` |
| Signed message prefix | `\x17Nusacoin Signed Message:\n` |
| HD public version bytes | `0x0488B21E` |
| HD private version bytes | `0x0488ADE4` |
| Target block time | 6 minutes |
| Coinbase maturity | 10 blocks |
| Dust threshold (wallet) | 546 nusan |

## Self-Hosting

Self-hosting does not change the self-custody model: visitors' keys
are still generated, encrypted, and used for signing in their own
browsers. The host server never receives a mnemonic, a private key,
or a password, and wallet data stays in each visitor's browser
localStorage, which is scoped per origin. A visitor who moves to a
self-hosted copy must import the same recovery phrase again; wallet
data does not move with the static files.

### Prerequisites
- Node.js 20 or newer (tested with Node v24) and npm, for the build only
- Nginx
- An Esplora-compatible electrs REST service, either of these:
  - The public service used by the default config
    (`https://apinux.taobot.org`), or
  - A self-run electrs instance. Running electrs itself requires a
    Nusacoin full node; that setup is outside the scope of this guide.
- A domain name and Certbot, for HTTPS (Let's Encrypt)
- Docker and Docker Compose are not required. They are only an
  optional alternative for serving the static build with nginx.

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/TaobotX11/walletweb-dark.git
   cd walletweb-dark
   ```

2. Build the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```
   After install, confirm the dependency pin is honoured:
   ```bash
   npm ls @swc/core
   ```
   The output must show only `@swc/core@1.12.14` (reported as
   `overridden` for the top-level entry). If it shows 1.16 or newer,
   do not proceed to the build; the build fails with
   `[vite-plugin-top-level-await] missing field 'type'`. Do not run
   `npm audit fix` to work around it, as that can change the pinned
   versions.

3. Copy the build output to the nginx document root:
   ```bash
   cp -r frontend/dist/* /usr/share/nginx/html/
   ```
   The build output is a set of static files (`index.html` plus
   hashed assets under `assets/`). No Vite process and no
   application server run at runtime.

4. Install the nginx site config. Copy
   `nginx/dompet.nusacoin.org.conf` to
   `/etc/nginx/sites-available/` and symlink it into
   `/etc/nginx/sites-enabled/`, then replace every occurrence of
   `dompet.nusacoin.org` in that copy with the self-hosted domain.
   If a block for that domain already exists inside another file
   (for example, inside the default site file), remove the old block
   first; two blocks with the same `server_name` conflict.
   The config serves the static build with SPA routing
   (`try_files $uri $uri/ /index.html`), serves `index.html`
   without caching, caches hashed assets for 30 days, and proxies
   `/electrs/` to the electrs service.
   - To keep using the public electrs service, leave the
     `/electrs/` block unchanged.
   - To use a self-run electrs instance on the same machine,
     change the block to proxy directly to it, for example
     `proxy_pass http://127.0.0.1:3010/;` (note the trailing
     slash, which strips the `/electrs/` prefix), and set the
     `Host` header accordingly. Proxying directly to a local
     electrs instance avoids an extra round trip through a
     public proxy.

5. Configure SSL. The config in the repository has its
   `ssl_certificate` lines commented out, so do not enable the
   HTTPS block before a certificate exists. Obtain one first, for
   example:
   ```bash
   certbot --nginx -d <self-hosted domain>
   ```
   Certbot fills in the certificate paths and the HTTP-to-HTTPS
   redirect.

6. Test the config and reload nginx:
   ```bash
   nginx -t
   systemctl reload nginx
   ```
   Do not reload if `nginx -t` fails; restore the previous config
   from backup first.

### Verify the deployment

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<self-hosted domain>/
curl -s https://<self-hosted domain>/electrs/blocks/tip/height
```

The first command must return `200`, not `502`. The second must
return a block height number, not an HTML error page. If the first
returns `502`, the site block is still proxying to a dead process
(for example, a Vite dev server or an old backend) instead of
serving the static build. If the second returns `502` while the
public electrs service works, the `/electrs/` proxy target is
unreachable from the host; when electrs runs on the same machine,
point the proxy at the local electrs port as described in step 4.

### Troubleshooting

- `git pull` refuses with "local changes would be overwritten" for
  `frontend/package.json`: that file was changed locally by a
  previous install or fix. If the upstream change already contains
  the same fix, discarding only that file is safe:
  ```bash
  git checkout -- frontend/package.json
  git pull
  ```
  Do not discard other locally changed files without checking what
  they are (`git status --short`).
- A fresh build fails with `[vite-plugin-top-level-await] missing
  field 'type'`: the installed `@swc/core` version is too new.
  The repository pins it exactly to `1.12.14` with an `overrides`
  entry; re-run `npm install` and re-check `npm ls @swc/core`
  before rebuilding.
- The wallet shows a balance but a send fails with insufficient
  funds: check the separate Confirmed, Pending, and Available
  figures. Available counts confirmed spendable outputs plus own
  unconfirmed outputs, minus inputs locked by pending sends.
  Third-party incoming outputs do not count until confirmation.

## License

MIT

## Links

- **Website:** [nusacoin.org](https://nusacoin.org)
- **Explorer 1:** [explorer.nusacoin.org](https://explorer.nusacoin.org)
- **Explorer 2:** [explorer.taobot.org](https://explorer.taobot.org)
- **Explorer 3:** [book.taobot.org](https://book.taobot.org)
- **Wallet:** [dompet.nusacoin.org](https://dompet.nusacoin.org)
- **Wallet 2:** [wallet.nusacoin.org](https://wallet.nusacoin.org)
- **Wallet 3:** [paper.nusacoin.org](https://paper.nusacoin.org)
- **Wallet Tool:** [dompet.taobot.org](https://dompet.taobot.org)
- **GitHub:** [github.com/TaobotX11/walletweb-dark](https://github.com/TaobotX11/walletweb-dark)
