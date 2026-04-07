import { decode, encode } from 'cbor2';
const canonicalSerializationOptions = {
	cde: true,
};
export function encodeSync(data) {
	return encode(data, canonicalSerializationOptions);
}
export { decode, encode };
