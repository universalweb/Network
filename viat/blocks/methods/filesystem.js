import path from 'path';
import { write } from '#utilities/file';
const methods = {
	async save(directoryPath) {
		const blockBinary = await this.exportBinary();
		const fullSavePath = path.join(directoryPath, await this.getPath());
		// console.log('Saving block to:', fullSavePath);
		return write(fullSavePath, blockBinary, 'binary', true);
	},
};
export default methods;
