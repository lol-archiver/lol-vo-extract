import { TT } from '../../../lib/global.js';

import ManifestListItem from './ManifestListItem.js';


export default class Langauge extends ManifestListItem {
	static nameItem = TT('manifest:item.language');

	static parse(biffer) {
		biffer.skip(4); // skip offset table offset

		const [id, offset] = biffer.unpack('xxxBl');

		biffer.skip(offset - 4);

		return new Langauge(id, biffer.unpackString());
	}


	/** @type {number} */
	id;
	/** @type {string} */
	name;

	constructor(id, name) {
		super();

		this.id = id;
		this.name = name;
	}
}