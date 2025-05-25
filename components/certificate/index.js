import { decode, encode } from '#utilities/serialize';
import { read, write } from '#file';
import { assign } from '@universalweb/acid';
// TODO: Add Mandatory field  to prove ownership and transfer the domain to another certificate via a root cryptoID
export * from './domain.js';
