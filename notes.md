# Notes

The packet based approach in the ASK for the new handshake is the first step but it must be done in combination with a larger open request so that any larger additional information may be included in the response.

Client Hello
Server Hello Server Connection ID Packet Sent to Client
Client responds with new server connection ID - connection is established (if fails at this step just re-transmit next packets)
