# Universal Web Socket - PACKET DESIGN

#### PACKET HEADERS (MSGPack Object)(OPTIONAL ENCRYPTION)

- Nonce
- Identity Certificate (OPTIONAL)(REQUIRED AT START)
- Socket ID (CLIENT/SERVER)
  - May indicate which server to send to for load balancing
  - May indicate which domain to send to for virtual hosts
  - May be entirely random

---

#### PROPERTY NAMES & MEANINGS

- id - Connection ID (MANDATORY)
- api - API function that is requested (OPTIONAL)
- Watcher (OPTIONAL)
- Head (OPTIONAL)
- Body (OPTIONAL) (MSGPack Object)
- Pid - Packet ID (MANDATORY)
- Status - Status Code (OPTIONAL)
  - If status is left blank it defaults to 200 or is considered a success
- end - Kill connection (OPTIONAL)
- Puzzle - Solve a puzzle to continue (OPTIONAL)
- ReKey (OPTIONAL)
- scid - Server connection ID (OPTIONAL)

---

#### HEADER LAYERS

|  IPv6 HEADERS  |
| :------------: |
|  UDP HEADERS   |
|  UDSP HEADERS  |
| PACKET HEADERS |
| FRAME HEADERS  |

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

##### MAIN HEADERS

Main Headers are public and not encrypted so that the server knows how to initially handle the packet. Think of packets as a constant stream of data it just needs to know which entry node to be filtered to. The connection ID isn't encrypted so that the endpoint knows how to process & assign the packet. During handshake it's about storing and creating a client object using that connection ID or creating a new one. When sending back a response the initial connection ID is used but typically will include a server side created connection ID for all future packets sent to the server. You can think of these as a send and receive connection ID.

##### PACKET HEADERS

Packet headers are encrypted and are typically sent only once and are considered priority data they must fit into a single UDSP packet. An example of packet headers that would be sent once are security related headers such as content origin policy. If in a browser this header is attached to all other requests or placed as a meta tag in the head. This avoids the constant re-sending of these headers when they only need to be sent once. This also avoids processing on the server and client for redundant security headers.

##### FRAME HEADERS

Frame headers are request specific and will be chunked and sent over first prior to the body being sent over. Headers are treated as priority data.
