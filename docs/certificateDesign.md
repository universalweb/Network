# Certificate Template & Wire Frame

- cert version
- domain
- protocol info
- sign-publickey or ARRAY[sign pubkey, encrypt pubkey]
- sign-publickey algorithm (NUMERICAL ID) or ARRAY[sign algo, encrypt pubkey algo]
- records or null or true (has specific records separate from THIS cert)
  - ([type, name, value])SIGNED-BY-PARENT-CERT-PUBLICKEY
- contact information or null or true (if true whois info cert is separate from THIS cert)
- {OPTIONS[KEY,VALUE]}
  - ke (Key Encapsulation/Encryption): ID (0 = crystals-kyber)
  - tos Terms of Service that will be displayed before connecting
    - only when accepted via signing a hash of the tos can a user fully utilize services
  - owner [(sign publickey owner & signature of sign publickey of cert)]
  - VIAT (specific viat public key address which is separate from the one in the cert itself)
  - BTC (associated BTC wallet address)
  - ETH (associated ETH wallet address)
  - BNB (associated BNB wallet address)
- SIGNATURE of cert data using signpublic key

ID of cert is a hash of its contents and is computed not stored within the cert. The ID can be used to request a cert by its ID , stored related information to that ID, whitelist, blacklist, and or use the ID as a primary key store.

If no array is provided for the public key and the algorithm is set for ed25519 (numerical id 0) it will convert the ed25519 key to x25119 for key exchange.

record certs for complex hosts
([type, key, value(s), {OPTIONS[KEY,VALUE]}])SIGNED-BY-PARENT-CERT-PUBLICKEY