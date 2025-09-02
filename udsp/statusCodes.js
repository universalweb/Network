/*
	Short codes (0–9) are used for the most common success or simple error states → ultra-compact.
	Short Codes for 10-99 are still compact but allow for more specific categorization for other short codes.
	Hierarchical codes (100+) preserve layer → nature → specific taxonomy.
	Comments above each line improve readability and maintainability.
	On the wire (CBOR/varint), short codes are 1 byte, longer codes use efficient varint encoding, no leading zeros required.
 */
export const statusCodes = {
	// Success codes
	// Operation completed successfully
	OK: 0,
	// Request accepted for asynchronous processing
	ACCEPTED: 1,
	// Partial success: some data processed, some failed
	PARTIAL_SUCCESS: 2,
	// Success with non-fatal warnings
	SUCCESS_WITH_WARNING: 3,
	// No content to return, operation succeeded
	NO_CONTENT: 4,
	// Heartbeat or keep-alive signal
	KEEP_ALIVE: 5,
	// Processing in progress, do not retry yet
	PROCESSING: 6,
	// Short common error codes
	// Requested resource could not be found
	NOT_FOUND: 2,
	// Bad request, invalid input
	INVALID_REQUEST: 3,
	// Unauthorized access attempt
	UNAUTHORIZED: 4,
	// Forbidden: valid request but permission denied
	FORBIDDEN: 7,
	// Timeout or network connectivity issue
	TIMEOUT: 5,
	// Resource or quota exceeded
	RESOURCE_EXCEEDED: 9,
	// Generic server/system error
	SERVER_ERROR: 8,
	// Transport layer errors (1xx in hierarchical model)
	// Malformed transport packet
	TRANSPORT_MALFORMED: 111,
	// Invalid transport sequence or semantic error
	TRANSPORT_SEMANTIC: 112,
	// Unsupported transport feature
	TRANSPORT_UNSUPPORTED_OPTION: 113,
	// Transport resource exhausted (buffer full, congestion)
	TRANSPORT_RESOURCE: 114,
	// Transport-level security/integrity failure
	TRANSPORT_SECURITY: 115,
	// Connectivity problem (unreachable, NAT blocked)
	TRANSPORT_CONNECTIVITY: 116,
	// Protocol/session layer errors (2xx)
	// Bad handshake format
	PROTOCOL_INVALID_HANDSHAKE: 211,
	// Invalid session state or token
	PROTOCOL_SESSION_INVALID: 212,
	// Protocol version mismatch or unsupported extension
	PROTOCOL_VERSION_MISMATCH: 223,
	// Protocol resource exhausted (too many sessions)
	PROTOCOL_RESOURCE_LIMIT: 224,
	// Protocol security/auth failure
	PROTOCOL_SECURITY: 225,
	// Connectivity problem during protocol/session
	PROTOCOL_CONNECTIVITY: 226,
	// Application layer errors (3xx)
	// Requested resource not found
	APPLICATION_NOT_FOUND: 332,
	// Application received invalid request
	APPLICATION_INVALID_REQUEST: 311,
	// Feature not supported by application
	APPLICATION_UNSUPPORTED_FEATURE: 333,
	// Rate limit exceeded
	APPLICATION_RATE_LIMITED: 334,
	// Access forbidden
	APPLICATION_FORBIDDEN: 335,
	// Service unavailable
	APPLICATION_UNAVAILABLE: 336,
	// Security/identity layer errors (4xx)
	// Bad signature or data integrity failure
	SECURITY_BAD_SIGNATURE: 445,
	// Expired or invalid certificate
	SECURITY_EXPIRED_CERT: 442,
	// Unauthorized access attempt
	SECURITY_UNAUTHORIZED: 435,
	// Replay attack detected
	SECURITY_REPLAY_DETECTED: 466,
	// System/resource layer errors (5xx)
	// Internal system error
	SYSTEM_INTERNAL_ERROR: 520,
	// Out of memory or disk space
	SYSTEM_OUT_OF_MEMORY: 554,
	// Resource or quota exceeded
	SYSTEM_RESOURCE_EXCEEDED: 544,
	// Feature not implemented
	SYSTEM_NOT_IMPLEMENTED: 553,
	// Routing/connectivity layer errors (6xx)
	// No path to peer
	ROUTING_NO_PATH: 666,
	// Routing loop detected
	ROUTING_LOOP_DETECTED: 662,
	// Routing cache full or buffer exhausted
	ROUTING_CACHE_FULL: 664,
};
export default statusCodes;
