import { defaultLogger } from '../../debug/logger.js';
const DEFAULT_ICE = [
	{
		urls: 'stun:stun.l.google.com:19302',
	},
];
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
		this.signalReady = null;
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
		this.pc.addEventListener('icecandidate', this);
		this.pc.addEventListener('connectionstatechange', this);
		this.pc.addEventListener('datachannel', this);
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
		channel.addEventListener('open', this);
		channel.addEventListener('close', this);
		channel.addEventListener('message', this);
		this.channel = channel;
	}
	openSignaling() {
		const ws = new WebSocket(this.buildSignalingUrl(), this.signalingProtocol);
		this.signal = ws;
		const pending = Promise.withResolvers();
		this.signalReady = pending;
		ws.addEventListener('open', this);
		ws.addEventListener('error', this);
		ws.addEventListener('message', this);
		ws.addEventListener('close', this);
		return pending.promise;
	}
	/*
	 * The transport is the sole listener for all three targets (handleEvent
	 * contract — zero handler closures); events route by currentTarget first
	 * (signal WS and data channel share event-type names), then by type.
	 */
	handleEvent(rtcEvent) {
		if (rtcEvent.currentTarget === this.signal) {
			return this.handleSignalEvent(rtcEvent);
		}
		if (rtcEvent.currentTarget === this.pc) {
			return this.handlePeerEvent(rtcEvent);
		}
		return this.handleChannelEvent(rtcEvent);
	}
	handleSignalEvent(signalEvent) {
		if (signalEvent.type === 'message') {
			return this.handleSignalMessage(signalEvent);
		}
		if (signalEvent.type === 'open') {
			this.signalReady?.resolve();
			this.signalReady = null;
			return;
		}
		if (signalEvent.type === 'error') {
			this.signalReady?.reject(signalEvent);
			this.signalReady = null;
			return;
		}
		if (signalEvent.type === 'close') {
			defaultLogger.info('ai-rtc-sig', 'signal closed');
		}
	}
	async handleSignalMessage(messageEvent) {
		let message;
		try {
			message = JSON.parse(messageEvent.data);
		} catch (error) {
			defaultLogger.warn('ai-rtc-sig', 'parse error', error);
			return;
		}
		await this.handleSignal(message);
	}
	handlePeerEvent(peerEvent) {
		if (peerEvent.type === 'icecandidate') {
			if (peerEvent.candidate) {
				this.sendSignal({
					type: 'ice',
					candidate: peerEvent.candidate.toJSON(),
				});
			}
			return;
		}
		if (peerEvent.type === 'datachannel') {
			this.bindChannel(peerEvent.channel);
			return;
		}
		if (peerEvent.type === 'connectionstatechange') {
			defaultLogger.info('ai-rtc', `pc state ${this.pc?.connectionState}`);
		}
	}
	handleChannelEvent(channelEvent) {
		if (channelEvent.type === 'message') {
			return this.handleChannelMessage(channelEvent);
		}
		if (channelEvent.type === 'open') {
			defaultLogger.info('ai-rtc', 'data channel open');
			return;
		}
		if (channelEvent.type === 'close') {
			defaultLogger.info('ai-rtc', 'data channel closed');
		}
	}
	async handleChannelMessage(messageEvent) {
		let message;
		try {
			message = JSON.parse(messageEvent.data);
		} catch (error) {
			defaultLogger.warn('ai-rtc', 'parse error', error);
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
					defaultLogger.warn('ai-rtc-sig', 'addIceCandidate failed', error);
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
				defaultLogger.warn('ai-rtc-sig', 'addIceCandidate failed', error);
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
			defaultLogger.warn('ai-rtc', 'send error', error);
			return false;
		}
	}
	notify(message) {
		this.send(message);
	}
	stop() {
		this.alive = false;
		// Argless close() on channel/pc/socket has no throw path (spec) — no guards.
		this.channel?.close();
		this.pc?.close();
		this.signal?.close();
		this.channel = null;
		this.pc = null;
		this.signal = null;
		this.signalReady = null;
		this.onRequest = null;
		this.pendingCandidates = [];
		this.remoteSet = false;
	}
}
