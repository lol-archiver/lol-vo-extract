import { resolve } from 'path';

import IN from 'i18next';
import FSX from 'fs-extra';

import { dirApp } from './global.dir.js';


// i18n
await IN.init({
	lng: process.env.OUTPUT_LOCALE,
	resources: {
		en: FSX.readJSONSync(resolve(dirApp, 'locale', 'en.json')),
		zh: FSX.readJSONSync(resolve(dirApp, 'locale', 'zh.json')),
	},
});

// Hades Value Format
IN.services.formatter.add('hv', value => `~{${value}}`);
// Hades Term Format
IN.services.formatter.add('ht', value => `~[${value}]`);

const IT = (...params) => {
	return IN.t(...params);
};


export default IT;