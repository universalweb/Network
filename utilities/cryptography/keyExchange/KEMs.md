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

# DIS & Save client cert

Client includes a short hash of its own domain cert or identity cert so the server can either download it or reference it themselves
Once a server has this there is no further need to resend the full client auth details.
The client will include it during the process but before the client auth public key is needed.
This will keep connections fast and stable and avoid further packets to carry out a dual auth.
If this type of auth where both have domain certs exist then it is likely that both parties will have port forwarding for the same port.
