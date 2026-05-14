import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureDirSync } from 'fs-extra/esm';
import { dirTextAudio } from '../lib/dir.js';


const dirCWD = resolve(dirTextAudio);
const dirText = resolve(dirCWD, 'text');
ensureDirSync(dirText);


const files = readdirSync(dirText);

const texts = [];
for(const file of files) {
	let text = '';

	text += file.split('.mp3')[0] + '\n\n';
	text += readFileSync(resolve(dirText, file), 'utf8').trim();
	texts.push(text.replace('.txt', '').replace(/。$/, ''));
	texts.push('\n');
}

writeFileSync(resolve(dirCWD, 'line-raw.txt'), texts.join('\n'));
