## Universal Web Socket - PACKET DESIGN

Keep in mind packet design is in flux and is subject to constant changes until v1 RC.

Definitions
Multiple - Emplies that the property name may be used more than once inside a single packet. This is expected to change as property single character names are chosen.

#### PACKET OVERVIEW

|          ARRAY           |
| :----------------------: |
|         Headers          |
| Encrypted Data End Index |
|      Encrypted Data      |

#### Additional Data

-   Nonce
-   Socket ID (CLIENT/SERVER)
    -   May indicate which server to send to for load balancing
    -   May indicate which domain to send to for virtual hosts
    -   May be entirely random

---

#### ENCRYPTED DATA

-   id - Connection ID (MANDATORY)
-   api - API function that is requested (OPTIONAL)
-   Watcher (OPTIONAL)
-   Identity Certificate (OPTIONAL)(REQUIRED FOR HANDSHAKE)
-   Head (OPTIONAL Multiple)
-   Body (OPTIONAL Multiple) (MSGPack Object)
-   Pid - Packet ID (MANDATORY)
-   Status - Status Code (OPTIONAL)
    -   If status is left blank it defaults to 200 or is considered a success
-   end - Kill connection (OPTIONAL)
-   Puzzle - Solve a puzzle to continue (OPTIONAL)
-   ReKey (OPTIONAL)
-   scid - Server connection ID (OPTIONAL)
-   cid - Client connection ID (OPTIONAL)

---

#### HEADER LAYERS

|  IPv6 HEADERS  |
| :------------: |
|  UDP HEADERS   |
|  UDSP HEADERS  |
| PACKET HEADERS |
| STREAM HEADERS |

##### IPv6 HEADERS

-   Version
-   Traffic Class
-   Flow Label
-   Payload Length
-   Next Header
-   Hop Limit
-   Source Address
-   Destination Address

##### UDP HEADERS

These are the standard UDP headers sent over:

-   Source Port Number
-   Destination Port Number
-   Length
-   Checksum

##### MAIN HEADERS

Main Headers are public and typically none encrypted but the application can choose to encrypt certain headers such as connection IDs.

##### PACKET HEADERS

Packet headers are encrypted and are typically sent only once and are considered priority data they must fit into a single UDSP packet. An example of packet headers that would be sent once are security related headers such as content origin policy. If in a browser this header is attached to all other requests or placed as a meta tag in the head. This avoids the constant re-sending of these headers when they only need to be sent once. This also avoids processing on the server and client for redundant security headers.

##### STREAM HEADERS

STREAM headers are request specific and may be sent over first prior to the encrypted body being sent over. Headers are treated as priority data in terms of execution of the request.
