import { AuditBlock } from './index.js';
const exampleBlock = await AuditBlock.create();
await exampleBlock.finalize();
console.log('Audit Block', exampleBlock.block);
console.log('hash size', exampleBlock.get('hash')?.length);
console.log('valid', await exampleBlock.validate());
