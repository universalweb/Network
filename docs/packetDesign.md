## Universal Web Socket - PACKET DESIGN  

#### PACKET HEADERS (MSGPack Object)(OPTIONAL ENCRYPTION)
 - Nonce
 - Identity Certificate (OPTIONAL)(REQUIRED AT START)
 - Socket ID (CLIENT/SERVER)
    - May indicate which server to send to for load balancing
    - May indicate which domain to send to for virtual hosts
    - May be entirely random
___

#### REQUEST PROPERTIES (MSGPack Object)(ENCRYPTED)
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

___

#### HEADER LAYERS

|         IPv6 HEADERS        |
|:---------------------------:|
|         UDP HEADERS         |
|        UDSP HEADERS         |
|        PACKET HEADERS       |
|        FRAME HEADERS        |

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
Main Headers are public and typically none encrypted but the application can choose to encrypt certain headers such as connection IDs.

##### PACKET HEADERS
Packet headers are encrypted and are typically sent only once and are considered priority data they must fit into a single UDSP packet. An example of packet headers that would be sent once are security related headers such as content origin policy. If in a browser this header is attached to all other requests or placed as a meta tag in the head. This avoids the constant re-sending of these headers when they only need to be sent once. This also avoids processing on the server and client for redundant security headers.

##### FRAME HEADERS
Frame headers are request specific and will be chunked and sent over first prior to the body being sent over. Headers are treated as priority data.
