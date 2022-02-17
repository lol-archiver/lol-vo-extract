import { TT } from '../../../lib/global.js';


/** @interface */
export default class ManifestListItem {
	/** @type {string} */
	static nameItem;

	/** @param {import('@nuogz/biffer').default} biffer */
	static parse = function(biffer) { };

	constructor() {
		if(new.target === ManifestListItem) { throw new Error(TT('error:InterfaceClassNewForbidden', { clazz: ManifestListItem.name })); }
	}
}