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

- 0 INTRO [false, 0]
- 1 SETUP [1]
- 2 PATH READY [2]
- 3 PARAMETERS READY [3]
- 4 HEAD READY [4]
- 5 DATA READY [5]
- 6 PATH
- 7 PARAMETERS
- 8 HEAD
- 9 DATA
- 10 Close - END
- 11 Error

### Message & Frame Format

Messages hold a frame or frames. A packet can only hold one message but it can include multiple frames.

[stream id, rpc, ...values]
