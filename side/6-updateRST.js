import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import { dirApp } from '../lib/globalDir.js';
import { rstHash } from '../lib/Tool.js';


writeFileSync(
	resolve(dirApp, 'data', 'hashes.rst.txt'),
	readFileSync(resolve(dirApp, 'data', 'texts.rst.txt'), 'utf8')
		.split('\n').map(l => `${rstHash(l, true)} ${l}`).join('\n')
);