const sodium = await import('sodium-native');
const libsodium = sodium?.default || sodium;
const {
	crypto_aead_xchacha20poly1305_ietf_decrypt,
	crypto_aead_xchacha20poly1305_ietf_encrypt,
	crypto_aead_xchacha20poly1305_ietf_keygen,
	crypto_kx_client_session_keys,
	crypto_kx_keypair,
	crypto_kx_server_session_keys,
	crypto_scalarmult,
	crypto_aead_xchacha20poly1305_ietf_ABYTES,
	sodium_memzero,
	crypto_scalarmult_BYTES,
} = libsodium;
export {
	crypto_aead_xchacha20poly1305_ietf_decrypt,
	crypto_aead_xchacha20poly1305_ietf_encrypt,
	crypto_aead_xchacha20poly1305_ietf_keygen,
	crypto_kx_client_session_keys,
	crypto_kx_keypair,
	crypto_kx_server_session_keys,
	crypto_scalarmult,
	crypto_aead_xchacha20poly1305_ietf_ABYTES,
	sodium_memzero,
	crypto_scalarmult_BYTES,
};
export default libsodium;
