# BINARY DATA SERIALIZATION

All encoding is done using CBOR but other formats can still be considered and or used for specific abilities. For all binary structured data encoding the entire network uses Concise Binary Object Representation (CBOR). CBOR is a documented standard and ideal for handling structured data that also needs to be sighed as that data if reconstructed must retain the exact same binary result. A JSON object must be deterministically encoded meaning the resulting binary data must be the same else signing, hashing, and other cryptographic operations may fail when reproducing the structured data. Although in most cases using a pre-defined array structure instead of a JSON like structured keyed object/hash map is best for performance and storage.

Any other recommendations to replace CBOR must offer canonical (deterministic encoding) capabilities. It must also support adding more variable/structure types.

### Benchmarks

https://github.com/kriszyp/cbor-x/blob/HEAD/assets/performance.png
