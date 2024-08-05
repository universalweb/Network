# Notes

Client
25519 32
Kyber Client Ephemeral Public Key PublicKey 1184 in Header

Server (Encrypted in body with first keypair)
Confirm generate new 25519 keypair 32
Get Kyber Keypair encapsulate the public key 1088

Client (Updates using new shared kyber key)
Plus hashes with new kyber key exchange

## Memory improvements

Clear one time keypairs for connections leaving only the session keys
