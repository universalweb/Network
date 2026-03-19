# Hierarchical Deterministic Universal Profiles

Hierarchical Deterministic Seed Derivation
Post-Quantum Hierarchical Deterministic Universal Identity System

- Post-Quantum Ready
- Supports Hierarchical Deterministic Key pairs, Wallets, Keys
- Supports any Key Pair algorithm
- Master Entropy Set Seed, Key, Nonce - Each 256 Bytes
- Supports Compromised Master Set Protection
	- Even if the master set is compromised attacker can't generate final seeds without a final secret
		- Supports secret can be password based with argon2id (PBKD)
		- Supports arbitrary size defined secret
- Supports on Disk encryption
	- Ensures Master Set protection while at rest
	- Dynamic generation means keys don't need to persist on disk
- Supports Seed Isolation
- Supports Seed Grouping
- Support Seed Checkpoints
- Supports Relational Proofs

Primitives used:

- SHAKE256
- KMAC256_XOF
- Argon2id

The foundation of Viat's Identity System

## Overview
Viat uses seed-based hierarchical deterministic (HD) seed generation with checkpoint compatibility. Checkpoints let users carry a scoped set of child keys while keeping the master seed offline. If a checkpoint seed is exposed, only its descendant keys are affected — the master seed and unrelated checkpoints remain secure.

HD keypairs are a core component of the VIAT identity system, which provides a universal identity layer for the broader VIAT network.

User Creates Root Identity
User Requests Identity Schema/Spec from service
User generates deterministic key pair using meta details and their own master seed and master key


## Design Principles
- Deterministic: All seeds and keys are derived deterministically to enable reproducible checkpoint generation and recovery.
- Least privilege: Authority seeds (checkpoints) are purpose-scoped and limit the scope of exposure when carried.
- Revocability: Authority seeds can be revoked or rotated according to policy.
- Compartmentalization: Daily/operational keys are isolated from authorities and the master seed.
- Forward compatibility: Design anticipates post‑quantum resilience where applicable.

## Seed Hierarchy
### Master Seed
- High-value root seed — keep in cold storage.
- Used to derive authority seeds and other high-level authorities.
- Never used for day-to-day signing or routine operations.

### Authority Seeds (Checkpoints)
- Deterministically derived from the master seed.
- Purpose-scoped and limited in derivation depth.
- Transportable and exchangeable for operational use.
- Can be revoked or rotated without exposing the master seed.

### Operational Keys
- Derived only from an authority seed (checkpoint).
- Used for daily operations and signing.
- Compromise of an operational key is contained to that key and its limited descendants.

## Checkpoint Workflow
- Generate master seed and store offline (cold storage).
- Derive authority seeds for specific purposes (wallets, devices, services).
- Export or carry a checkpoint when operational access is needed.
- Derive operational keys from the checkpoint for routine use.
- Revoke or rotate authority seeds as policy or threat model dictates.

## Compromise & Recovery
- If an authority seed is compromised: revoke/rotate that checkpoint and re-derive new authority seeds from the master seed. Only keys derived from the compromised checkpoint are affected.
- If an operational key is compromised: revoke the key and replace it from the parent checkpoint; no need to expose the master seed.
- If the master seed is compromised: full recovery requires regenerating the identity from a secure root and re-provisioning authority seeds and operational keys.

## Best Practices
- Store the master seed offline in secure cold storage.
- Limit derivation depth and scope for authority seeds.
- Implement rotation and revocation procedures for authority seeds.
- Use distinct authority seeds for different purposes (devices, services, geographic regions).
- Audit key usage and maintain a recovery plan for stolen or lost checkpoints.

## Notes
- This document describes the HD keypair architecture and operational model. Implementation details (algorithms, serialization formats, and API usage) belong in the implementation reference and specification documents.


Root = certificate authority / sovereign seed space
Branch = delegated intermediate authority
Leaf = service credential / account / concrete keypair

branches can derive downward within their own subtree
root is required to create peer/top-level branches
optionally let some branches be marked as autonomous subtree masters for portable use

DelegatedProfile (or AutonomousProfile)
AnchoredProfile (or TetheredProfile)  - REQUIRES MASTER ENTROPY POOLS
ServiceCredential or ProfileKey -> FINAL
HardenedProfile (and HardenedCredential) -> FINAL WITH MASTER ENTROPY POOL REQUIRED

Intermediate deterministic commitments derived from different master entropy pool each bound to the same metadata domain then combined through KMAC into the final fixed-size seed.

Each derived object shares a canonical base identity, then adds role-specific metadata and role-specific secret input so that all derivation transcripts remain related but non-equal.

1 Shared/base derivation identity
	- things like ID, scheme, network, relationship, version, etc.
2 Role-specific metadata
	- fields unique to pre-seed vs pre-key vs pre-nonce
3 Distinct entropy pools
	- master_seed, master_key, master_nonce

- deriving from reserved core identity fields
- optionally including extension metadata
- using strict CBOR
- separating pre-seed / pre-key / pre-nonce by role
- combining distinct entropy pools through KMAC
- outputting one final fixed-size seed for the target scheme

Core derivation fields are reserved, type-stable, and restricted to standardized values. Extension fields may be user- or service-defined and retain CBOR-native type flexibility, but they do not alter the semantic constraints of reserved fields.

All derivation transcripts are encoded using strict CBOR so canonical core identities and extension metadata serialize deterministically.

Derivation Process
Each is used as a parameter for the final fixed size KMAC output used as the seed for generation.

KEY
MASTER -> PRE -> FIXED HASH FINAL KEY = KEY

SEED
MASTER -> PRE = MESSAGE

NONCE
MASTER -> PRE -> CBOR(META + PRE) = Customization String


The trapdoor is also deterministic and can be auto matched to a specific wallet's meta struct details. This keeps both safe and on different branches.

All seeds etc should be encrypted on disk. Optionally, Consider the use of argon2id to mix in user input to carry out full derivation. In the event a master set is compromised the derivation process can't be carried out fully without it serving as a final security layer. This can be done for the final key pair seeds if so desired. For browser based environments this could be vital in the event the seed or a private key could be compromised which means the actual seed and actual private key remain in an intermediate step. This ensures if it's read or compromised the secret keeps it safe until used this helps combat one-shot attack scripts that just pull the hard data and leave. In that event the pulled data is useless without the final secret hash.

HD tree / branch derivation
multiple entropy pools
strict structured metadata
KMAC-based derivation
optional final password-derived guard on terminal seeds

Argon2ID or User based output incorporated secret

- Guard the operation output, not necessarily for every internal phase
- Any output that can stand alone should have its own guard option
	- Key or nonce used alone need to have this as an option
