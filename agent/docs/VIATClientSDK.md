# VIAT Client SDK

The VIAT Client SDK is the browser-side library that lets `centralSite` (and any other UW client) talk to the VIAT ⟁ post-quantum L1 chain. It owns wallet generation, signing, address derivation, encrypted wallet persistence, and the HTTP API client to the central node.

It ships as a **single bundled ES module** (`viat-client-sdk-bundle.js`) that resolves to the `viat` bare specifier in the importmap.

---

## File layout (paths from project root)

All SDK source lives in:

```
viat/centralSite/client/viatsdk/
```

| File | Role |
| --- | --- |
| [viatClient.js](viat/centralSite/client/viatsdk/viatClient.js) | Class entry point. Defines `VIATClientSDK`, the `create()` factory, `STATE` bag, key generation (`keypair`, `trapdoorKeypair`), wallet generation (`generateSiteWallet`), and signing primitives. Mixes in `webAPI` and `walletPersistence`. |
| [walletPersistence.js](viat/centralSite/client/viatsdk/walletPersistence.js) | Encrypted wallet save/load. Argon2id KDF, XChaCha20-Poly1305 AEAD, CBOR inner encoding, profile metadata via `meta.extra`. Exports `createWalletPackage`, `serializeWalletPackage`, `applyWalletSecret`, `getWalletMeta`. |
| [webAPI.js](viat/centralSite/client/viatsdk/webAPI.js) | HTTP transport for the central node REST surface (`/api/...`). Handles CBOR/JSON content negotiation, accounts, transactions, mint, health. |
| [generateAddress.js](viat/centralSite/client/viatsdk/generateAddress.js) | `generateLegacyAddress(publicKey, trapdoor)` → `shake256` of the concatenation, sized via `VIAT_DEFAULTS.WALLETS.LEGACY.WALLET_SIZE`. |
| [cbor.js](viat/centralSite/client/viatsdk/cbor.js) | Thin re-export of the project's `#utilities/serialize` strict CBOR codec. |
| [utils.js](viat/centralSite/client/viatsdk/utils.js) | Byte helpers — `toUint8Array`, `toBase64`, `fromBase64`, `textToBuffer`, etc. |
| [example.js](viat/centralSite/client/viatsdk/example.js) | Hand-runnable demo of the SDK against `http://localhost:3000/api`. |
| [viat-client-sdk-bundle.js](viat/centralSite/client/viatsdk/viat-client-sdk-bundle.js) | **Generated.** Rollup output of `viatClient.js`. Do not edit by hand. |
| [viat-client-sdk-bundle.js.map](viat/centralSite/client/viatsdk/viat-client-sdk-bundle.js.map) | **Generated.** Source map for the bundle. |

The bundle is also written to a second location so the in-browser importmap can load it without a path walk out of `client/new/`:

```
viat/centralSite/client/new/scripts/viat-client-sdk-bundle.js
viat/centralSite/client/new/scripts/viat-client-sdk-bundle.js.map
```

Rollup config:

```
viat/centralSite/rollup.config.js
```

---

## Build process

Build script (defined in the root [package.json](package.json) under `scripts`):

```
pnpm run build:clientSite
```

That runs:

```
pnpm exec rollup -c ./viat/centralSite/rollup.config.js
```

The config has a single `input` (`viatClient.js`) and two `output` targets so both consumers stay in sync — the `viatsdk/` source folder (for reference and for the example script) and the `new/scripts/` folder (what the live client actually loads). Both outputs use:

- `format: 'es'` — native ES module
- `sourcemap: true`
- `banner: '/* VIAT Client SDK - bundled (Rollup) */'`

Plugins:

- `@rollup/plugin-replace` — pins `process.env.NODE_ENV` to `'production'`
- `@rollup/plugin-node-resolve` — browser-conditioned resolution across `.js/.mjs/.cjs/.json`, prefers `browser` and `default` export conditions
- `@rollup/plugin-inject` — auto-injects `Buffer` from the `buffer` package wherever it's referenced
- `@rollup/plugin-commonjs` — bridges CommonJS deps in `node_modules` (with `transformMixedEsModules: true`)

`external: ['@universalweb/utilitylib']` — the utility lib is **not** bundled in. It's served separately from `client/new/scripts/utilityLibrary/` and mapped via the importmap.

---

## How the client loads it

The `centralSite` HTML entry (e.g. [client/new/index.html](viat/centralSite/client/new/index.html)) declares the importmap **before** any module script:

