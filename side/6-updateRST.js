import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import { dirData } from '../lib/global.dir.js';
import { rstHash } from '../lib/Tool.js';


writeFileSync(
	resolve(dirData, 'hashes.rst.txt'),
	readFileSync(resolve(dirData, 'texts.rst.txt'), 'utf8')
		.split('\n').map(l => `${rstHash(l, true)} ${l}`).join('\n')
);