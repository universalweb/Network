import { createState } from 'state/index.js';
const state = createState('Signature Testing');
const { certificate: { get } } = state;
const idcert = await get('../profiles/default.cert');
console.log(idcert);
