import '../../../global/icon/icon.js';
import { WebComponent } from '../../../core/index.js';
import { toQrSvg } from 'viat';
const EXPORT_SIZE = 512;
async function svgStringToPngBlob(svgString, size) {
	const svgBlob = new Blob([svgString], {
		type: 'image/svg+xml;charset=utf-8',
	});
	const url = URL.createObjectURL(svgBlob);
	try {
		const img = await new Promise((resolve, reject) => {
			const i = new Image();
			i.onload = () => resolve(i);
			i.onerror = () => reject(new Error('Could not load QR SVG into an image element.'));
			i.src = url;
		});
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, size, size);
		ctx.drawImage(img, 0, 0, size, size);
		return await new Promise((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error('Canvas toBlob produced no data.'));
				}
			}, 'image/png');
		});
	} finally {
		URL.revokeObjectURL(url);
	}
}
function triggerDownload(blob, filename) {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}
export class WalletQr extends WebComponent {
	static url = import.meta.url;
	static styles = {
		walletQr: './wallet-qr.css',
	};
	static state = {
		svg: '',
		renderedAddress: '',
		busy: false,
	};
	onConnect() {
		this.observeGlobal('walletAddress', (nextAddress) => {
			this.refreshSvg(nextAddress);
		});
		this.refreshSvg(this.globalState.walletAddress);
	}
	async refreshSvg(address) {
		const next = `${address ?? ''}`.trim();
		if (!next) {
			this.assignState({
				renderedAddress: '',
				svg: '',
				busy: false,
			});
			return;
		}
		if (next === this.state.renderedAddress && this.state.svg) {
			return;
		}
		this.state.busy = true;
		try {
			const svg = await toQrSvg(next, {
				margin: 1,
				errorCorrectionLevel: 'M',
				color: {
					dark: '#e8eaf2',
					light: '#00000000',
				},
			});
			if (this.globalState.walletAddress !== next) {
				return;
			}
			this.assignState({
				renderedAddress: next,
				svg,
				busy: false,
			});
		} catch (qrError) {
			this.assignState({
				busy: false,
			});
			this.emit('notify', {
				itemType: 'error',
				message: qrError?.message || 'QR encoding failed',
				title: 'QR error',
			});
		}
	}
	async buildExportPngBlob() {
		const address = this.state.renderedAddress;
		if (!address) {
			return null;
		}
		const exportSvg = await toQrSvg(address, {
			margin: 2,
			errorCorrectionLevel: 'M',
			color: {
				dark: '#000000',
				light: '#ffffff',
			},
		});
		return svgStringToPngBlob(exportSvg, EXPORT_SIZE);
	}
	async handleCopyImage() {
		if (!this.state.renderedAddress) {
			return;
		}
		try {
			if (!globalThis.ClipboardItem || !globalThis.navigator?.clipboard?.write) {
				throw new Error('Image clipboard is not supported in this browser.');
			}
			const blob = await this.buildExportPngBlob();
			if (!blob) {
				return;
			}
			await navigator.clipboard.write([
				new ClipboardItem({
					'image/png': blob,
				}),
			]);
			this.emit('notify', {
				itemType: 'copy',
				message: 'QR code copied as a PNG image.',
				title: 'QR Copied',
			});
		} catch (copyError) {
			this.emit('notify', {
				itemType: 'error',
				message: copyError?.message || 'Could not copy QR image.',
				title: 'Copy Failed',
			});
		}
	}
	async handleDownload(domEvent) {
		domEvent?.stopPropagation?.();
		if (!this.state.renderedAddress) {
			return;
		}
		try {
			const blob = await this.buildExportPngBlob();
			if (!blob) {
				return;
			}
			const shortName = this.state.renderedAddress.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 16) || 'wallet';
			triggerDownload(blob, `viat-${shortName}.png`);
			this.emit('notify', {
				itemType: 'copy',
				message: 'QR code saved as PNG.',
				title: 'QR Downloaded',
			});
		} catch (downloadError) {
			this.emit('notify', {
				itemType: 'error',
				message: downloadError?.message || 'Could not save QR image.',
				title: 'Download Failed',
			});
		}
	}
	downloadIconState() {
		return {
			name: 'download',
			size: 'sm',
		};
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class=${() => `wq-wrap${this.state.svg ? ' is-ready' : ' is-empty'}`}>
				<div class="wq-canvas"
					role="button"
					tabindex="0"
					tooltip="Click to copy image"
					@click=${this.handleCopyImage}>
					<div class="wq-frame">
						${() => this.state.svg || '<div class="wq-empty-msg">no address</div>'}
					</div>
				</div>
				<button class="wq-download"
					type="button"
					?disabled=${() => !this.state.renderedAddress}
					@click=${this.handleDownload}>
					<ui-icon class="wq-download-icon" .state=${this.downloadIconState}></ui-icon>
					<span class="wq-download-label">Download</span>
				</button>
			</div>
		`;
	}
}
customElements.define('wallet-qr', WalletQr);
