import { decode, encode as encodeCBOR } from 'cbor-x';
const canonicalSerializationOptions = {
	canonical: true,
};
export function encodeSync(data) {
	return encodeCBOR(data, canonicalSerializationOptions);
}
export { decode };
