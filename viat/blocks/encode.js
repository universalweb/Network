import { decode, encode, encodeStrict } from '#utilities/serialize';
export async function encodeBlock(block) {
	return encodeStrict(block);
}
// If contains maps data use encodeStrict to ensure ordering
export async function encodeBlockStrict(block) {
	return encodeStrict(block);
}
export async function decodeBlock(block) {
	return decode(block);
}
export default encodeBlock;
