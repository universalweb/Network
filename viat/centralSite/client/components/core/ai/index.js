import './tools.js';
export {
	describeComponent,
	inspect,
	queryByLabel,
	queryByTag,
	resolveByIdOrPath,
	resolveReference,
	sanitize,
} from './descriptors.js';
export { AIHost, host } from './host.js';
export {
	aiMethods,
	applyAiMixin,
} from './mixin.js';
export {
	getDirectChildren,
	getNameForComponent,
	getPathForComponent,
	getRootComponents,
	invalidatePathIndex,
	listPaths,
	pageOverview,
	peek,
	resolvePath,
} from './paths.js';
export {
	check,
	grant,
	reset as resetPermissions,
	revoke,
	setDefaultMutatingPolicy,
	setPolicy,
	setPrompt,
} from './permissions.js';
export {
	dispatch,
	ERROR_CODES,
	getMethod,
	makeError,
	registerMethod,
} from './protocol.js';
export {
	componentEntries,
	defineGlobalTool,
	defineInstanceTool,
	defineTagTool,
	eachComponent,
	getComponentById,
	getComponentId,
	getStats,
	getTools,
	listAllTools,
	listComponents,
	registerComponent,
	subscribe,
	unregisterComponent,
} from './registry.js';
export { defineTool } from './tools.js';
export { LocalTransport } from './transports/local.js';
export {
	detectMcp,
	getMcpToolDescriptors,
	WebMCPTransport,
} from './transports/webmcp.js';
export { WebRTCTransport } from './transports/webrtc.js';
export { WebSocketTransport } from './transports/websocket.js';
export {
	clearHighlights,
	highlight,
	textPageMap,
	visualPageMap,
} from './visual.js';
