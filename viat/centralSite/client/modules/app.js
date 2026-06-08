import '../components/user/dashboard/dashboard.js';
import '../components/user/mobile-dashboard/mobile-dashboard.js';
import '../components/user/global-bottom-bar/global-bottom-bar.js';
import '../components/user/global-dock/global-dock.js';
import '../components/user/global-pulldown/global-pulldown.js';
import '../components/user/global-sidebar/global-sidebar.js';
import '../components/user/global-top-bar/global-top-bar.js';
import '../components/user/settings-modal/settings-modal.js';
import '../components/user/sign-data-modal/sign-data-modal.js';
import '../components/user/wallet-info-modal/wallet-info-modal.js';
import '../components/user/wallet-unlock-modal/wallet-unlock-modal.js';
import '../components/user/welcome-back-modal/welcome-back-modal.js';
import '../components/user/send-confirm-modal/send-confirm-modal.js';
import '../components/user/swap-page/swap-page.js';
import '../components/user/explorer-page/explorer-page.js';
import '../components/user/accounts-list-page/accounts-list-page.js';
import '../components/user/account-detail-page/account-detail-page.js';
import '../components/user/transaction-detail-page/transaction-detail-page.js';
import '../components/user/wallet-onboarding/wallet-onboarding.js';
import './tools.js';
import '../components/core/tooltips/tooltip.js';
import VIATClientSDK, * as viatSDK from 'viat';
import { WebComponent, globalState } from 'webcomponent';
import { getTheme, setTheme } from '../components/global/theme-select/theme-manager.js';
import { UINotification } from '../components/global/notification/notification.js';
import { URLRouter } from './urlRouter.js';
const ROUTER_CONFIG = {
	root: '/',
	routes: [
		// `section` controls which dock button stays lit; `view` controls which
		// page component is unhidden via the `is-page-${view}` body class. They
		// diverge for detail pages — /tx/:id/ keeps the explorer dock active
		// while showing the transaction-detail view.
		{
			id: 'wallet',
			path: '/',
			section: 'wallet',
			view: 'wallet',
		},
		{
			id: 'swap',
			path: '/swap/',
			section: 'swap',
			view: 'swap',
		},
		// Explorer — `all` and `mint` variants, each with an optional `/page/:page/`
		// tail. Routes are matched in order; literal segments win over `:page`
		// captures, so `/explorer/mints/` resolves to the `mint` route before
		// the page form ever runs.
		{
			id: 'explorer',
			path: '/explorer/',
			section: 'explorer',
			view: 'explorer',
			filter: 'all',
		},
		{
			id: 'explorerPage',
			path: '/explorer/page/:page/',
			section: 'explorer',
			view: 'explorer',
			filter: 'all',
		},
		{
			id: 'explorerMints',
			path: '/explorer/mints/',
			section: 'explorer',
			view: 'explorer',
			filter: 'mint',
		},
		{
			id: 'explorerMintsPage',
			path: '/explorer/mints/page/:page/',
			section: 'explorer',
			view: 'explorer',
			filter: 'mint',
		},
		{
			id: 'explorerTransfers',
			path: '/explorer/transfers/',
			section: 'explorer',
			view: 'explorer',
			filter: 'transfer',
		},
		{
			id: 'explorerTransfersPage',
			path: '/explorer/transfers/page/:page/',
			section: 'explorer',
			view: 'explorer',
			filter: 'transfer',
		},
		{
			id: 'accounts',
			path: '/accounts/',
			section: 'accounts',
			view: 'accounts',
		},
		{
			id: 'accountsPage',
			path: '/accounts/page/:page/',
			section: 'accounts',
			view: 'accounts',
		},
		// Detail pages intentionally omit `section` — dock self-sync (see
		// global-dock.js / observeGlobal('routeId')) leaves all dock buttons
		// inactive when the current route has no section, which is exactly
		// what we want on a deep-linked detail view.
		{
			id: 'transaction',
			path: '/tx/:id/',
			view: 'transaction',
		},
		{
			id: 'account',
			path: '/account/:address/',
			view: 'account',
		},
		{
			id: 'accountPage',
			path: '/account/:address/page/:page/',
			view: 'account',
		},
	],
};
// Dock ids that should change the URL on click. Routes with parameters
// (transaction, account) aren't dock-launched — they're reached via links.
const DOCK_ROUTE_IDS = new Set([
	'wallet', 'swap', 'explorer', 'accounts',
]);
/*
	VIAT Client SDK is a high-level interface for interacting with the VIAT cryptocurrency API. It manages wallet creation, transaction signing, and communication with the VIAT network. The SDK abstracts away low-level details of key management and API calls, providing a user-friendly API for developers building on top of VIAT.
*/
console.log(VIATClientSDK, viatSDK);
function bytesToBase64(bytes) {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let binary = '';
	for (let index = 0; index < view.length; index += 1) {
		binary += String.fromCharCode(view[index]);
	}
	return globalThis.btoa(binary);
}
function base64ToBytes(text) {
	const cleaned = (text || '').trim().replace(/\s+/g, '');
	if (!cleaned) {
		throw new Error('Provide a base64-encoded wallet string');
	}
	const binary = globalThis.atob(cleaned);
	const view = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		view[index] = binary.charCodeAt(index);
	}
	return view;
}
function toUrlSafeBase64(source) {
	if (!source) {
		return '';
	}
	return `${source}`.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '');
}
function toPublicHex(source) {
	if (!source) {
		return '';
	}
	const view = source instanceof Uint8Array ? source : new Uint8Array(source);
	let out = '';
	for (let index = 0; index < view.length; index += 1) {
		out += view[index].toString(16).padStart(2, '0');
	}
	return out;
}
// Convert a recipient address from whichever format the user typed (or the
// dropdown selected) into the standard base64 string the SDK wants. Throws
// on unrecoverable input so the caller can surface a clear notification.
function recipientToBase64(value, format) {
	const trimmed = String(value ?? '').trim();
	if (!trimmed) {
		return '';
	}
	if (format === 'base64') {
		return trimmed;
	}
	if (format === 'base64url') {
		let standard = trimmed.replace(/-/g, '+').replace(/_/g, '/');
		const remainder = standard.length % 4;
		if (remainder !== 0) {
			standard += '='.repeat(4 - remainder);
		}
		return standard;
	}
	if (format === 'hex') {
		const cleaned = trimmed.replace(/\s+/g, '');
		if (!(/^[0-9a-fA-F]+$/).test(cleaned)) {
			throw new Error('contains non-hex characters');
		}
		if (cleaned.length % 2 !== 0) {
			throw new Error('odd number of hex digits');
		}
		const bytes = new Uint8Array(cleaned.length / 2);
		for (let index = 0; index < bytes.length; index += 1) {
			const offset = index * 2;
			bytes[index] = parseInt(cleaned.slice(offset, offset + 2), 16);
		}
		let binary = '';
		for (let index = 0; index < bytes.length; index += 1) {
			binary += String.fromCharCode(bytes[index]);
		}
		return globalThis.btoa(binary);
	}
	return trimmed;
}
function formatBalanceShort(rawValue) {
	if (rawValue == null) {
		return '0';
	}
	const asNumber = Number(rawValue);
	if (Number.isFinite(asNumber)) {
		return asNumber.toLocaleString('en-US');
	}
	return `${rawValue}`;
}
function formatBytes(byteCount) {
	if (!byteCount) {
		return '0B';
	}
	if (byteCount < 1024) {
		return `${byteCount}B`;
	}
	return `${(byteCount / 1024).toFixed(1)}KB`;
}
function byteLength(source) {
	if (!source) {
		return 0;
	}
	if (typeof source.byteLength === 'number') {
		return source.byteLength;
	}
	if (typeof source.length === 'number') {
		return source.length;
	}
	return 0;
}
function bytesRow(key, label, size, className) {
	const item = {
		key,
		label,
		value: formatBytes(size),
		copyValue: `${size} Bytes`,
	};
	if (className) {
		item.className = className;
	}
	return item;
}
function shortenString(value, head = 8, tail = 6) {
	const str = String(value ?? '');
	if (!str || str.length <= head + tail + 1) {
		return str || '—';
	}
	return `${str.slice(0, head)}…${str.slice(-tail)}`;
}
function metaRow(key, label, raw, options = {}) {
	if (!raw) {
		return null;
	}
	const value = shortenString(raw, options.head ?? 8, options.tail ?? 6);
	return {
		key,
		label,
		value,
		copyValue: raw,
		className: options.className,
	};
}
function pad2(value) {
	return String(value).padStart(2, '0');
}
function formatStamp(date) {
	// Compact, sortable, mono-friendly — fits the narrow params value cell
	// without wrapping; the full ISO string still goes to copyValue for
	// anyone who needs the unmangled timestamp.
	const year = date.getFullYear();
	const month = pad2(date.getMonth() + 1);
	const day = pad2(date.getDate());
	const hours = pad2(date.getHours());
	const minutes = pad2(date.getMinutes());
	return `${year}-${month}-${day} ${hours}:${minutes}`;
}
function timestampRow(key, label, iso) {
	if (!iso) {
		return null;
	}
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return {
		key,
		label,
		value: formatStamp(date),
		copyValue: iso,
	};
}
function plainRow(key, label, value, options = {}) {
	if (value === null || value === undefined || value === '') {
		return null;
	}
	return {
		key,
		label,
		value: String(value),
		copyValue: options.copyValue ?? String(value),
		className: options.className,
	};
}
function bytesRowIfPresent(key, label, size, className) {
	if (!size) {
		return null;
	}
	return bytesRow(key, label, size, className);
}
// Build the wallet-params rows from a deserialized package's meta only —
// no SDK / no private key required. Used when we auto-load a locked
// profile's metadata at boot, so the params panel still shows the wallet
// label, address, public key and KDF settings before the user unlocks.
// The byte-size rows (seed / priv key) deliberately stay out — those need
// the decrypted secret to measure.
function buildWalletParamsFromMeta(meta = {}, extras = {}) {
	const password = meta.password ?? {};
	const cipher = meta.cipher ?? {};
	const rows = [
		plainRow('Scheme', 'Signature Scheme', 'ed25519'),
		plainRow('Version', 'Wallet Version', meta.version ? `v${meta.version}` : 'v1'),
		plainRow('Kind', 'Wallet Kind', meta.walletType || meta.kind),
		plainRow('Seed Count', 'Seed Count', '1'),
		plainRow('HD Version', 'HD Wallet Version', 'v1'),
		plainRow('Trapdoor', 'Trapdoor Scheme', 'ML-DSA-44', {
			className: 'pq',
		}),
		plainRow('Addr Size', 'Address Size', '24B', {
			copyValue: '24 Bytes',
		}),
		metaRow('Label', 'Wallet Label', meta.label, {
			head: 10,
			tail: 4,
		}),
		metaRow('Address', 'Wallet Address', meta.address),
		metaRow('Pub Key', 'Primary Public Key', meta.publicKey),
		metaRow('Trap Hash', 'Trapdoor Hash', meta.trapdoorHash, {
			className: 'pq',
		}),
		timestampRow('Created', 'Created At', extras.createdAt || meta.createdAt),
		timestampRow('Last Used', 'Last Used At', extras.lastUsedAt),
		plainRow('KDF', 'Password Hash Mode', password.hashMode),
		plainRow('KDF Iter', 'KDF Iterations', password.iterations),
		plainRow('KDF Mem', 'KDF Memory (KiB)', password.memorySize),
		plainRow('Cipher', 'Encryption Cipher', cipher.algorithm),
	];
	return rows.filter((row) => {
		return row != null;
	});
}
function buildWalletParams(sdk, extras = {}) {
	if (!sdk?.STATE?.walletSeeds?.seed) {
		return [];
	}
	const seedSize = byteLength(sdk.STATE.walletSeeds.seed);
	const trapdoorSeedSize = byteLength(sdk.STATE.walletSeeds.trapdoorSeed);
	const primaryPub = byteLength(sdk.STATE.primaryKeypair?.publicKey);
	const primaryPriv = byteLength(sdk.STATE.primaryKeypair?.privateKey);
	const trapdoorPub = byteLength(sdk.STATE.trapdoorKeypair?.publicKey);
	const trapdoorPriv = byteLength(sdk.STATE.trapdoorKeypair?.privateKey);
	const trapdoorHashSize = byteLength(sdk.STATE.trapdoorHash);
	const meta = sdk.STATE.walletSaveMeta ?? {};
	const password = meta.password ?? {};
	const cipher = meta.cipher ?? {};
	const rows = [
		plainRow('Scheme', 'Signature Scheme', 'ed25519'),
		plainRow('Version', 'Wallet Version', meta.version ? `v${meta.version}` : 'v1'),
		plainRow('Kind', 'Wallet Kind', meta.walletType || meta.kind),
		plainRow('Seed Count', 'Seed Count', '1'),
		plainRow('HD Version', 'HD Wallet Version', 'v1'),
		plainRow('Trapdoor', 'Trapdoor Scheme', 'ML-DSA-44', {
			className: 'pq',
		}),
		plainRow('Addr Size', 'Address Size', '24B', {
			copyValue: '24 Bytes',
		}),
		metaRow('Label', 'Wallet Label', extras.label, {
			head: 10,
			tail: 4,
		}),
		metaRow('Address', 'Wallet Address', extras.address),
		metaRow('Pub Key', 'Primary Public Key (hex)', extras.publicKey),
		metaRow('Trap Hash', 'Trapdoor Hash (hex)', extras.trapdoorHash, {
			className: 'pq',
		}),
		timestampRow('Created', 'Created At', extras.createdAt),
		timestampRow('Last Used', 'Last Used At', extras.lastUsedAt),
		plainRow('KDF', 'Password Hash Mode', password.hashMode),
		plainRow('KDF Iter', 'KDF Iterations', password.iterations),
		plainRow('KDF Mem', 'KDF Memory (KiB)', password.memorySize),
		plainRow('Cipher', 'Encryption Cipher', cipher.algorithm),
		bytesRowIfPresent('Seed Size', 'Seed Size', seedSize),
		bytesRowIfPresent('Trap Seed', 'Trapdoor Seed Size', trapdoorSeedSize),
		bytesRowIfPresent('Trap Hash Sz', 'Trapdoor Hash Size', trapdoorHashSize),
		bytesRowIfPresent('Pub Key Sz', 'Public Key Size', primaryPub),
		bytesRowIfPresent('Priv Key Sz', 'Private Key Size', primaryPriv),
		bytesRowIfPresent('Trap Pub Sz', 'Trapdoor Public Key Size', trapdoorPub, 'pq'),
		bytesRowIfPresent('Trap Priv Sz', 'Trapdoor Private Key Size', trapdoorPriv, 'pq'),
	];
	return rows.filter((row) => {
		return row != null;
	});
}
const WALLET_KEY_PREFIX = 'viat.wallet:';
const PROFILE_INDEX_KEY = 'viat.profileIndex';
function profileNameToKey(profileName) {
	const safe = `${profileName ?? ''}`.trim() || 'wallet';
	return `${WALLET_KEY_PREFIX}${safe}`;
}
function isJsonString(text) {
	return `${text ?? ''}`.trim().startsWith('{');
}
function listSavedProfiles() {
	if (!globalThis.localStorage) {
		return [];
	}
	const result = [];
	for (let index = 0; index < globalThis.localStorage.length; index += 1) {
		const key = globalThis.localStorage.key(index);
		if (key?.startsWith(WALLET_KEY_PREFIX)) {
			result.push(key.slice(WALLET_KEY_PREFIX.length));
		}
	}
	return result.sort();
}
function loadProfileIndex() {
	if (!globalThis.localStorage) {
		return {};
	}
	const raw = globalThis.localStorage.getItem(PROFILE_INDEX_KEY);
	if (!raw) {
		return {};
	}
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}
function saveProfileIndex(nextIndex) {
	if (!globalThis.localStorage) {
		return;
	}
	try {
		globalThis.localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(nextIndex));
	} catch {
		// quota or disabled storage — non-fatal
	}
}
function markProfileUsed(profileName, extra = {}) {
	if (!profileName) {
		return;
	}
	const indexData = loadProfileIndex();
	const existing = indexData[profileName] ?? {};
	const now = new Date().toISOString();
	indexData[profileName] = {
		...existing,
		...extra,
		createdAt: existing.createdAt ?? extra.createdAt ?? now,
		lastUsedAt: now,
	};
	saveProfileIndex(indexData);
}
function getProfileStats(profileName) {
	if (!profileName) {
		return {};
	}
	return loadProfileIndex()[profileName] ?? {};
}
function forgetProfileFromIndex(profileName) {
	if (!profileName) {
		return;
	}
	const indexData = loadProfileIndex();
	if (indexData[profileName]) {
		delete indexData[profileName];
		saveProfileIndex(indexData);
	}
}
// Peek at a saved wallet payload's plaintext `meta.createdAt` without
// decrypting. Used as the final ranking fallback when the profile index is
// missing or corrupt — that way the most-recent boot scan still works even
// after the index entry was wiped (e.g. clearStorage with a manual wallet
// re-save).
function readPackageCreatedAt(profileName) {
	if (!profileName || !globalThis.localStorage) {
		return '';
	}
	const raw = globalThis.localStorage.getItem(profileNameToKey(profileName));
	if (!raw) {
		return '';
	}
	if (isJsonString(raw)) {
		try {
			const parsed = JSON.parse(raw);
			return parsed?.meta?.createdAt || '';
		} catch {
			return '';
		}
	}
	// CBOR payloads need the SDK to decode — skip the heavy path here.
	// The index entry will be written on first successful load anyway.
	return '';
}
function mostRecentProfile() {
	const profiles = listSavedProfiles();
	if (!profiles.length) {
		return null;
	}
	const indexData = loadProfileIndex();
	let bestName = profiles[0];
	let bestTime = -1;
	for (let index = 0; index < profiles.length; index += 1) {
		const profileName = profiles[index];
		const entry = indexData[profileName];
		// Prefer lastUsedAt; fall back to createdAt so a profile that was
		// saved before lastUsedAt existed still ranks by its only timestamp;
		// final fallback peeks at the plaintext meta in the saved package
		// itself so we can still rank when the index is missing entirely.
		const stamp = entry?.lastUsedAt || entry?.createdAt || readPackageCreatedAt(profileName);
		const ts = Date.parse(stamp);
		const value = Number.isFinite(ts) ? ts : 0;
		if (value > bestTime) {
			bestTime = value;
			bestName = profileName;
		}
	}
	return bestName;
}
// One-shot migration: for every saved profile in localStorage make sure
// the index has both a createdAt and a lastUsedAt. Legacy profiles often
// have only createdAt (or nothing at all if the index entry was lost);
// without lastUsedAt the "most recent" scan can't compare them. Backfill
// is conservative — never overwrites an existing lastUsedAt, only fills
// the missing fields.
function backfillProfileIndex() {
	const profiles = listSavedProfiles();
	if (!profiles.length) {
		return;
	}
	const indexData = loadProfileIndex();
	const now = new Date().toISOString();
	let mutated = false;
	for (let index = 0; index < profiles.length; index += 1) {
		const profileName = profiles[index];
		const existing = indexData[profileName] ?? {};
		const createdAt = existing.createdAt || now;
		const lastUsedAt = existing.lastUsedAt || existing.createdAt || now;
		if (existing.createdAt === createdAt && existing.lastUsedAt === lastUsedAt) {
			continue;
		}
		indexData[profileName] = {
			...existing,
			createdAt,
			lastUsedAt,
		};
		mutated = true;
	}
	if (mutated) {
		saveProfileIndex(indexData);
	}
}
class AppView extends WebComponent {
	static url = import.meta.url;
	static styles = {
		app: './app.css',
	};
	static state = {
		activePage: 'wallet',
	};
	id = 'app';
	notificationPanel = null;
	// SDK instance lives on the AppView only — it carries private keys,
	// hdWalletInstance, and walletSeeds. Never set into globalState; only the
	// public projection (address, public keys, trapdoor hash, label) lands in
	// `globalState.wallet`. Profile metadata is mirrored to `globalState.profile`
	// and rides with save/load via the SDK's `meta.extra` field.
	sdk = null;
	router = new URLRouter(ROUTER_CONFIG);
	// Set by `previewProfileMeta` when a password-protected profile is
	// auto-loaded at boot: holds the un-decrypted package + its raw string
	// so the eventual `wallet:unlock` round-trip can decrypt without a
	// second localStorage read.
	lockedProfileRaw = null;
	lockedProfilePkg = null;
	// Sensitive action (transmit/sign) that was deferred while we wait for
	// the user to unlock the wallet via <wallet-unlock-modal>. Cleared when
	// the action re-fires successfully OR when the user cancels.
	pendingAction = null;
	// Flips to true while a transmit triggered by the send-confirm modal is
	// in flight, so `handleTransmitResult` knows to route the outcome back
	// to the modal (close on success / show inline error on failure) instead
	// of letting it pass through silently.
	sendConfirmActive = false;
	static async create(state, config) {
		const app = new this(await state, config);
		await WebComponent.preRender(app, document.body);
		return app;
	}
	async ensureSDK() {
		if (this.sdk) {
			return this.sdk;
		}
		this.sdk = await VIATClientSDK.create();
		return this.sdk;
	}
	async freshSDK() {
		// The SDK's `set(key, value)` shadows prototype methods with the same
		// name (e.g. setting `primaryKeypair` / `trapdoorKeypair` replaces the
		// method references on the instance). A second `setKeypairs()` call on
		// the same instance therefore tries to invoke an object as a function.
		// We sidestep that by replacing the instance for any operation that
		// runs `setKeypairs` from scratch — create and load.
		this.sdk = await VIATClientSDK.create();
		return this.sdk;
	}
	syncSavedProfiles() {
		const profiles = listSavedProfiles();
		globalState.set({
			wallet: {
				...(this.globalState.wallet ?? {}),
				savedProfiles: profiles,
			},
		});
		return profiles;
	}
	getProfileMeta() {
		return this.globalState.profile ?? {};
	}
	async syncWalletPublics() {
		const sdk = this.sdk;
		const primary = sdk?.STATE?.primaryKeypair;
		const trapdoor = sdk?.STATE?.trapdoorKeypair;
		const trapdoorHash = sdk?.STATE?.trapdoorHash;
		const hasWallet = Boolean(sdk?.STATE?.walletSeeds?.seed);
		// Prefer the persisted save meta (carries the extra/profile data through
		// load); fall back to a fresh derivation when no save has occurred yet.
		let meta = sdk?.STATE?.walletSaveMeta;
		if (hasWallet && !meta?.address && sdk?.getWalletMeta) {
			try {
				meta = await sdk.getWalletMeta({
					label: sdk.STATE?.walletSaveMeta?.label,
					meta: this.getProfileMeta(),
				});
			} catch (error) {
				this.onRenderError(error);
			}
		}
		const profileName = meta?.label ?? '';
		const stats = getProfileStats(profileName);
		const createdAt = stats.createdAt || meta?.createdAt || '';
		const lastUsedAt = stats.lastUsedAt || '';
		const publicKeyHex = toPublicHex(primary?.publicKey);
		const trapdoorHashHex = toPublicHex(trapdoorHash);
		globalState.set({
			wallet: {
				...(this.globalState.wallet ?? {}),
				hasWallet,
				address: meta?.address ?? '',
				publicKey: publicKeyHex,
				trapdoorPublicKey: toPublicHex(trapdoor?.publicKey),
				trapdoorHash: trapdoorHashHex,
				label: meta?.label ?? '',
				walletSavedAt: createdAt,
				createdAt,
				lastUsedAt,
			},
			walletParams: buildWalletParams(sdk, {
				label: meta?.label ?? '',
				address: meta?.address ?? '',
				publicKey: publicKeyHex,
				trapdoorHash: trapdoorHashHex,
				createdAt,
				lastUsedAt,
			}),
		});
		if (meta?.address) {
			globalState.set({
				walletAddress: meta.address,
			});
		}
		if (meta?.extra && typeof meta.extra === 'object') {
			globalState.set({
				profile: {
					...this.getProfileMeta(),
					...meta.extra,
				},
			});
		}
		this.applyProfileAddressDefaults();
		this.applyProfileTheme();
		if (hasWallet) {
			// Don't block the sync; let the network round-trip run in the
			// background so the dashboard renders immediately.
			this.fetchAccountForWallet();
		}
	}
	applyProfileAddressDefaults() {
		const address = this.globalState.wallet?.address;
		if (!address) {
			return;
		}
		const urlSafe = toUrlSafeBase64(address);
		const profile = this.getProfileMeta();
		const nextDisplay = profile.displayName?.trim() ? profile.displayName : urlSafe;
		const nextHandle = profile.handle?.trim() ? profile.handle : urlSafe;
		if (nextDisplay === profile.displayName && nextHandle === profile.handle) {
			return;
		}
		globalState.set({
			profile: {
				...profile,
				displayName: nextDisplay,
				handle: nextHandle,
			},
		});
	}
	// Touch the active profile's lastUsedAt every time the user takes a
	// real action with it (transmit, sign, faucet, etc.). Cheap — one
	// localStorage write — and keeps `mostRecentProfile()` ranking honest
	// across sessions. No-op when the active wallet isn't a saved profile
	// (freshly created and not yet stored).
	bumpCurrentProfileUsed() {
		const label = this.globalState.wallet?.label;
		if (!label) {
			return;
		}
		if (!listSavedProfiles().includes(label)) {
			return;
		}
		markProfileUsed(label);
	}
	applyProfileTheme() {
		// Theme rides in profile meta so it follows a wallet across browsers
		// — when a saved wallet is loaded its extras populate globalState.profile,
		// and we re-apply the saved theme here. No-op when the profile has no
		// theme yet (e.g. freshly created wallet on a browser that's already
		// on the desired theme).
		const profileTheme = this.getProfileMeta().theme;
		if (!profileTheme || profileTheme === getTheme()) {
			return;
		}
		setTheme(profileTheme);
	}
	walletError(phase, error) {
		const message = error?.message || `${phase} failed`;
		console.warn(`[wallet:${phase}]`, error);
		this.emit('wallet:state', {
			phase: 'error',
			error: message,
		});
		this.emit('notify', {
			message,
			itemType: 'error',
			title: 'Wallet error',
		});
	}
	async handleWalletCreate(domEvent) {
		const data = domEvent.detail?.data ?? {};
		try {
			const sdk = await this.freshSDK();
			await sdk.generateSiteWallet({
				meta: data.profileMeta ?? this.getProfileMeta(),
				label: data.label,
			});
			if (data.label) {
				await sdk.set('walletSaveMeta', {
					label: data.label,
				});
			}
			await this.syncWalletPublics();
			this.resetProfileToAddress();
			this.emit('wallet:state', {
				phase: 'created',
			});
		} catch (error) {
			this.walletError('create', error);
		}
	}
	async handleWalletCreateSave(domEvent) {
		// Convenience flow: create a fresh wallet AND persist it under a default
		// profile name (the wallet address) with a randomly-generated local key
		// so subsequent boots auto-load it silently. The key is stored next to
		// the package in localStorage — security is the same as any browser-only
		// state (anyone with localStorage access has both). Users who want a
		// real password can re-save via the settings flow.
		const data = domEvent?.detail?.data ?? {};
		try {
			const sdk = await this.freshSDK();
			await sdk.generateSiteWallet({
				meta: data.profileMeta ?? this.getProfileMeta(),
				label: data.label,
			});
			await this.syncWalletPublics();
			this.resetProfileToAddress();
			const profileName = (data.profileName ?? '').trim() || this.globalState.wallet?.address || 'wallet';
			const profileMeta = {
				...this.getProfileMeta(),
				profileName,
			};
			const autoKeyBytes = new Uint8Array(32);
			globalThis.crypto.getRandomValues(autoKeyBytes);
			const autoKeyBase64 = bytesToBase64(autoKeyBytes);
			const pkg = await sdk.createWalletPackage(autoKeyBytes, {
				label: profileName,
				meta: profileMeta,
				bypassPasswordHash: true,
			});
			const json = await sdk.serializeWalletPackage(pkg, 'json');
			globalThis.localStorage?.setItem(profileNameToKey(profileName), json);
			markProfileUsed(profileName, {
				passwordless: true,
				autoKey: autoKeyBase64,
			});
			await sdk.set('walletSaveMeta', pkg.meta);
			await this.syncWalletPublics();
			this.syncSavedProfiles();
			this.emit('wallet:state', {
				phase: 'created',
			});
			this.emit('wallet:saved-local', {
				profileName,
			});
			this.emit('notify', {
				itemType: 'success',
				title: 'Wallet saved',
				message: `Profile "${profileName.slice(0, 16)}…" stored locally — will auto-load next time.`,
			});
		} catch (error) {
			this.walletError('create-save', error);
		}
	}
	async tryAutoLoadRecentProfile() {
		// Backfill once on boot so legacy profiles with only createdAt (or
		// no index entry at all) participate in the "most recent" scan.
		backfillProfileIndex();
		const profileName = mostRecentProfile();
		if (!profileName) {
			return false;
		}
		// Pre-select the most-recent profile in shared state so the
		// settings → LOAD form defaults to it even when we can't auto-load
		// (e.g. it's password-protected). The user just enters the
		// password rather than picking from the dropdown first.
		globalState.set({
			profile: {
				...this.getProfileMeta(),
				lastSelected: profileName,
			},
		});
		const indexEntry = loadProfileIndex()[profileName];
		if (indexEntry?.passwordless && indexEntry?.autoKey) {
			try {
				const storageKey = profileNameToKey(profileName);
				const raw = globalThis.localStorage?.getItem(storageKey);
				if (!raw) {
					forgetProfileFromIndex(profileName);
					return false;
				}
				const sdk = await this.freshSDK();
				const pkg = isJsonString(raw) ? await sdk.deserializeWalletPackage(raw, 'json') : await sdk.deserializeWalletPackage(base64ToBytes(raw), 'cbor');
				const autoKeyBytes = base64ToBytes(indexEntry.autoKey);
				const imported = await sdk.importWalletPackage(pkg, autoKeyBytes, {
					bypassPasswordHash: true,
				});
				markProfileUsed(profileName, {
					passwordless: true,
					autoKey: indexEntry.autoKey,
				});
				await this.syncWalletPublics();
				this.emit('wallet:state', {
					phase: 'loaded',
					meta: imported.meta,
					autoLoaded: true,
				});
				this.showWelcomeBack(profileName, false);
				return true;
			} catch (error) {
				console.warn('[wallet:autoload]', error);
				return false;
			}
		}
		// Password-protected: load the public metadata only so the dashboard
		// renders with the wallet's address, public key, theme, etc. — and
		// the live balance / transactions fetch kicks off immediately. The
		// private keys stay encrypted until the user triggers a sensitive
		// action and feeds their password through <wallet-unlock-modal>.
		return this.previewProfileMeta(profileName);
	}
	async previewProfileMeta(profileName) {
		if (!profileName || !globalThis.localStorage) {
			return false;
		}
		const storageKey = profileNameToKey(profileName);
		const raw = globalThis.localStorage.getItem(storageKey);
		if (!raw) {
			forgetProfileFromIndex(profileName);
			return false;
		}
		// freshSDK is correct here even though we won't decrypt: any prior
		// SDK instance might be carrying half-loaded state from a previous
		// session, and we want the locked preview to start from a clean
		// slate so a later unlock attempt has nothing to collide with.
		const sdk = await this.freshSDK();
		let pkg;
		try {
			pkg = isJsonString(raw) ? await sdk.deserializeWalletPackage(raw, 'json') : await sdk.deserializeWalletPackage(base64ToBytes(raw), 'cbor');
		} catch (error) {
			console.warn('[wallet:preview]', error);
			return false;
		}
		const meta = pkg?.meta ?? {};
		// Cache for handleWalletUnlock so the unlock round-trip doesn't have
		// to re-read + re-parse the package the user is staring at.
		this.lockedProfileRaw = raw;
		this.lockedProfilePkg = pkg;
		const stats = getProfileStats(profileName);
		const publicKeyHex = meta.publicKey ? toPublicHex(base64ToBytes(meta.publicKey)) : '';
		const trapdoorHashHex = meta.trapdoorHash ? toPublicHex(base64ToBytes(meta.trapdoorHash)) : '';
		const createdAt = stats.createdAt || meta.createdAt || '';
		const lastUsedAt = stats.lastUsedAt || createdAt;
		globalState.set({
			wallet: {
				...(this.globalState.wallet ?? {}),
				hasWallet: true,
				locked: true,
				lockedProfileName: profileName,
				address: meta.address ?? '',
				publicKey: publicKeyHex,
				trapdoorPublicKey: '',
				trapdoorHash: trapdoorHashHex,
				label: meta.label ?? profileName,
				walletSavedAt: createdAt,
				createdAt,
				lastUsedAt,
			},
			walletAddress: meta.address ?? '',
			walletParams: buildWalletParamsFromMeta(meta, {
				createdAt,
				lastUsedAt,
			}),
		});
		if (meta.extra && typeof meta.extra === 'object') {
			globalState.set({
				profile: {
					...this.getProfileMeta(),
					...meta.extra,
				},
			});
		}
		this.applyProfileAddressDefaults();
		this.applyProfileTheme();
		if (meta.address) {
			this.fetchAccountForWallet();
		}
		this.emit('wallet:state', {
			phase: 'preview',
			meta,
			locked: true,
			profileName,
		});
		this.showWelcomeBack(profileName, true);
		return true;
	}
	showWelcomeBack(profileName, locked) {
		const wallet = this.globalState.wallet ?? {};
		const modal = this.getComponent('welcome-back-modal');
		modal?.openFor?.({
			profileName,
			address: wallet.address || '',
			label: wallet.label || profileName,
			locked,
		});
	}
	handleRequestUnlock = (domEvent) => {
		// Re-uses the standard sensitive-action gate so the unlock modal
		// shows with the same reason styling the user has already seen.
		// No pending action queued here — they explicitly asked to unlock
		// without a downstream side-effect to re-fire.
		const data = domEvent?.detail?.data ?? {};
		this.ensureWalletUnlocked(data.reason || 'Unlock your wallet to enable signing and transactions.', null);
	};
	resetProfileToAddress() {
		const address = this.globalState.wallet?.address;
		if (!address) {
			return;
		}
		const urlSafe = toUrlSafeBase64(address);
		globalState.set({
			profile: {
				...this.getProfileMeta(),
				displayName: urlSafe,
				handle: urlSafe,
			},
		});
	}
	async handleWalletSave(domEvent) {
		const data = domEvent.detail?.data ?? {};
		try {
			const sdk = await this.ensureSDK();
			const pkg = await sdk.createWalletPackage(data.password, {
				label: data.label,
				meta: data.profileMeta ?? this.getProfileMeta(),
			});
			const bytes = await sdk.serializeWalletPackage(pkg, 'cbor');
			const base64 = bytesToBase64(bytes);
			await sdk.set('walletSaveMeta', pkg.meta);
			await this.syncWalletPublics();
			this.emit('wallet:saved', {
				base64,
				meta: pkg.meta,
			});
		} catch (error) {
			this.walletError('save', error);
		}
	}
	async handleWalletSaveLocal(domEvent) {
		const data = domEvent.detail?.data ?? {};
		try {
			if (!globalThis.localStorage) {
				throw new Error('localStorage is not available in this browser.');
			}
			const sdk = await this.ensureSDK();
			const fallbackName = this.globalState.wallet?.address || this.getProfileMeta().displayName || 'wallet';
			const profileName = (data.profileName ?? '').trim() || fallbackName;
			const profileMeta = {
				...this.getProfileMeta(),
				profileName,
			};
			const password = data.password ?? '';
			const pkg = await sdk.createWalletPackage(password, {
				label: profileName,
				meta: profileMeta,
			});
			const json = await sdk.serializeWalletPackage(pkg, 'json');
			const storageKey = profileNameToKey(profileName);
			globalThis.localStorage.setItem(storageKey, json);
			markProfileUsed(profileName, {
				passwordless: password === '',
			});
			await sdk.set('walletSaveMeta', pkg.meta);
			await this.syncWalletPublics();
			this.syncSavedProfiles();
			this.emit('wallet:saved-local', {
				profileName,
				storageKey,
			});
		} catch (error) {
			this.walletError('save-local', error);
		}
	}
	async handleWalletLoad(domEvent) {
		const data = domEvent.detail?.data ?? {};
		try {
			const input = `${data.base64 ?? ''}`.trim();
			if (!input) {
				throw new Error('Provide a wallet payload (JSON or base64-encoded CBOR).');
			}
			const sdk = await this.freshSDK();
			let pkg;
			if (isJsonString(input)) {
				pkg = await sdk.deserializeWalletPackage(input, 'json');
			} else {
				pkg = await sdk.deserializeWalletPackage(base64ToBytes(input), 'cbor');
			}
			const imported = await sdk.importWalletPackage(pkg, data.password);
			await this.syncWalletPublics();
			this.emit('wallet:state', {
				phase: 'loaded',
				meta: imported.meta,
			});
		} catch (error) {
			this.walletError('load', error);
		}
	}
	async handleWalletLoadLocal(domEvent) {
		const data = domEvent.detail?.data ?? {};
		try {
			if (!globalThis.localStorage) {
				throw new Error('localStorage is not available in this browser.');
			}
			const profileName = (data.profileName ?? '').trim();
			if (!profileName) {
				throw new Error('Select a saved profile to load.');
			}
			const storageKey = profileNameToKey(profileName);
			const raw = globalThis.localStorage.getItem(storageKey);
			if (!raw) {
				throw new Error(`No saved wallet at ${storageKey}`);
			}
			const sdk = await this.freshSDK();
			const pkg = isJsonString(raw) ? await sdk.deserializeWalletPackage(raw, 'json') : await sdk.deserializeWalletPackage(base64ToBytes(raw), 'cbor');
			const password = data.password ?? '';
			const imported = await sdk.importWalletPackage(pkg, password);
			markProfileUsed(profileName, {
				passwordless: password === '',
			});
			this.lockedProfileRaw = null;
			this.lockedProfilePkg = null;
			globalState.set({
				wallet: {
					...(this.globalState.wallet ?? {}),
					locked: false,
					lockedProfileName: '',
				},
			});
			await this.syncWalletPublics();
			this.emit('wallet:state', {
				phase: 'loaded',
				meta: imported.meta,
			});
		} catch (error) {
			this.walletError('load-local', error);
		}
	}
	// Triggered by <wallet-unlock-modal> when the user submits a password.
	// Resolves the cached locked package (or re-reads localStorage as a
	// fallback), decrypts it, swaps the SDK over to the unlocked instance,
	// then re-fires whatever sensitive action the user originally clicked
	// via `runPendingAction`. Failures bounce back into the modal so the
	// user can retry without losing context.
	async handleWalletUnlock(domEvent) {
		const data = domEvent?.detail?.data ?? {};
		const password = data.password ?? '';
		const profileName = (data.profileName ?? this.globalState.wallet?.lockedProfileName ?? '').trim();
		const unlockModal = this.getComponent('wallet-unlock-modal');
		if (!profileName) {
			unlockModal?.handleFailure?.('No locked profile to unlock.');
			return;
		}
		try {
			const storageKey = profileNameToKey(profileName);
			const raw = this.lockedProfileRaw || globalThis.localStorage?.getItem(storageKey);
			if (!raw) {
				throw new Error('Saved wallet payload missing from localStorage.');
			}
			const sdk = await this.freshSDK();
			const pkg = isJsonString(raw) ? await sdk.deserializeWalletPackage(raw, 'json') : await sdk.deserializeWalletPackage(base64ToBytes(raw), 'cbor');
			const imported = await sdk.importWalletPackage(pkg, password);
			markProfileUsed(profileName, {
				passwordless: password === '',
			});
			this.lockedProfileRaw = null;
			this.lockedProfilePkg = null;
			globalState.set({
				wallet: {
					...(this.globalState.wallet ?? {}),
					locked: false,
					lockedProfileName: '',
				},
			});
			await this.syncWalletPublics();
			this.emit('wallet:state', {
				phase: 'loaded',
				meta: imported.meta,
				unlocked: true,
			});
			unlockModal?.handleSuccess?.();
			this.runPendingAction();
		} catch (error) {
			console.warn('[wallet:unlock]', error);
			unlockModal?.handleFailure?.(error?.message);
		}
	}
	handleWalletUnlockCancel = () => {
		// Discard whatever sensitive action queued the unlock prompt — the
		// user explicitly bailed and shouldn't have it fire later if they
		// then unlock via the settings flow.
		this.pendingAction = null;
	};
	// AI-initiated (or future programmatic) sends route through the
	// send-confirm modal. On CONFIRM the modal emits `send-confirm:execute`;
	// we forward to the existing `transmit` event so the normal sign /
	// API / refresh pipeline runs, then route the `transmit:result` back
	// into the modal so it can close on success or surface the error.
	handleSendConfirmExecute = (domEvent) => {
		const data = domEvent?.detail?.data ?? {};
		this.sendConfirmActive = true;
		this.emit('transmit', {
			recipient: data.recipient,
			recipientFormat: data.recipientFormat || 'base64',
			amount: data.amount,
		});
	};
	handleSendConfirmCancel = () => {
		this.sendConfirmActive = false;
	};
	handleTransmitResult = (domEvent) => {
		if (!this.sendConfirmActive) {
			return;
		}
		this.sendConfirmActive = false;
		const data = domEvent?.detail?.data ?? {};
		const modal = this.getComponent('send-confirm-modal');
		modal?.handleResult?.(data);
	};
	runPendingAction() {
		const pending = this.pendingAction;
		if (!pending) {
			return;
		}
		this.pendingAction = null;
		// Defer one tick so the unlock-modal close transition and reactive
		// state writes settle before the original action re-runs (some
		// downstream handlers read `globalState.wallet.locked` synchronously).
		setTimeout(() => {
			pending();
		}, 0);
	}
	// Gate sensitive actions that need a private key. Returns true when the
	// wallet is already unlocked and the action may proceed; returns false
	// (and either opens onboarding or the unlock modal) when the caller
	// should bail out. The `intent` callback is what we'll re-fire once the
	// user successfully unlocks — store the original domEvent payload there
	// so the action runs with the exact same data.
	ensureWalletUnlocked(reason, intent) {
		const wallet = this.globalState.wallet ?? {};
		if (!wallet.hasWallet) {
			this.emit('wallet:onboarding-required', {
				reason,
			});
			return false;
		}
		if (!wallet.locked) {
			return true;
		}
		this.pendingAction = typeof intent === 'function' ? intent : null;
		const unlockModal = this.getComponent('wallet-unlock-modal');
		unlockModal?.openFor?.({
			profileName: wallet.lockedProfileName || wallet.label || '',
			address: wallet.address || '',
			reason,
		});
		return false;
	}
	handleWalletDeleteLocal(domEvent) {
		const data = domEvent.detail?.data ?? {};
		const profileName = (data.profileName ?? '').trim();
		if (!profileName || !globalThis.localStorage) {
			return;
		}
		globalThis.localStorage.removeItem(profileNameToKey(profileName));
		forgetProfileFromIndex(profileName);
		this.syncSavedProfiles();
		this.emit('wallet:deleted-local', {
			profileName,
		});
	}
	handleProfileUpdate(domEvent) {
		const data = domEvent.detail?.data ?? {};
		globalState.set({
			profile: {
				...this.getProfileMeta(),
				...(data.meta ?? {}),
			},
		});
		this.applyProfileTheme();
	}
	ensureNotificationPanel() {
		if (this.notificationPanel?.isConnected) {
			return this.notificationPanel;
		}
		this.notificationPanel = new UINotification();
		// Manual popover puts the host into the browser's top layer so
		// notifications stack above any open `<dialog>` (e.g. settings,
		// onboarding). Falls back gracefully on engines without popover
		// support — z-index inside the panel still wins among siblings.
		this.notificationPanel.setAttribute('popover', 'manual');
		document.body.appendChild(this.notificationPanel);
		if (typeof this.notificationPanel.showPopover === 'function') {
			try {
				this.notificationPanel.showPopover();
			} catch (error) {
				console.warn('[notify] showPopover failed', error);
			}
		}
		return this.notificationPanel;
	}
	handleNotify(domEvent) {
		this.ensureNotificationPanel().show(domEvent.detail?.data ?? {});
	}
	onConnect() {
		this.reflectViewport();
		// AppView observes the router's published global keys and reacts;
		// the router owns URL/history work entirely. See urlRouter.js → publishGlobal.
		this.observeGlobal([
			'routeView', 'routeParams', 'routeFilter',
		], () => {
			this.syncActivePageFromGlobal();
		});
	}
	onMount() {
		this.delegate('open-settings', this.handleOpenSettings);
		this.delegate('toggle-pulldown', this.handleTogglePulldown);
		this.delegate('dockSelect', this.handleDockSelect);
		this.delegate('wallet:create', this.handleWalletCreate);
		this.delegate('wallet:create-save', this.handleWalletCreateSave);
		this.delegate('wallet:save', this.handleWalletSave);
		this.delegate('wallet:save-local', this.handleWalletSaveLocal);
		this.delegate('wallet:load', this.handleWalletLoad);
		this.delegate('wallet:load-local', this.handleWalletLoadLocal);
		this.delegate('wallet:delete-local', this.handleWalletDeleteLocal);
		this.delegate('wallet:unlock', this.handleWalletUnlock);
		this.delegate('wallet:unlock-cancel', this.handleWalletUnlockCancel);
		this.delegate('wallet:request-unlock', this.handleRequestUnlock);
		this.delegate('send-confirm:execute', this.handleSendConfirmExecute);
		this.delegate('send-confirm:cancel', this.handleSendConfirmCancel);
		this.delegate('transmit:result', this.handleTransmitResult);
		this.delegate('wallet:onboarding-required', this.handleOnboardingRequired);
		this.delegate('profile:update', this.handleProfileUpdate);
		this.delegate('sign:open', this.handleSignOpen);
		this.delegate('sign:execute', this.handleSignExecute);
		this.delegate('info:open', this.handleInfoOpen);
		this.delegate('transmit', this.handleTransmit);
		this.delegate('faucet:request', this.handleFaucetRequest);
		this.delegate('wallet:refresh', this.handleWalletRefresh);
		this.delegate('notify', this.handleNotify);
		this.syncSavedProfiles();
		this.checkAPIHealth();
		this.tryAutoLoadRecentProfile();
		// Keyboard shortcuts route through the hotkey registry — one master
		// `keydown` listener lives in core/hotkeys, and lifecycle's
		// sweepHotkeyEntries releases each entry on disconnect. No raw
		// addEventListener / removeEventListener pair needed.
		//
		// `escape` carries `whileTyping: true` because the original closes the
		// pulldown regardless of focus (a chat input inside the pulldown still
		// needs to surrender to it). `preventDefault: false` keeps the key
		// available for other consumers when the pulldown is already shut —
		// the handler calls `preventDefault()` itself only when it acts.
		this.hotKey('escape', this.handleEscapeHotkey, {
			preventDefault: false,
			whileTyping: true,
		});
		this.hotKey('`', this.handleTogglePulldownHotkey);
		this.hotKey('~', this.handleTogglePulldownHotkey);
		this.hotKey('\\', this.handleToggleSidebarHotkey);
		this.hotKey('|', this.handleToggleSidebarHotkey);
		globalThis.addEventListener('viat:api-error', this.handleApiError);
	}
	handleApiError = (evnt) => {
		const detail = evnt?.detail ?? {};
		if (detail.silent) {
			return;
		}
		const status = detail.status || 'Error';
		const endpoint = detail.endpoint || 'request';
		this.emit('notify', {
			itemType: 'error',
			title: `API ${status}`,
			message: `${endpoint} — ${detail.message || 'failed'}`,
		});
	};
	handleOnboardingRequired = (domEvent) => {
		// Sensitive actions (sign / send / faucet) call this when no wallet is
		// loaded to force-open the onboarding modal regardless of current route.
		const onboarding = this.getComponent('wallet-onboarding');
		const reason = domEvent?.detail?.data?.reason;
		onboarding?.forceOpen?.(reason);
	};
	async checkAPIHealth() {
		const sdk = await this.ensureSDK();
		const startedAt = Date.now();
		const health = await sdk.health();
		if (!health) {
			globalState.set({
				api: {
					ok: false,
					status: 'unreachable',
					error: 'API unreachable',
					checkedAt: new Date().toISOString(),
				},
			});
			return null;
		}
		const latencyMs = Date.now() - startedAt;
		globalState.set({
			api: {
				ok: true,
				status: health.status ?? 'unknown',
				service: health.service ?? '',
				version: health.version ?? '',
				load: health.load ?? null,
				latencyMs,
				checkedAt: new Date().toISOString(),
				error: null,
			},
		});
		return health;
	}
	async fetchAccountForWallet() {
		const address = this.globalState.wallet?.address;
		if (!address) {
			return null;
		}
		if (this.globalState.api?.ok === false) {
			return null;
		}
		const sdk = await this.ensureSDK();
		const response = await sdk.getAccount(address);
		// SDK returns null on any HTTP failure (404 included) and already
		// auto-notifies for non-silent errors. We treat null as "no account
		// record yet" — getAccount 404s are flagged silent in the SDK.
		const account = response?.account ?? null;
		const balance = account?.balance ?? '0';
		const totalIn = account?.totalIn ?? '0';
		const totalOut = account?.totalOut ?? '0';
		globalState.set({
			account: {
				...(account ?? {}),
				fetchedAt: new Date().toISOString(),
				exists: Boolean(account),
				notFound: !account,
			},
			walletAmount: {
				label: 'RESOURCE ALLOCATION',
				amount: formatBalanceShort(balance),
				amountFull: formatBalanceShort(balance),
			},
			walletPanel: {
				...(this.globalState.walletPanel ?? {}),
				received: formatBalanceShort(totalIn),
				sent: formatBalanceShort(totalOut),
				activity: formatBalanceShort(balance),
			},
		});
		this.syncWalletStatsPanel({
			received: formatBalanceShort(totalIn),
			sent: formatBalanceShort(totalOut),
			activity: formatBalanceShort(balance),
		});
		// Transactions for the activity log piggy-back on every account
		// refresh — the same round-trip that fetched the balance also
		// gives us the user's recent tx list. Fire-and-forget; the activity
		// log shows "No transactions" while it waits.
		this.fetchTransactionsForWallet();
		return account;
	}
	// The activity-log now self-loads the wallet's tx history via remoteList (its
	// own loader + cursor paging + tx→entry mapping). On an account refresh we
	// just poke each mounted instance to reload; a wallet-address change resets it
	// on its own (the log observes the wallet bus). Both dashboards mount one.
	fetchTransactionsForWallet() {
		this.applyToAll('activity-log', (log) => {
			log.remote?.('entries')?.refresh();
		});
	}
	syncWalletStatsPanel(values) {
		this.applyToAll('wallet-stats-panel', (panel) => {
			if (panel?.state) {
				Object.assign(panel.state, values);
			}
		});
	}
	applyToAll(tagName, fn) {
		// `getComponents` only finds direct shadow children, so it misses
		// anything nested inside <app-dashboard> / <mobile-dashboard>. Walk
		// both dashboards explicitly so shared children (transmit-panel,
		// center-bar, activity-log, wallet-stats-panel) get updated in both
		// the visible and hidden instance.
		const roots = [
			this.getComponent('app-dashboard'),
			this.getComponent('mobile-dashboard'),
		];
		for (let r = 0; r < roots.length; r += 1) {
			const root = roots[r];
			if (!root) {
				continue;
			}
			const list = root.getComponents(tagName) || [];
			for (let index = 0; index < list.length; index += 1) {
				fn(list[index]);
			}
		}
	}
	// Center-bar refresh button — pulls a fresh account snapshot (balance,
	// totals, activity-log entries) for the active wallet. No-ops when no
	// wallet is loaded so it's safe to leave the button enabled.
	handleWalletRefresh = () => {
		if (!this.globalState.wallet?.address) {
			this.emit('notify', {
				itemType: 'info',
				title: 'Refresh skipped',
				message: 'Load a wallet first — nothing to refresh yet.',
			});
			return;
		}
		this.fetchAccountForWallet();
	};
	async handleFaucetRequest() {
		if (this.globalState.api?.ok === false) {
			this.emit('notify', {
				itemType: 'error',
				title: 'API offline',
				message: 'Faucet unavailable — API is unreachable.',
			});
			return null;
		}
		const address = this.globalState.wallet?.address;
		if (!address) {
			this.emit('wallet:onboarding-required', {
				reason: 'The faucet needs a loaded wallet to mint funds into.',
			});
			return null;
		}
		const sdk = await this.ensureSDK();
		const response = await sdk.mintFunds(address);
		if (!response) {
			// SDK already notified.
			return null;
		}
		const tx = response.transaction ?? null;
		const amount = tx?.amount ? `${tx.amount} VIAT` : 'test funds';
		this.emit('notify', {
			itemType: 'success',
			title: 'Faucet Sent',
			message: `Minted ${amount}${tx?.id ? ` (tx ${tx.id.slice(0, 12)}…)` : ''}`,
		});
		this.fetchAccountForWallet();
		this.bumpCurrentProfileUsed();
		return tx;
	}
	async handleTransmit(domEvent) {
		const data = domEvent?.detail?.data ?? {};
		const rawRecipient = `${data.recipient ?? ''}`.trim();
		const recipientFormat = data.recipientFormat || 'base64';
		const amount = `${data.amount ?? ''}`.trim();
		let recipient;
		try {
			recipient = recipientToBase64(rawRecipient, recipientFormat);
		} catch (err) {
			const message = `Invalid ${recipientFormat} address: ${err?.message ?? err}`;
			this.emit('notify', {
				itemType: 'error',
				title: 'Transmit failed',
				message,
			});
			this.emit('transmit:result', {
				ok: false,
				error: message,
			});
			return null;
		}
		const validation = this.validateTransmit(recipient, amount);
		if (validation) {
			this.emit('notify', {
				itemType: 'error',
				title: 'Transmit failed',
				message: validation,
			});
			this.emit('transmit:result', {
				ok: false,
				error: validation,
			});
			return null;
		}
		// Need the primary keypair to sign — prompt for the password if the
		// active wallet was preview-loaded (metadata only). After unlock the
		// modal re-fires the original event so this handler runs again with
		// the same data.
		const unlocked = this.ensureWalletUnlocked('Sending a transaction needs your wallet password to sign.', () => {
			this.handleTransmit(domEvent);
		});
		if (!unlocked) {
			return null;
		}
		const sdk = await this.ensureSDK();
		const tx = await sdk.sendTransaction(recipient, amount);
		if (!tx) {
			// SDK already notified.
			this.emit('transmit:result', {
				ok: false,
				error: 'API request failed',
			});
			return null;
		}
		this.emit('notify', {
			itemType: 'success',
			title: 'Transaction Sent',
			message: `Tx ${tx?.transaction?.id?.slice?.(0, 12) ?? 'submitted'} — ${amount} VIAT to ${recipient.slice(0, 16)}…`,
		});
		this.emit('transmit:result', {
			ok: true,
			transaction: tx?.transaction ?? null,
		});
		this.fetchAccountForWallet();
		this.bumpCurrentProfileUsed();
		return tx;
	}
	validateTransmit(recipient, amount) {
		if (this.globalState.api?.ok === false) {
			return 'API is unreachable — try again once the connection recovers.';
		}
		if (!this.globalState.wallet?.hasWallet) {
			this.emit('wallet:onboarding-required', {
				reason: 'Sending a transaction requires a loaded wallet.',
			});
			return 'No wallet loaded.';
		}
		if (!recipient) {
			return 'Provide a recipient address.';
		}
		if (!amount) {
			return 'Provide an amount to send.';
		}
		return '';
	}
	handleOpenSettings = (domEvent) => {
		const data = domEvent?.detail?.data ?? {};
		const settings = this.getComponent('settings-modal');
		if (!settings) {
			return;
		}
		if (data.section) {
			settings.state.activeSection = data.section;
		}
		settings.open();
	};
	handleSignOpen = () => {
		const wallet = this.globalState.wallet ?? {};
		if (!wallet.hasWallet) {
			this.emit('wallet:onboarding-required', {
				reason: 'Signing data requires a loaded wallet.',
			});
			return;
		}
		// Opening the sign modal is harmless while locked — we only need to
		// gate the actual sign-execute step. Lets the user paste/type data
		// while we wait for them to confirm signing.
		const modal = this.getComponent('sign-data-modal');
		if (!modal) {
			return;
		}
		modal.open();
	};
	handleInfoOpen = () => {
		const modal = this.getComponent('wallet-info-modal');
		if (!modal) {
			return;
		}
		modal.open();
	};
	handleSignExecute = async (domEvent) => {
		const message = domEvent?.detail?.data?.data;
		const unlocked = this.ensureWalletUnlocked('Signing data needs your wallet password to access the private key.', () => {
			this.handleSignExecute(domEvent);
		});
		if (!unlocked) {
			return;
		}
		try {
			const sdk = this.sdk;
			const privateKey = sdk?.STATE?.primaryKeypair?.privateKey;
			if (!privateKey) {
				throw new Error('No wallet loaded. Create or import a wallet before signing.');
			}
			if (!message) {
				throw new Error('Provide data to sign.');
			}
			const signature = await sdk.sign(message, privateKey);
			this.emit('sign:result', {
				signature: bytesToBase64(signature),
			});
			this.bumpCurrentProfileUsed();
		} catch (error) {
			console.warn('[sign:error]', error);
			this.emit('sign:error', {
				error: error?.message || 'Sign failed',
			});
			this.emit('notify', {
				message: error?.message || 'Sign failed',
				itemType: 'error',
				title: 'Sign error',
			});
		}
	};
	handleTogglePulldown = () => {
		this.emit('pulldown:state', {
			open: !this.pulldownIsOpen(),
		});
	};
	handleDockSelect = (domEvent) => {
		const id = domEvent.detail?.source?.state?.id;
		if (!DOCK_ROUTE_IDS.has(id) || !this.router.findById(id)) {
			return;
		}
		// Re-tapping the active dock entry doesn't navigate (matches the
		// macOS dock; also avoids clobbering any /page/N/ deep-link the
		// user landed on), but for the wallet section we DO want it to
		// hard-refresh account state — balance, totals, tx feed — so the
		// dashboard click acts like a "pull to refresh".
		if (this.router.current?.section === id) {
			if (id === 'wallet') {
				this.fetchAccountForWallet();
			}
			return;
		}
		this.router.navigate(id);
	};
	pageFromGlobal() {
		const raw = Number(this.globalState?.routeParams?.page);
		return Number.isFinite(raw) && raw >= 1 ? raw : 1;
	}
	syncActivePageFromGlobal = () => {
		const view = this.globalState?.routeView || this.globalState?.routeSection || this.globalState?.routeId || '';
		if (!view) {
			return;
		}
		const previousView = this.state.activePage;
		this.state.activePage = view;
		// Document scroll now carries across SPA navigations (window.scrollY does
		// not auto-reset), so a route change must land the new page at the top —
		// parity with the old fresh-per-scroller behavior. This handler only fires
		// on a real route change (routeView/routeParams/routeFilter), so it's safe
		// to reset unconditionally.
		globalThis.scrollTo(0, 0);
		const params = this.globalState?.routeParams ?? {};
		const filter = this.globalState?.routeFilter ?? '';
		const page = this.pageFromGlobal();
		if (view === 'transaction' && params.id) {
			this.getComponent('transaction-detail-page')?.setTxId?.(params.id);
		} else if (view === 'account' && params.address) {
			this.getComponent('account-detail-page')?.setAddress?.(params.address, page);
		} else if (view === 'explorer') {
			this.getComponent('explorer-page')?.setView?.(filter || 'all', page);
		} else if (view === 'accounts') {
			this.getComponent('accounts-list-page')?.setPage?.(page);
		} else if (view === 'wallet' && previousView !== 'wallet') {
			// Entering the dashboard from elsewhere — pull a fresh account
			// snapshot so balance, totals and the activity feed reflect any
			// state the user picked up while they were on the explorer /
			// account-detail / transaction-detail pages.
			this.fetchAccountForWallet();
		}
	};
	onVisible() {
		console.log('[AI MAP]\n%s', this.aiMap());
	}
	onDisconnect() {
		// Hotkey entries are released by lifecycle's sweepHotkeyEntries —
		// nothing to do here for the keyboard.
		this.notificationPanel?.remove();
		this.notificationPanel = null;
	}
	// Hotkey handlers — prototype methods (not arrow fields). The hotkey
	// dispatcher does `handler.call(component, keyEvent, combo)`, so `this` is
	// supplied at call time and the registry's `WeakRef<component>` stays
	// honest. A bound or arrow-field handler would re-pin the instance.
	handleEscapeHotkey(keyEvent) {
		if (!this.pulldownIsOpen()) {
			return;
		}
		this.emit('pulldown:state', {
			open: false,
		});
		keyEvent.preventDefault();
	}
	handleTogglePulldownHotkey() {
		this.emit('pulldown:state', {
			open: !this.pulldownIsOpen(),
		});
	}
	handleToggleSidebarHotkey() {
		this.emit('toggle-sidebar', {});
	}
	pulldownIsOpen() {
		return this.getComponent('global-pulldown')?.refs?.pulldown?.state?.open === true;
	}
	render() {
		// Can't be css hide show for page components the router should be mounting and unmounting them based on the URL; they need to be fully removed from the DOM when not active so their lifecycle disconnects and they stop consuming resources. The router doesn't do this automatically since some pages (e.g. explorer) have nested sub-pages that share the same parent route, so we mount all page components here and let the router delegate which one is active via a wrapper class on the parent.
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<global-top-bar></global-top-bar>
			<div class="shell-body">
				<div class="${() => {
					return `shell-page is-page-${this.state.activePage}`;
				}}">
					<app-dashboard class="shell-page-view"></app-dashboard>
					<mobile-dashboard class="shell-page-view"></mobile-dashboard>
					<swap-page class="shell-page-view"></swap-page>
					<explorer-page class="shell-page-view"></explorer-page>
					<accounts-list-page class="shell-page-view"></accounts-list-page>
					<account-detail-page class="shell-page-view"></account-detail-page>
					<transaction-detail-page class="shell-page-view"></transaction-detail-page>
				</div>
				<global-sidebar></global-sidebar>
			</div>
			<global-bottom-bar></global-bottom-bar>
			<global-dock></global-dock>
			<global-pulldown></global-pulldown>
			<settings-modal></settings-modal>
			<sign-data-modal></sign-data-modal>
			<wallet-info-modal></wallet-info-modal>
			<wallet-unlock-modal></wallet-unlock-modal>
			<welcome-back-modal></welcome-back-modal>
			<send-confirm-modal></send-confirm-modal>
			<wallet-onboarding></wallet-onboarding>
		`;
	}
	get refs() {
		const dashboard = this.getComponent('app-dashboard');
		return {
			dashboard,
			activityLog: dashboard?.getComponent('activity-log'),
			globalBottomBar: this.getComponent('global-bottom-bar'),
			globalDock: this.getComponent('global-dock'),
			networkStats: this.getComponent('global-sidebar')?.getComponent('network-stats'),
			centerBar: dashboard?.getComponent('center-bar'),
			globalTopBar: this.getComponent('global-top-bar'),
			globalPulldown: this.getComponent('global-pulldown'),
			transmitPanel: dashboard?.getComponent('transmit-panel'),
			walletAmount: dashboard?.getComponent('wallet-amount'),
			walletPanel: dashboard?.getComponent('wallet-panel'),
			walletStatsPanel: dashboard?.getComponent('wallet-stats-panel'),
			walletParams: dashboard?.getComponent('wallet-params'),
		};
	}
	async onRender() {
		// Chrome-only bootstrap: wait for both dashboards to render, sync the
		// network latency readout from the live API, then start the router.
		// Both <app-dashboard> and <mobile-dashboard> mount in parallel; await
		// each so their subtree exists before the router publishes the route.
		const dashboard = this.getComponent('app-dashboard');
		const mobileDashboard = this.getComponent('mobile-dashboard');
		await dashboard.lifecycle.whenRendered;
		if (mobileDashboard?.lifecycle?.whenRendered) {
			await mobileDashboard.lifecycle.whenRendered;
		}
		this.refs.networkStats.syncLatency?.(this.globalState.api);
		// Router writes to globalState; AppView's `onConnect` already
		// subscribed to the keys it cares about. We just kick the router off
		// — no callback wiring needed.
		this.router.start();
		// Initial sync: deep-linked first paint, dock/page components mount
		// after the router publishes, so reapply once they're alive.
		this.syncActivePageFromGlobal();
	}
}
customElements.define('app-view', AppView);
export default AppView;
