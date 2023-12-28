# PACKET FORMAT & RPC Codes

RPC Codes are numbers that correspond to methods, functions, and or procedures.

## Headers

### Header RPC Codes

- 0 INTRO [0 rpc, publicKey, cipher Suite INT, version INT]
- 1 End [1 rpc]
- 2 MANUAL DISCOVERY [2 rpc, publicKey, preferred, cipher Suites INTs, version INT]
- 3
- 4
- 5
- 6
- 7

### Header Format

[connection id, rpc, ...values]

## Messages

### Message RPC Codes

- 0 Setup Packet.
- 1 Path Ready Packet.
- 2 Path Packet.
- 3 Parameters Ready Packet.
- 4 Parameters Packet.
- 5 Head Ready Packet.
- 6 Head Packet.
- 7 Data Ready Packet.
- 8 Data Packet.
- 9 End Packet.
- 10 Error Packet.

### Message & Frame Format

Messages hold a frame or frames. A packet can only hold one message but it can include multiple frames.

[stream id, rpc, ...values]
