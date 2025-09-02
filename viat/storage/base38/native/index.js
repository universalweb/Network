import { createRequire } from 'node:module';

const requireFn = createRequire(import.meta.url);
const binding = requireFn('./index.node');

// Prefer snake_case; fall back to camelCase if napi renamed it
const encode = binding.encode_base38 ?? binding.encodeBase38 ?? binding.encode;
const decode = binding.decode_base38 ?? binding.decodeBase38 ?? binding.decode;

const api = {
	encodeBase38: encode,
	decodeBase38: decode
};
export default api;
export { encode as encodeBase38, decode as decodeBase38 };
