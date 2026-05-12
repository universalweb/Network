import { Logger } from '../../debug/logger.js';
const DEFAULT_ICE = [{
	urls: 'stun:stun.l.google.com:19302',
}];
export class WebRTCTransport {
	constructor({
		signalingUrl,
		iceServers = DEFAULT_ICE,
		token,
		channelLabel = 'ai',
		signalingProtocol,
	}) {
		if (!signalingUrl) {
			throw new TypeError('WebRTCTransport requires signalingUrl');
		}
		this.signalingUrl = signalingUrl;
		this.iceServers = iceServers;
		this.token = token;
		this.channelLabel = channelLabel;
		this.signalingProtocol = signalingProtocol;
		this.pc = null;
		this.channel = null;
		this.signal = null;
		this.alive = true;
		this.onRequest = null;
		this.pendingCandidates = [];
		this.remoteSet = false;
	}
	buildSignalingUrl() {
		if (!this.token) {
			return this.signalingUrl;
		}
		const sep = this.signalingUrl.includes('?') ? '&' : '?';
		return `${this.signalingUrl}${sep}token=${encodeURIComponent(this.token)}`;
	}
	async start({ onRequest }) {
		this.onRequest = onRequest;
		await this.openSignaling();
		this.pc = new RTCPeerConnection({
			iceServers: this.iceServers,
		});
		this.pc.addEventListener('icecandidate', (event) => {
			if (event.candidate) {
				this.sendSignal({
					type: 'ice',
					candidate: event.candidate.toJSON(),
				});
			}
		});
		this.pc.addEventListener('connectionstatechange', () => {
			Logger.info('ai-rtc', `pc state ${this.pc?.connectionState}`);
		});
		this.pc.addEventListener('datachannel', (event) => {
			this.bindChannel(event.channel);
		});
		const channel = this.pc.createDataChannel(this.channelLabel, {
			ordered: true,
		});
		this.bindChannel(channel);
		const offer = await this.pc.createOffer();
		await this.pc.setLocalDescription(offer);
		this.sendSignal({
			type: 'offer',
			sdp: offer.sdp,
		});
	}
	bindChannel(channel) {
		channel.binaryType = 'arraybuffer';
		channel.addEventListener('open', () => {
			Logger.info('ai-rtc', 'data channel open');
		});
		channel.addEventListener('close', () => {
			Logger.info('ai-rtc', 'data channel closed');
		});
		channel.addEventListener('message', async (event) => {
			let message;
			try {
				message = JSON.parse(event.data);
			} catch (error) {
				Logger.warn('ai-rtc', 'parse error', error);
				return;
			}
			if (!message || message.jsonrpc !== '2.0') {
				return;
			}
			if (!message.method) {
				return;
			}
			const reply = await this.onRequest(message);
			if (reply) {
				this.send(reply);
			}
		});
		this.channel = channel;
	}
	openSignaling() {
		return new Promise((resolve, reject) => {
			const ws = new WebSocket(this.buildSignalingUrl(), this.signalingProtocol);
			this.signal = ws;
			ws.addEventListener('open', () => {
				resolve();
			});
			ws.addEventListener('error', (event) => {
				reject(event);
			});
			ws.addEventListener('message', async (event) => {
				let message;
				try {
					message = JSON.parse(event.data);
				} catch (error) {
					Logger.warn('ai-rtc-sig', 'parse error', error);
					return;
				}
				await this.handleSignal(message);
			});
			ws.addEventListener('close', () => {
				Logger.info('ai-rtc-sig', 'signal closed');
			});
		});
	}
	async handleSignal(message) {
		if (!this.pc) {
			return;
		}
		if (message.type === 'answer') {
			await this.pc.setRemoteDescription({
				type: 'answer',
				sdp: message.sdp,
			});
			this.remoteSet = true;
			while (this.pendingCandidates.length) {
				const candidate = this.pendingCandidates.shift();
				try {
					await this.pc.addIceCandidate(candidate);
				} catch (error) {
					Logger.warn('ai-rtc-sig', 'addIceCandidate failed', error);
				}
			}
			return;
		}
		if (message.type === 'ice' && message.candidate) {
			if (!this.remoteSet) {
				this.pendingCandidates.push(message.candidate);
				return;
			}
			try {
				await this.pc.addIceCandidate(message.candidate);
			} catch (error) {
				Logger.warn('ai-rtc-sig', 'addIceCandidate failed', error);
			}
		}
	}
	sendSignal(message) {
		if (this.signal?.readyState === WebSocket.OPEN) {
			this.signal.send(JSON.stringify(message));
		}
	}
	send(message) {
		if (this.channel?.readyState !== 'open') {
			return false;
		}
		try {
			this.channel.send(JSON.stringify(message));
			return true;
		} catch (error) {
			Logger.warn('ai-rtc', 'send error', error);
			return false;
		}
	}
	notify(message) {
		this.send(message);
	}
	stop() {
		this.alive = false;
		try {
			this.channel?.close();
		} catch (error) {
			Logger.warn('ai-rtc', 'channel close error', error);
		}
		try {
			this.pc?.close();
		} catch (error) {
			Logger.warn('ai-rtc', 'pc close error', error);
		}
		try {
			this.signal?.close();
		} catch (error) {
			Logger.warn('ai-rtc', 'signal close error', error);
		}
		this.channel = null;
		this.pc = null;
		this.signal = null;
		this.onRequest = null;
		this.pendingCandidates = [];
		this.remoteSet = false;
	}
}
