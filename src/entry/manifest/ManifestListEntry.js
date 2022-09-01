
import { T } from '../../../lib/i18n.js';

import ManifestListItem from './ManifestListItem.js';



export default class ManifestListEntry extends ManifestListItem {
	static nameItem = T('manifest:item.manifestListEntry');


	typesKey;

	constructor(typesKey = []) {
		super();

		this.typesKey = typesKey;
	}

	parse(biffer) {
		const result = {};

		const posEntry = biffer.tell();

		const posKey = posEntry - biffer.unpack('l')[0];
		biffer.seek(posKey);

		biffer.unpack(`${this.typesKey.length}H`)
			.forEach((offset, i) => {
				const entry = this.typesKey[i];

				if(entry == null) { return; }

				const [key, type] = entry;

				let value = null;
				if(offset && type) {
					const pos = posEntry + offset;
					biffer.seek(pos);

					if(type == 'offset') {
						value = pos;
					}
					else if(type == 'string') {
						const [offsetString] = biffer.unpack('l');

						biffer.skip(offsetString - 4);
						value = biffer.unpackString();
					}
					else {
						[value] = biffer.unpack(type);
					}
				}

				result[key] = value;
			});

		return result;
	}
}
