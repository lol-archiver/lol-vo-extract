import { writeFileSync } from 'fs';

import { en_us as dataE, zh_cn as dataZ } from '../lib/dataBase.js';


const ver = '09.12';
const names = `
铁铠冥魂
暗星尊 烬
暗星 卡尔玛
暗星 萨科
`.trim().split('\n');

const result = [];
const ids = [];

let line1 = ver;
let line2 = '';

for(const name of names) {
	for(const hero of Object.values(dataZ)) {
		for(const skin of Object.values(hero.skins)) {
			if((skin.name || '') == name) {
				const idStr = `${String(hero.id).padStart(3, '0')}${String(skin.id).padStart(3, '0')}`;
				const nameSkinZ = skin.name.trim();
				const nameSkinE = dataE[hero.id].skins[skin.id].name.trim();

				result.push(`\t${idStr}\t${nameSkinE}`);
				result.push(`\t\t${nameSkinZ}`);

				line1 += `\t${nameSkinE}`;
				line2 += `\t${nameSkinZ}`;

				ids.push(idStr);
			}
		}
	}
}

result.push('-------');
result.push(`["${ver}", ${ids.map(id => `"${id}"`).join(', ')}]`);
result.push('-------');
result.push(line1.trimEnd());
result.push(line2.trimEnd());

result[0] = ver + result[0];

writeFileSync('./_final/chromas.txt', result.join('\n'));

import('./chromas.js');