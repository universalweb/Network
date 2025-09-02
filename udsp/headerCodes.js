export const UDSP_HEADERS = {
	// ====================
	// Short / compact headers (1–9)
	// SERIALIZED IN CBOR or JSON ETC
	SERIALIZE: 0,
	// Content-Type of payload
	CONTENT_TYPE: 1,
	// Content-Length of payload
	CONTENT_LENGTH: 2,
	// Host / domain name
	HOST: 3,
	// Request method / operation type
	METHOD: 4,
	// Status code of response
	STATUS: 5,
	// User-Agent / client info
	USER_AGENT: 6,
	// Authorization token / credentials
	AUTHORIZATION: 7,
	// Date / timestamp
	DATE: 8,
	// Accept types (MIME types)
	ACCEPT: 9,
	// ====================
	// Transport headers (1xx)
	// Packet sequence number
	TRANSPORT_SEQ: 110,
	// Transport congestion / flow info
	TRANSPORT_FLOW: 114,
	// Transport-level connection state
	TRANSPORT_STATE: 115,
	// ====================
	// Protocol / Session headers (2xx)
	// Session token or handshake ID
	SESSION_ID: 210,
	// Protocol version being used
	PROTOCOL_VERSION: 213,
	// Capability flags for negotiation
	CAPABILITIES: 214,
	// Session timeout or expiry
	SESSION_TIMEOUT: 215,
	// ====================
	// Application headers (3xx)
	// Partial response indicator
	PARTIAL: 330,
	// Request method / operation type
	METHOD_ADVANCED: 331,
	// Content type of payload (hierarchical)
	CONTENT_TYPE_HIER: 332,
	// Content length of payload (hierarchical)
	CONTENT_LENGTH_HIER: 333,
	// Response status code (hierarchical)
	STATUS_HIER: 335,
	// Redirect / Location header
	LOCATION: 336,
	// Accept-Encoding (gzip, deflate)
	ACCEPT_ENCODING: 338,
	// Referer header
	REFERER: 339,
	// ====================
	// Security / Identity headers (4xx)
	// Peer signature / integrity check
	SIGNATURE: 410,
	// Nonce for replay protection
	NONCE: 412,
	// Authorization / auth token (hierarchical)
	AUTHORIZATION_HIER: 415,
	// Expired / invalid certificate info
	CERT_EXPIRED: 416,
	// ====================
	// System / QoS / Metadata headers (5xx)
	// Priority or QoS info
	PRIORITY: 520,
	// Metadata / custom free-form info
	METADATA: 521,
	// Rate limit info
	RATE_LIMIT: 522,
	// Server / system version
	SYSTEM_VERSION: 523,
	// ====================
	// Routing / Peer headers (6xx)
	// Peer ID for sender or receiver
	PEER_ID: 610,
	// Route path / hops
	ROUTE_PATH: 611,
	// Route latency / metrics
	ROUTE_METRICS: 612,
	// Peer status / connectivity info
	PEER_STATUS: 613,
};
export default UDSP_HEADERS;
