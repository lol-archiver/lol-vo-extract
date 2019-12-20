module.exports = async function copyVoc(allSkinEventFileMap) {
	L(`-------copyVoc-------`);

	Fex.ensureDirSync(RD('_final', `${C.hero}@${C.lang}`));

	const toLongList = [`-------${M().format('YYYY-MM-DD HH:mm:ss')}-------`];

	for(let soundFile of _fs.readdirSync(RD('_cache', 'sound'))) {
		const soundID = _pa.parse(soundFile).name;

		const eventInfos = allSkinEventFileMap[soundID] || [];

		const eventMap = {};
		for(const eventInfo of eventInfos) {
			(eventMap[eventInfo.name] || (eventMap[eventInfo.name] = [])).push(`[${eventInfo.isBase ? 'Base!' : eventInfo.skinName.replace(/:/g, '')}]`);
		}

		const eventTotalText = [];
		for(const eventName in eventMap) {
			const events = eventMap[eventName];

			let eventsText = '@[Base]';
			if(!events.find(event => event == '[Base!]')) {
				eventsText = `@${eventMap[eventName].join('')}`;
			}

			eventTotalText.push(`${eventName}${eventsText}`);
		}

		const src = RD('_cache', 'sound', `${soundID}.${C.finalFormat}`);

		try {
			_fs.copyFileSync(
				src,
				RD('_final', `${C.hero}@${C.lang}`, `${eventTotalText.join('-') || '_Unknown'}[${T.toHexL(soundID)}].${C.finalFormat}`),
			);
		} catch(error) {
			_fs.copyFileSync(
				src,
				RD('_final', `${C.hero}@${C.lang}`, `_EventToLong[${T.toHexL(soundID)}].${C.finalFormat}`),
			);

			toLongList.push(`[${T.toHexL(soundID)}] ==>\n${eventTotalText.map(t => `\t${t}`).join('\n') || '_Unknown'}`);
		}
	}

	if(toLongList.length > 1) {
		_fs.appendFileSync(RD('_final', `${C.hero}@${C.lang}`, '_ToLongEvent.txt'), toLongList.join('\n'));
	}
};