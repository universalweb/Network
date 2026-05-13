import '../ai-status-indicator/ai-status-indicator.js';
import { WebComponent, each } from '../../../core/index.js';
import { listAllTools } from '../../../core/ai/index.js';
const DEFAULT_ENDPOINT = 'http://localhost:1234/v1/chat/completions';
const DEFAULT_MODEL = 'local-model';
const SSE_DELIMITER = '\n\n';
const SSE_DATA_PREFIX = 'data:';
const SSE_DONE = '[DONE]';
const PRIMING_USER_MESSAGE = 'Acknowledge that you have received the page map and the tool list above. Reply in ONE short sentence (under 20 words) inviting me to give a command. Do not enumerate the page or the tools.';
const VIAT_CMD_REGEX = /\$VIAT\.CMD\[\s*([A-Za-z_][\w-]*)\s*,\s*([^\],]+?)\s*\]/g;
const MAX_TOOL_ROUND_TRIPS = 5;
function parseViatCommands(text) {
	if (!text) {
		return [];
	}
	const out = [];
	const seen = new Set();
	VIAT_CMD_REGEX.lastIndex = 0;
	let match = VIAT_CMD_REGEX.exec(text);
	while (match !== null) {
		const name = match[1];
		const callId = match[2].trim();
		const key = `${name}|${callId}`;
		if (!seen.has(key)) {
			seen.add(key);
			out.push({
				name,
				callId,
			});
		}
		match = VIAT_CMD_REGEX.exec(text);
	}
	return out;
}
function formatAiResponse(name, callId, value) {
	const payload = value === undefined ? 'null' : JSON.stringify(value);
	return `$AI.CMD[${name}, ${callId}, ${payload}]`;
}
function formatToolList(tools) {
	if (!tools.length) {
		return '(no tools registered)';
	}
	const lines = [];
	for (let i = 0; i < tools.length; i++) {
		const tool = tools[i];
		const mutTag = tool.mutating ? ' (mutating)' : '';
		lines.push(`- ${tool.name}${mutTag}: ${tool.description || '(no description)'}`);
		lines.push(`  input: ${JSON.stringify(tool.inputSchema)}`);
	}
	return lines.join('\n');
}
function buildSystemPrompt(pageMapText, toolsText) {
	return [
		'You are the LOCAL AGENT for Viat — a post-quantum cryptocurrency on the Universal Web. You are embedded in the Viat Wallet client and run on the user\'s own machine. Be concise, direct, and helpful.',
		'',
		'COMMAND PROTOCOL',
		'To activate a command or call a tool in the browser, emit a token of the form:',
		'  $VIAT.CMD[<COMMAND_NAME>, <COMMAND_UNIQUE_ID>]',
		'',
		'COMMAND_NAME is the action or tool to invoke (see the AVAILABLE TOOLS list below, or use page-aware verbs like highlight, focus, click, inspect, navigate).',
		'COMMAND_UNIQUE_ID is a short, unique identifier you generate so you can match the response to your request.',
		'',
		'The browser will execute the command and reply with a message in the form:',
		'  $AI.CMD[<COMMAND_NAME>, <COMMAND_UNIQUE_ID>, <ANSWER>]',
		'',
		'<ANSWER> is the JSON-encoded result of the command (or {"error":"…"} on failure). Match the COMMAND_UNIQUE_ID exactly between request and response. You may have multiple in-flight commands; each is tracked by its ID. Emit one command per line. Plain prose around the command tokens is fine.',
		'',
		'PAGE OVERVIEW',
		'The Viat Wallet client is composed of Universal Web Components. Every component is agent-addressable. The live tree below is your map of the page. Refer to components by their path (e.g. `view.dashboard.panel`).',
		'',
		pageMapText,
		'',
		'AVAILABLE TOOLS',
		'These tools are registered in the page right now. Invoke any of them via $VIAT.CMD[<tool name>, <id>].',
		'',
		toolsText,
		'',
		'WORKED EXAMPLE — getting the wallet amount',
		'User: "What is my wallet amount?"',
		'You emit (exactly this token, on its own line):',
		'  $VIAT.CMD[getWalletAmount, w1]',
		'The browser will reply with:',
		'  $AI.CMD[getWalletAmount, w1, {"amount":"250,000","amountFull":"250,000.000000000.000000000"}]',
		'You then read the JSON ANSWER and reply to the user in plain language, e.g. "Your wallet holds 250,000 VIAT." Generate a fresh unique id (e.g. w1, w2, …) for every call so concurrent responses can be matched.',
		'',
		'When the user asks you to do something else, locate the target in the map above, pick the right tool or command, then emit the $VIAT.CMD[…] token. Wait for the matching $AI.CMD[…] reply before claiming the action succeeded.',
	].join('\n');
}
class AIChatMessage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		message: './ai-chat-message.css',
	};
	static state = {
		id: '',
		role: 'user',
		content: '',
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="${() => {
				return `aim aim-${this.state.role}`;
			}}">
				<div class="aim-role">${() => {
					return (this.state.role === 'user' ? 'YOU' : 'AI');
				}}</div>
				<div class="aim-content">${this.state.content}</div>
			</div>
		`;
	}
}
customElements.define('ai-chat-message', AIChatMessage);
export class AIChat extends WebComponent {
	static url = import.meta.url;
	static styles = {
		chat: './ai-chat.css',
	};
	static state = {
		endpoint: DEFAULT_ENDPOINT,
		model: DEFAULT_MODEL,
		messages: [],
		inputValue: '',
		streaming: false,
		errorText: '',
		systemPrompt: '',
		connectionStatus: 'unknown',
	};
	controller = null;
	messageSeq = 0;
	onMount() {
		this.delegate('pulldown:open', this.handlePulldownOpen);
		this.refreshSystemPrompt();
	}
	onDisconnect() {
		this.controller?.abort();
		this.controller = null;
		this.state.streaming = false;
	}
	handlePulldownOpen = () => {
		this.refreshSystemPrompt();
		this.maybePrime();
	};
	refreshSystemPrompt() {
		const map = this.findPageRoot().aiMap();
		const tools = formatToolList(listAllTools());
		this.state.systemPrompt = buildSystemPrompt(map, tools);
	}
	indicatorState() {
		return {
			status: this.state.connectionStatus,
		};
	}
	hasAssistantReply() {
		const list = this.state.messages;
		for (let i = 0; i < list.length; i++) {
			const msg = list[i];
			if (msg.role === 'assistant' && msg.content) {
				return true;
			}
		}
		return false;
	}
	maybePrime() {
		if (this.state.streaming) {
			return;
		}
		if (this.hasAssistantReply()) {
			return;
		}
		this.state.errorText = '';
		this.pushMessage('user', PRIMING_USER_MESSAGE, {
			hidden: true,
		});
		this.streamReply(0).catch((streamErr) => {
			return this.handleStreamError(streamErr);
		});
	}
	runCommand(cmd) {
		const root = this.findPageRoot();
		const tools = root.aiTools();
		const def = tools.get(cmd.name);
		if (!def) {
			return Promise.resolve(formatAiResponse(cmd.name, cmd.callId, {
				error: `Unknown tool "${cmd.name}"`,
			}));
		}
		const invocation = Promise.resolve(def.handler({
			component: root,
			args: {},
			ctx: {
				source: 'ai-chat',
			},
		}));
		return invocation
			.then((value) => {
				return formatAiResponse(cmd.name, cmd.callId, value);
			})
			.catch((toolErr) => {
				return formatAiResponse(cmd.name, cmd.callId, {
					error: toolErr?.message ?? 'Tool error',
				});
			});
	}
	async dispatchCommandsIn(assistantId, depth) {
		if (depth >= MAX_TOOL_ROUND_TRIPS) {
			return;
		}
		const list = this.state.messages;
		let msg = null;
		for (let i = list.length - 1; i >= 0; i--) {
			if (list[i].id === assistantId) {
				msg = list[i];
				break;
			}
		}
		if (!msg || !msg.content) {
			return;
		}
		const commands = parseViatCommands(msg.content);
		if (!commands.length) {
			return;
		}
		const responses = await Promise.all(commands.map((cmd) => {
			return this.runCommand(cmd);
		}));
		const replyText = responses.join('\n');
		console.log('[AI ROUND-TRIP]', {
			depth,
			commands,
			replyText,
		});
		this.pushMessage('user', replyText, {
			hidden: true,
		});
		await this.streamReply(depth + 1).catch((streamErr) => {
			return this.handleStreamError(streamErr);
		});
	}
	findPageRoot() {
		let cursor = this;
		while (true) {
			const rootNode = cursor.getRootNode();
			const host = rootNode instanceof ShadowRoot ? rootNode.host : null;
			if (!host || typeof host.aiMap !== 'function') {
				return cursor;
			}
			cursor = host;
		}
	}
	onRendered() {
		const logEl = this.refs.log;
		if (logEl) {
			logEl.scrollTop = logEl.scrollHeight;
		}
	}
	nextId() {
		this.messageSeq += 1;
		return `m${this.messageSeq}`;
	}
	pushMessage(role, content, opts) {
		const id = this.nextId();
		const msg = {
			id,
			role,
			content,
		};
		if (opts?.hidden) {
			msg.hidden = true;
		}
		this.state.messages.push(msg);
		return id;
	}
	replaceContent(id, content) {
		const list = this.state.messages;
		for (let i = list.length - 1; i >= 0; i--) {
			if (list[i].id === id) {
				list[i] = {
					...list[i],
					content,
				};
				return;
			}
		}
	}
	visibleMessages() {
		const list = this.state.messages;
		const out = [];
		for (let i = 0; i < list.length; i++) {
			if (!list[i].hidden) {
				out.push(list[i]);
			}
		}
		return out;
	}
	buildPayload(excludeId) {
		const list = this.state.messages;
		const out = [];
		if (this.state.systemPrompt) {
			out.push({
				role: 'system',
				content: this.state.systemPrompt,
			});
		}
		for (let i = 0; i < list.length; i++) {
			const msg = list[i];
			if (msg.id === excludeId) {
				continue;
			}
			out.push({
				role: msg.role,
				content: msg.content,
			});
		}
		return {
			model: this.state.model,
			messages: out,
			stream: true,
		};
	}
	handleSubmit() {
		if (this.state.streaming) {
			this.handleAbort();
			return;
		}
		this.handleSend();
	}
	handleSend() {
		const text = this.state.inputValue.trim();
		if (!text) {
			return;
		}
		this.state.inputValue = '';
		this.state.errorText = '';
		this.pushMessage('user', text);
		this.streamReply(0).catch((streamErr) => {
			return this.handleStreamError(streamErr);
		});
	}
	handleAbort() {
		this.controller?.abort();
		this.controller = null;
		this.state.streaming = false;
	}
	handleStreamError(streamErr) {
		if (streamErr?.name === 'AbortError') {
			return;
		}
		this.state.connectionStatus = 'offline';
		this.state.streaming = false;
		this.controller = null;
	}
	handleKeyDown(domEvent) {
		if (domEvent.key === 'Enter' && !domEvent.shiftKey) {
			domEvent.preventDefault();
			this.handleSend();
		}
	}
	handleClear() {
		this.handleAbort();
		this.state.messages = [];
		this.state.errorText = '';
	}
	async streamReply(depth = 0) {
		this.state.streaming = true;
		this.state.connectionStatus = 'connecting';
		const controller = new AbortController();
		this.controller = controller;
		const payload = this.buildPayload(null);
		let response;
		try {
			response = await fetch(this.state.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
				signal: controller.signal,
			});
		} catch (fetchErr) {
			if (fetchErr?.name !== 'AbortError') {
				this.state.connectionStatus = 'offline';
			}
			this.state.streaming = false;
			this.controller = null;
			return;
		}
		if (!response.ok) {
			this.state.connectionStatus = 'offline';
			this.state.streaming = false;
			this.controller = null;
			return;
		}
		if (!response.body) {
			this.state.connectionStatus = 'offline';
			this.state.streaming = false;
			this.controller = null;
			return;
		}
		this.state.connectionStatus = 'online';
		const assistantId = this.pushMessage('assistant', '');
		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');
		let buffer = '';
		let accumulated = '';
		let finished = false;
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) {
				break;
			}
			buffer += decoder.decode(chunk.value, {
				stream: true,
			});
			let sepIndex = buffer.indexOf(SSE_DELIMITER);
			while (sepIndex !== -1) {
				const eventText = buffer.slice(0, sepIndex);
				buffer = buffer.slice(sepIndex + SSE_DELIMITER.length);
				const parsed = this.parseSseEvent(eventText);
				if (parsed === SSE_DONE) {
					finished = true;
					break;
				}
				if (parsed) {
					const delta = parsed?.choices?.[0]?.delta?.content;
					if (delta) {
						accumulated += delta;
						this.replaceContent(assistantId, accumulated);
					}
				}
				sepIndex = buffer.indexOf(SSE_DELIMITER);
			}
			if (finished) {
				break;
			}
		}
		this.state.streaming = false;
		this.controller = null;
		await this.dispatchCommandsIn(assistantId, depth);
	}
	parseSseEvent(eventText) {
		const lines = eventText.split('\n');
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (!line.startsWith(SSE_DATA_PREFIX)) {
				continue;
			}
			const payload = line.slice(SSE_DATA_PREFIX.length).trim();
			if (payload === SSE_DONE) {
				return SSE_DONE;
			}
			if (!payload) {
				return null;
			}
			return JSON.parse(payload);
		}
		return null;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="ai-chat">
				<header class="aic-header">
					<div class="aic-titlebar">
						<div class="aic-title-group">
							<span class="aic-title">LOCAL AI</span>
							<ai-status-indicator .state=${this.indicatorState}></ai-status-indicator>
						</div>
						<button class="aic-clear" @click=${this.handleClear} ?disabled=${this.state.messages.length === 0 && !this.state.streaming}>CLEAR</button>
					</div>
					<span class="aic-endpoint">${this.state.endpoint}</span>
				</header>
				<div #log class="aic-log">
					${() => {
						return each(this.visibleMessages(), AIChatMessage, (msg) => {
							return msg.id;
						});
					}}
				</div>
				<div class="${() => {
					return `aic-error${this.state.errorText ? ' is-visible' : ''}`;
				}}">${this.state.errorText}</div>
				<footer class="aic-input-row">
					<textarea #input
						name="local-ai-input"
						class="aic-input"
						placeholder="Message local AI…"
						rows="2"
						@bind="inputValue"
						?disabled=${this.state.streaming}
						@keydown=${this.handleKeyDown}></textarea>
					<button class="${() => {
						return `aic-btn${this.state.streaming ? ' is-streaming' : ''}`;
					}}" @click=${this.handleSubmit}>
						${() => {
							return (this.state.streaming ? 'STOP' : 'SEND');
						}}
					</button>
				</footer>
			</div>
		`;
	}
}
customElements.define('ai-chat', AIChat);
