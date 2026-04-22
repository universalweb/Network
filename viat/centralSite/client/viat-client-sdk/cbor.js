import { encodeStrict, jsDecode } from '#utilities/serialize';
export async function encode(data) {
	return encodeStrict(data);
}
export async function decode(data) {
	return jsDecode(data);
}
