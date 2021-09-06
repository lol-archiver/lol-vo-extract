import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { ensureDirSync } from 'fs-extra';
import { dirApp } from '../lib/globalDir.js';


const dirFinal = resolve(dirApp, '_final');
const dirCWD = resolve(dirFinal, 'Audio2Text');
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