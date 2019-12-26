module.exports = function copyVoc(mapAudioID_Event, arrAudioPackFile) {
	L(`[Main] Copy audio file`);

	Fex.ensureDirSync(RD('_final', `${C.hero}@${C.lang}`));

	const toLongList = [`-------${M().format('YYYY-MM-DD HH:mm:ss')}-------`];

	for(const audioPackFile of arrAudioPackFile) {
		const copyWhileEmpty = audioPackFile.startsWith('sfx') ? (C.sfxLevel >= 2 ? true : false) : true;

		for(let audioFile of _fs.readdirSync(RD('_cache', 'audio', audioPackFile))) {
			const audioID = _pa.parse(audioFile).name;
			const audioIDHex = T.toHexL(audioID, 8);

			const arrEvent = mapAudioID_Event[audioID] || [];

			const mapEventNameShort_SkinName = {};
			for(const eventInfo of arrEvent) {
				(mapEventNameShort_SkinName[eventInfo.short] || (mapEventNameShort_SkinName[eventInfo.short] = [])).push(`[${eventInfo.isBase ? 'Base!' : eventInfo.skinName.replace(/:/g, '')}]`);
			}

			const eventsTotalText = [];
			for(const eventName in mapEventNameShort_SkinName) {
				const events = mapEventNameShort_SkinName[eventName];

				let eventsText = '@[Base]';
				if(!events.find(event => event == '[Base!]')) {
					eventsText = `@${mapEventNameShort_SkinName[eventName].join('&')}`;
				}

				eventsTotalText.push(`${eventName}${eventsText}`);
			}

			const src = RD('_cache', 'audio', audioPackFile, `${audioID}.${C.finalFormat}`);
			const srcBuffer = _fs.readFileSync(src);

			if(!eventsTotalText.length && !copyWhileEmpty) {
				L(`\tAudio[${audioIDHex}] is SFX with empty vo event and low sfx level, skip...`);

				continue;
			}

			const eventTotalText = eventsTotalText.join('-');
			const audioText = eventTotalText ? audioIDHex : audioID;

			try {
				_fs.copyFileSync(
					src,
					RD('_final', `${C.hero}@${C.lang}`, `${eventTotalText || '_Unknown'}[${audioText}][${T.crc32(srcBuffer)}].${C.finalFormat}`),
				);
			} catch(error) {
				_fs.copyFileSync(
					src,
					RD('_final', `${C.hero}@${C.lang}`, `_EventToLong[${audioIDHex}][${T.crc32(srcBuffer)}].${C.finalFormat}`),
				);

				toLongList.push(`[${audioIDHex}] ==>\n${eventsTotalText.map(t => `\t${t}`).join('\n') || '_Unknown'}`);
			}
		}
	}

	if(toLongList.length > 1) {
		_fs.appendFileSync(RD('_final', `${C.hero}@${C.lang}`, '_ToLongEvent.txt'), toLongList.join('\n'));
	}
};