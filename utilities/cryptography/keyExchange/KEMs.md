# QT-LONG -> SERVER EPHEMERAL & CLIENT AUTH STEPS
Based on typical MTU

Client sends the Client Eph PK.
Server sends Client the Cipher Text.

Client sends server Ciphertext from long-term server.

Server sends Ephemeral Public Key
Client Sends Server Ephemeral Ciphertext

Client sends long-term public key
Server sends client long-term ciphertext

# QT-MID -> Client Auth
Based on typical MTU

Client sends the Client Eph PK.
Server sends Client the Cipher Text.

Client sends server Ciphertext from long-term server.

Server sends client confirmation with encrypted data

Client sends long-term auth public key
Server sends client long-term ciphertext

SERVER & CLIENT ARE IN SYNC

# FAST AUTH

Client sends Ephemeral Public Key, Long-term Public Key & Payload
	Client uses ephemeral, long-term, and server long-term to compute first session keys
Server sends Client Ephemeral Public Key & Payload
	Server uses client ephemeral, client long-term, and server long-term to compute first session keys
	Server then computes final session keys with ephemeral
Server & Client are AUTHED and in SYNC
