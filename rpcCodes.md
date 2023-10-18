# PACKET FORMAT & RPC Codes

RPC Codes are numbers that correspond to methods, functions, and or procedures.

## Headers

### Header RPC Codes

- INTRO [0 Setup, cipher Suite (ID: INT, NAME: STRING, AVAILABLE SUITES: ARRAY(IDs)), version, requestCertificate]
- 1
- 2
- 3
- 4
- 5
- 6
- 7

### Header Format

[connection id, rpc, ...values]

## Messages

### Message RPC Codes

- INTRO [0, false]
- 1
- 2
- 3
- 4
- 5
- 6
- 7

### Message & Frame Format

Messages hold a frame or frames. A packet can only hold one message but it can include multiple frames.

[stream id, rpc, ...values]

Same stream ID with multiple frame types
[stream id, [rpc, ...values]]

Example of multiple frames with different stream ids in a single message/packet.
[[stream id, rpc, ...values], [stream id, rpc, ...values]]
