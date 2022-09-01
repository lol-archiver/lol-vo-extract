import { T } from '../../../lib/i18n.js';

import ManifestListItem from './ManifestListItem.js';
import ManifestListEntry from './ManifestListEntry.js';



export default class Directory extends ManifestListItem {
	static nameItem = T('manifest:item.directory');

	static parse(biffer) {
		const entry = new ManifestListEntry([
			null,
			null,
			['id', 'Q'],
			['idParent', 'Q'],
			['name', 'string'],
		]).parse(biffer);

		return new Directory(entry.id, entry.name, entry.idParent);
	}

	/** @type {bigint} */
	id;
	/** @type {string} */
	name;
	/** @type {bigint} */
	idParent;

	constructor(id, name, idParent) {
		super();

		this.id = id;
		this.name = name;
		this.idParent = idParent;
	}
}
