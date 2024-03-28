# Certificate Template & Wire Frame

Certificate Types
Each certificate type follows its own order. A domain certificate and a profile certificate will have different data stored in a unique order.
Types: [0: Domain, 1: profile, 2: root]
Experimental Types: [3: VIAT, 4: store, 5: school?, 6: government]

Certificate Blockchain Diagram
[Domain Certificate details..., signature (automatically considered as the last entry)]
The last entry being the signature is used to lookup a certificate chain, what certificate authorities signed off on it, and to see if the DIS blockchain has further verification done.

Proof Certificates
Certificates which serve as proof that a particular domain is associated with a particular keypair and details. Typically done by a certificate authority and is cryptographically linked to the certificate it is associated with.

Public & Transparent DIS (Domain Certificate) Blockchain
If CA is hacked then creates a fake cert for a service changing the signing keypair and or the encryption keypair. To avoid this issue the signature keypair within the certificate is considered a long standing public key associated with Domain forming its identity. Generating a new certificate for the domain would require that they have the original signature keypair. Any previous signature is stored in a public Domain Information Service (eventually VIAT) blockchain each block being a checksum of the current certificate as well as incorporating the previous certificate's checksum. For security concers the certificates are not historically stored in their entirety on the blockchain so that the data could not be used in a retro active attack & to potentially act as a mechanism to prove the identity of an owner if ever needed. Only the current active Domain Certificate is stored within the Domain Information System but the DIS's public blockchain is a transparent way for anyone to check if a Domain Certificate may of been tampered with.

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
