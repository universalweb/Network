import { UML } from '../../UML/index.js';
import { encode } from '#utilities/serialize';
export const filename = 'index.uml';
export const fileExtension = '.uml';
export const dataStructure = {
	head: [],
	body: [
		{
			html: 'THIS IS A UNIVERSAL MARKUP LANGUAGE FILE',
		}
	],
	footer: []
};
console.log(dataStructure.body[0]);
// export const data = await UML(dataStructure);
// await data.save(`${import.meta.url}../resources/index.uml`);
