# Notes

If you wanted to process parts of the packet first like the header you could first read the messagePack encoding and process as you go. This is useful for reading the headers or parts of it first before the entire packet.

For new global server/client base class add a method for  optional padding.
