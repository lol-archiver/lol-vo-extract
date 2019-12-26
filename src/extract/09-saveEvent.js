const findFriendly = function(name, map) {
	let nameFormat = name.toLowerCase().replace(/[23]d/g, '');
	const arrTrans = [];

	for(const raw in map) {
		if(nameFormat.includes(raw.toLowerCase())) {
			nameFormat = nameFormat.replace(raw.toLowerCase(), '');
			arrTrans.push(map[raw]);
		}
	}

	return arrTrans.join('');
};

module.exports = function saveEve(mapAudioID_Event, arrAudioPackFile) {
	L(`[Main] Save Event info for dictaion`);

	const mapFriendlyRaw = require(`../../data/eventFriendlyName/${C.lang}`);
	const mapFriendly = {};

	for(const skill of 'qwer'.split('')) {
		mapFriendly[`${C.hero}${skill}`] = `${skill.toUpperCase()}技能`;
	}

	for(const raw in mapFriendlyRaw) {
		mapFriendly[raw] = mapFriendlyRaw[raw];
	}

	const result = [];
	const eventMap = {};

	for(const [audioID, eventInfos] of Object.entries(mapAudioID_Event)) {
		const arrSrcCRC32 = arrAudioPackFile
			.map(file => RD('_cache', 'audio', file, `${audioID}.${C.finalFormat}`))
			.filter(src => _fs.existsSync(src))
			.map(src => T.crc32(_fs.readFileSync(src)));

		let crc32;

		if(!arrSrcCRC32.length) {
			crc32 = 'NOFILE';
		}
		else {
			if(arrSrcCRC32.length > 1) {
				L(`\t [WARING] Multi Take Audio File [${audioID}]`);
			}

			crc32 = arrSrcCRC32.join('|');
		}

		const hex = T.toHexL(audioID, 8);

		for(const eventInfo of eventInfos) {
			const skin = eventInfo.isBase ? 'Base' : eventInfo.skinName.replace(/:/g, '');
			const skinMap = eventMap[skin] || (eventMap[skin] = {});

			(skinMap[eventInfo.short] || (skinMap[eventInfo.short] = [])).push({ hex, crc32 });
		}
	}

	for(const [skin, skinMap] of Object.entries(eventMap)) {
		result.push(`# ${skin}`);

		const arrCatalog = ['## Catalog:目录'];
		const arrEventList = [];

		for(const [eventName, arrAudioInfo] of Object.entries(skinMap).sort(([a], [b]) => a > b ? 1 : -1)) {
			const eventTitle = `${findFriendly(eventName, mapFriendly)} | ${eventName}`;

			arrCatalog.push(`* [${eventTitle}](#${eventTitle.replace(/[、/:|[\]]/g, '').replace(/ /g, '-')})`);
			arrEventList.push(`#### ${eventTitle}`);
			arrEventList.push(`-`);

			const arrEventText = [];

			for(const { hex, crc32 } of arrAudioInfo) {
				arrEventText.push(`  - CRC32[${crc32}] \`${hex}\`: ***`);
			}

			arrEventText.sort().forEach(text => arrEventList.push(text));

			arrEventList.push('');
		}

		arrCatalog.forEach(text => result.push(text));
		result.push('');
		result.push('## Lines:目录');
		arrEventList.forEach(text => result.push(text));
	}

	_fs.writeFileSync(RD('_final', `${C.hero}@${C.lang}.events.md`), result.join('\n'));
};