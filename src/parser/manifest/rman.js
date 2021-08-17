import AS from 'assert';
import { resolve } from 'path';

import Biffer from '../../../lib/Biffer.js';
import { dirCache } from '../../../lib/global.js';
import { toHexL, unZstd } from '../../../lib/Tool.js';


export default async function parseRman(manifests) {
	for(const manifest of manifests) {
		const { buffer } = manifest;
		const bifferManifest = new Biffer(buffer);

		const [codeMagic, versionMajor, versionMinor] = bifferManifest.unpack('<4sBB');

		if(codeMagic != 'RMAN') { throw 'invalid magic code'; }
		if(versionMajor != 2 || versionMinor != 0) { throw `unsupported RMAN version: ${versionMajor}.${versionMinor}`; }

		// eslint-disable-next-line no-unused-vars
		const [bitsFlag, offset, length, idManifest, lengthBody] = bifferManifest.unpack('<HLLQL');

		AS(bitsFlag & (1 << 9));
		AS(offset == bifferManifest.tell());

		manifest.id = idManifest;

		manifest.buffer = await unZstd(resolve(dirCache, 'manifest', `${manifest.version}-${toHexL(manifest.id, 0, false)}-body.manifest`), bifferManifest.raw(length), true);
	}
}