import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import { dirData } from '../lib/dir.js';
import { rstHash } from '../lib/utility.js';



writeFileSync(
	resolve(dirData, 'hashes.rst.txt'),
	readFileSync(resolve(dirData, 'texts.rst.txt'), 'utf8')
		.split('\n').map(l => `${rstHash(l, true, 39).toLowerCase()} ${l}`).join('\n')
);
