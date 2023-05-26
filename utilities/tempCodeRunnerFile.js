const connectionId = randomConnectionId();
const key = createConnectionIdKey();
console.log(connectionId.toString('base64'));
const encryptedA = encodeConnectionId(connectionId, key);
console.log(encryptedA, encryptedA.length);
console.log(getConnectionId(encryptedA, key).toString('base64'));