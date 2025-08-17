# Universal Web Socket: PACKET DESIGN

[
  // HEAD
  {
    connectionID
  },
  // BODY
  {
    method
    data
  },
  // FOOTER
  {

  }
]

#### UDSP HEADERS (MSGPack Object)(OPTIONAL ENCRYPTION)

- Nonce
- Socket ID (CLIENT/SERVER)
 : May indicate which server to send to for load balancing
 : May indicate which domain to send to for virtual hosts
 : May be entirely random

---

#### PROPERTY NAMES & MEANINGS

- id: Connection ID
- ccid: Client Connection ID
- scid: Server Connection ID
- method: Request methods such as GET, PUT, DELETE but in lowercase
- Watcher: Something used to watch completed data as it comes over the wire
- Head: UDSP Headers or Request/Response headers in a message
- evnt: (Event related to application level events)
- Body/Message: Is the main payload of a packet or the full data from a request
- Pid: Packet ID
- sid: Stream ID Essentially a Request ID unique to each request
- State: Connection/Request UDSP State Code
- Status: status Code similar to HTTP
- readyState: request readystate similar to XHR/HTTP requests
- end: Kill connection
- last: the last packet
- Puzzle: Solve a puzzle to continue
- ReKey
- scid: Server connection ID

---

#### UDSP LAYERS

|  IPv6 HEADERS  |
| :------------: |
|      UDP       |
|  UDSP HEADERS  |
|  UDSP MESSAGE  |
|  UDSP FOOTER   |

The UDSP Header, Body, & Footer are all part of one array structure encoded with msgpack.
##### IPv6 HEADERS

- Version
- Traffic Class
- Flow Label
- Payload Length
- Next Header
- Hop Limit
- Source Address
- Destination Address

##### UDP HEADERS

These are the standard UDP headers sent over:

- Source Port Number
- Destination Port Number
- Length
- Checksum
