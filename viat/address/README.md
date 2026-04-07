# Address Structure

- Legacy Addresses (Max Speed): Write the exact bytes of the public key and Trapdoor sequentially into a single pre-allocated contiguous memory space. Hash it in one shot. Skip CBOR completely.
- Modular Addresses (Safety & Agility): Continue using a minimal binary serializer like CBOR. It perfectly protects against boundary-shifting attacks while maintaining a highly compact byte footprint, which is then hashed in one shot.

CBOR Allows for highly modular structured compact binary data that can easily be hashed, transported, adapted, and checked for correctness.

For lower level or performant options pre-allocate a buffer for address hash checking etc.
