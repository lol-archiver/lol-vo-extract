import '@nuogz/pangu/index.js?i18n&config&day&log&log.level=debug&log.willOutputConsoleError=true';
import { C, G } from '@nuogz/pangu';

import { T, TS } from './lib/i18n.js';

import parseRuncom from './src/parse-runcom.js';
import parseExtractConfig from './src/parse-extract-config.js';
import extractVoices from './src/extract-voices.js';


const GG = G.where(T('where:main'));



if(C.runcom instanceof Array == false) { GG.fatalE(-1, ...TS('verify-runcoms', { v: C.runcom }, 'invalid-type')); }


try {
	const runcoms = parseRuncom(C.runcom);
	const configsExtract = parseExtractConfig(runcoms);

	for(const configExtract of configsExtract) {
		if(configExtract.mode == 'skin') {
			GG.info(...TS('execute-config', { config: configExtract }, 'info-skin'));
		}
		else {
			GG.info(...TS('execute-config', { config: configExtract }, 'info-specify'));
		}

		await extractVoices(configExtract);

		globalThis.console.log('\n===================== next runcom =====================\n');
	}
}
catch(error) {
	GG.error('提取[语音]', error);
}
