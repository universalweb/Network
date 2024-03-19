# Certificate Template & Wire Frame

- type
- cert version
- start date
- end date
- signature keypair info
  - signature keypair [PublicKey, PrivateKey]
  - signature Algorithm ID
- keyexchange info
  - keyexchange keypair [PublicKey, PrivateKey]
  - keyExchange Algorithm ID
  - cipher Suites [Numerical array based on protocol version]
- protocol options
  - protocol version
  - client connection id
  - server connection id
- entity
- records or null or true or array ip:port or string ip:port (has specific records separate from THIS cert)
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
  - certificate authority name
  - App Binary (UW App Code binary to run on page load)
  - App Data (App data that is stored within the cert made available to Web App)
- Options
- SIGNATURE of cert data using sign-public key

ID of cert is a hash of its contents and is computed not stored within the cert. The ID can be used to request a cert by its ID , stored related information to that ID, whitelist, blacklist, and or use the ID as a primary key store.

record certs for complex hosts
([type, key, value(s), {OPTIONS[KEY,VALUE]}])SIGNED-BY-PARENT-CERT-PUBLICKEY
