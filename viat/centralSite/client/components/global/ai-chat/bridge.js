/*
 * OpenAI-compatible streaming chat transport — the "bridge client". Framework-
 * free and Node-testable: pure fetch + SSE parsing, no webcomponent import.
 *
 * Configured by a single BASE URL (`…/v1`, the installation0 Grok-bridge style);
 * the chat-completions and models endpoints are derived from it. Handles the
 * full client surface a bridge needs:
 *   - streaming `content`            → the visible answer
 *   - streaming `reasoning_content`  → the agent's thinking (collapsible)
 *   - GET /models                    → liveness probe + discovery
 *   - AbortSignal                    → stop mid-stream
 * OpenAI-native `tool_calls` deltas and vision parts are out of scope here
 * (extension points) — the surface above is what the bridge streams.
 */
const SSE_DELIMITER = '\n\n';
const SSE_DATA_PREFIX = 'data:';
const SSE_DONE = '[DONE]';
const COMPLETIONS_SUFFIX = '/chat/completions';
// Accept either a base url (`…/v1`) or a full completions url and reduce to the
// base, so callers can configure whichever they have without a footgun.
function normalizeBase(url) {
	let base = String(url ?? '').trim().replace(/\/+$/, '');
	if (base.endsWith(COMPLETIONS_SUFFIX)) {
		base = base.slice(0, -COMPLETIONS_SUFFIX.length);
	}
	return base;
}
export function completionsUrl(url) {
	const base = normalizeBase(url);
	return base ? `${base}${COMPLETIONS_SUFFIX}` : '';
}
export function modelsUrl(url) {
	const base = normalizeBase(url);
	return base ? `${base}/models` : '';
}
// Liveness probe — a 200 from GET /models means the bridge is up (and lists the
// loaded models). Network failure / abort resolves false rather than throwing so
// the caller can treat it as a simple offline signal.
export async function probeModels(url, signal) {
	const target = modelsUrl(url);
	if (!target) {
		return false;
	}
	try {
		const response = await fetch(target, {
			method: 'GET',
			signal,
		});
		return response.ok;
	} catch {
		return false;
	}
}
function parseSseEvent(eventText) {
	const lines = eventText.split('\n');
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
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
// Route one parsed SSE chunk's delta to the content / reasoning sinks.
function dispatchDelta(parsed, onContent, onReasoning) {
	const delta = parsed?.choices?.[0]?.delta;
	if (!delta) {
		return;
	}
	if (delta.content) {
		onContent(delta.content);
	}
	if (delta.reasoning_content) {
		onReasoning(delta.reasoning_content);
	}
}
/**
 * POST a chat-completions request and stream the reply: content deltas go to
 * `onContent(text)`, reasoning deltas to `onReasoning(text)`. Resolves at [DONE]
 * or stream end; rejects on a non-OK response, missing body, or abort.
 * @param {object} options - `{ url, payload, signal?, onContent, onReasoning }`.
 */
export async function streamChat(options) {
	const {
		url,
		payload,
		signal,
		onContent,
		onReasoning,
	} = options;
	const response = await fetch(completionsUrl(url), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
		signal,
	});
	if (!response.ok || !response.body) {
		throw new Error(`bridge responded ${response.status}`);
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder('utf-8');
	let buffer = '';
	while (true) {
		const chunk = await reader.read();
		if (chunk.done) {
			return;
		}
		buffer += decoder.decode(chunk.value, {
			stream: true,
		});
		let sepIndex = buffer.indexOf(SSE_DELIMITER);
		while (sepIndex !== -1) {
			const eventText = buffer.slice(0, sepIndex);
			buffer = buffer.slice(sepIndex + SSE_DELIMITER.length);
			const parsed = parseSseEvent(eventText);
			if (parsed === SSE_DONE) {
				return;
			}
			dispatchDelta(parsed, onContent, onReasoning);
			sepIndex = buffer.indexOf(SSE_DELIMITER);
		}
	}
}
