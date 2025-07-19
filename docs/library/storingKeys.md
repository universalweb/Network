# ENCRYPTING LOCAL DATA

Use this for saving Wallet, profile, and or cryptoID credentials.

- Argon2id → SHAKE256 → AEAD 
- Argon2id → KMAC → AEAD

password + salt
    ↓
Argon2id
    ↓
SHAKE256 (XOF with domain separation)
    ↓
AEAD encryption
