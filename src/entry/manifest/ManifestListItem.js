import { T } from '../../../lib/i18n.js';



/** @interface */
export default class ManifestListItem {
	/** @type {string} */
	static nameItem;

	/** @param {import('@nuogz/biffer').default} biffer */
	static parse = biffer => { };

	constructor() {
		if(new.target === ManifestListItem) { throw new Error(T('error:InterfaceClassNewForbidden', { clazz: ManifestListItem.name })); }
	}
}
