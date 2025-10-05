import { base64ToBuffer } from '#crypto/utils.js';
import { generateAddress } from './generateAddress.js';
console.log(generateAddress(Buffer.from('ISzBVTE2ba9K+oHuQQPhsE4Z12oeLg1NB7fMu7QqErs=', 'base64')).length);
console.log(base64ToBuffer('a1JTdEplTmZPTmhTWEgrRUFPVHliQjhnTDhHZ0tFTkR0ZmYxb2d3T3M0ND0=').length);
console.log(base64ToBuffer('a1JNZndEWmEzZ0dyOU40cko3TEJvTi94V05LWHZDclVML1V1RWdsTTFtZz0=').length);
console.log(Buffer.from('dd').toString('base64url'));