```html
<script type="importmap">
  {
    "imports": {
      "@universalweb/utilitylib": "./scripts/utilityLibrary/index.js",
      "viat": "./scripts/viat-client-sdk-bundle.js",
      "webcomponent": "./components/core/index.js"
    }
  }
</script>
```

Consumers then import the SDK with a bare specifier — no relative path:

```js
import { VIATClientSDK } from 'viat';

const sdk = await VIATClientSDK.create();
await sdk.generateSiteWallet({ label: 'main', meta: profileMeta });
```

The live consumer is [client/new/modules/app.js](viat/centralSite/client/new/modules/app.js), which keeps a single SDK instance on the `AppView` component (`this.sdk`). The SDK carries private state (seeds, keypairs) and never lands in `globalState`; only the public projection (address, public keys, trapdoor hash, label, params summary) is mirrored to `globalState.wallet` / `globalState.walletParams`.

---

## State model

`VIATClientSDK` keeps everything on its own `STATE` bag, not on `this` directly:

```js
sdk.STATE = {
  hdWalletInstance, // HDSeed instance
  walletSeeds: { seed, trapdoorSeed, trapdoor },
  primaryKeypair: { privateKey, publicKey },     // ed25519
  trapdoorKeypair: { privateKey, publicKey },    // ML-DSA-44
  trapdoorHash,                                  // shake256(trapdoor.publicKey)
  walletSaveMeta,                                // last serialized meta { label, address, createdAt, extra, cipher, … }
};
```

`sdk.set(key, value)` writes to `STATE[key]` and conditionally to `this[key]` — but it walks the prototype chain first and skips assignment if a method of the same name exists. Without that guard, calling `setKeypairs()` twice on the same instance would overwrite the `primaryKeypair` / `trapdoorKeypair` method references with plain objects, and the second call would throw `"is not a function"`.

The recommended pattern in `app.js` is **fresh instance per create/load** via `freshSDK()`, with a stable instance via `ensureSDK()` only for in-place save operations.

---

## Wallet lifecycle

| Phase | SDK call | Notes |
| --- | --- | --- |
| Create | `sdk.generateSiteWallet({ label, meta })` | Creates HD wallet, derives both keypairs, computes trapdoor hash. No password required. |
| Save | `sdk.createWalletPackage(password, { label, meta })` → `sdk.serializeWalletPackage(pkg, 'cbor')` | Returns a serialized `Uint8Array`; base64-encode for storage. Empty password → unencrypted payload. |
| Load | `sdk.applyWalletSecret(payload, password, { meta })` | Auto-detects JSON vs CBOR. Rehydrates `STATE.walletSeeds`, regenerates keypairs, restores `walletSaveMeta`. |

Profile metadata (display name, avatar, etc.) is embedded in the encrypted package via `meta.extra`, so a single save/load round-trip carries profile state alongside the keys.

---

## Crypto stack

```
password ──argon2id──► 32-byte key ──XChaCha20-Poly1305──► ciphertext + tag
                                          │
                                          ├── nonce: 24 random bytes (no IV bookkeeping)
                                          └── aad: canonical meta bytes (AEAD-bound)
```

- **KDF:** `argon2id` from `hash-wasm` — defaults: parallelism 1, iterations 256, memorySize 512 KiB, hashLength 32, saltLength 32. Tunable per save via `meta.kdf`.
- **Cipher:** `xchacha20poly1305` from `@noble/ciphers/chacha.js` — 256-bit key, 192-bit nonce, no separate IV field on the wire. Wide software support, runs identically in any JS env.
- **Inner encoding:** CBOR (`@universalweb/utilitylib` strict codec), so binary fields round-trip without base64 inflation inside the encrypted blob.
- **Outer encoding:** the persisted package is base64-encoded CBOR (`viat.wallet:{profile}` keys in localStorage) or JSON when explicitly exported as `.json`.

`meta.cipher` on every saved package records `{ algorithm: 'XChaCha20-Poly1305', nonceLength: 24, innerEncoding: 'cbor' }` so future readers can branch on the algorithm even if the default changes.

---

## Editing & rebuilding

When you change anything under `viat/centralSite/client/viatsdk/`:

1. Edit the source file.
2. Run `pnpm run build:clientSite` from the repo root.
3. Reload the page — the importmap pulls the fresh bundle from `new/scripts/`.

Never hand-edit `viat-client-sdk-bundle.js` — it's overwritten on every build. The source map covers both output copies, so stack traces and breakpoints map straight back to the source files in `viatsdk/`.
