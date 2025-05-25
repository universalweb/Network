# OWNERSHIP

Entities that first generated a key pair owns the associated wallet unless legally transferred to another entity. This helps to provide a legal framework & fair process for entities to recover stolen assets. However, there are exceptions to this noted below.

## STOLEN WALLET

Viat has a robust multi-layered reactive and proactive security model which makes theft exceedingly difficult. 
Reactive measures exist even if the Viat was sent to another wallet.

The primary safeguard against theft is hybrid multi-cryptographic algorithms to generate a single, unified key pair. This unified key pair combines classical and post-quantum security while leveraging a variety of mathematical principles for stronger protection. Employing diverse mathematical foundations ensures if one is broken or becomes solvable the wallet will remain protected by the other algorithms. The unified key pair generates a specific wallet address ensuring they are tied to each other. Address generation is programmatic, anyone can transparently generate the same wallet address using the public keys to verify their relation.

TODO: Procedures to recover stolen assets: Wallets with these features enabled must be public.
FREEZING YOUR WALLET & UNFREEZING YOUR WALLET. Return stolen funds. Reverting funds and directing them to a backup wallet.

## PROXY WALLETS

Wallets which do not have any restrictions and or act as linked clearing houses for Viat.
This strategy is primarily used for creating a setup with a cryptographic enclave linked to a proxy wallet. The proxy wallet is cryptographically linked to the primary wallet. The proxy wallet is more of a forwarding address that can then send out Viat to other addresses. In the event of a compromised primary wallet the proxy wallet is the only wallet that can receive assets sent from it. The proxy wallet can act as an additional layer of security.
