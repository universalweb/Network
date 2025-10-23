import { decode, encode as encodeCBOR } from 'cbor2';
const canonicalSerializationOptions = {
	cde: true,
};
export function encodeSync(data) {
	return encodeCBOR(data, canonicalSerializationOptions);
}
export { decode };
