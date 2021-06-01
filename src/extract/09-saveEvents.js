const findFriendly = function(name, map) {
	let nameFormat = name.toLowerCase().replace(/[23]d/g, '');
	const arrTrans = [];

	for(const raw in map) {
		if(nameFormat.includes(raw.toLowerCase())) {
			nameFormat = nameFormat.replace(raw.toLowerCase(), '');
			if(map[raw].trim()) { arrTrans.push(map[raw].trim()); }
		}
	}

	return arrTrans.join(':');
};

module.exports = function saveEvents(mapAudioID_Event, arrAudioPackFile) {
	L(`[Main] Save Event info for dictaion`);

	let mapFriendlyRaw;

	try {
		mapFriendlyRaw = require(`../../data/FriendlyName/${C.lang}`);
	}
	catch(error) {
		mapFriendlyRaw = {};
	}

	const mapFriendly = {};

	for(const skill of 'QWER'.split('')) {
		mapFriendly[`${C.champ}${skill}`] = `使用:${skill.toUpperCase()}技能`;
	}

	for(const raw in mapFriendlyRaw) {
		mapFriendly[raw] = mapFriendlyRaw[raw];
	}

	const eventMap = {};

	for(const [audioID, eventInfos] of Object.entries(mapAudioID_Event)) {
		let arrSrcCRC32 = arrAudioPackFile
			.map(file => RD('_cache', 'audio', file, `${audioID}.${C.format}`))
			.filter(src => _fs.existsSync(src))
			.map(src => T.crc32(_fs.readFileSync(src)));

		arrSrcCRC32 = new Set(arrSrcCRC32);

		let crc32;

		if(!arrSrcCRC32.size) {
			crc32 = 'NOFILE';
		}
		else {
			if(arrSrcCRC32.size > 1) {
				L(`\t [WARING] Multi Take Audio File [${audioID}]`);
			}

			crc32 = [...arrSrcCRC32].join('|');
		}

		const hex = T.toHexL(audioID, 8);

		const dict = require(`../../data/BaseData/${C.lang}.json`);
		const dictEN = require(`../../data/BaseData/en_us.json`);

		for(const eventInfo of eventInfos) {
			if(typeof eventInfo == 'object') {
				const slot = `[${String(C.id).padStart(3, '0')}${String(eventInfo.index).padStart(3, '0')}]`;

				const dChampion = dict[C.id];
				const dSkinCN = dChampion.skins[eventInfo.index];
				const dSkinEN = dictEN[C.id].skins[eventInfo.index];

				const skin = `${slot}${eventInfo.skinName.replace(/:/g, '')}` +
					`||${slot} ${dChampion.slot}:${dChampion.name}` + (eventInfo.index == 0 ? '' : ` ==> ${dSkinEN.name}:${dSkinCN.name}`);

				const skinMap = eventMap[skin] || (eventMap[skin] = {});

				(skinMap[eventInfo.short] || (skinMap[eventInfo.short] = [])).push({ hex, crc32 });
			}
			else if(typeof eventInfo == 'number') {
				const skinMap = eventMap['[Bad]'] || (eventMap['[Bad]'] = {});

				(skinMap[eventInfo] || (skinMap[eventInfo] = [])).push({ hex, crc32 });
			}
		}
	}

	for(const [skin_, skinMap] of Object.entries(eventMap)) {
		const [skin, head] = skin_.split('||');
		const result = [];

		result.push(`# ${head}`);

		const arrCatalog = ['## Catalog:目录'];
		const arrEventList = [];

		for(const [eventName, arrAudioInfo] of Object.entries(skinMap).sort(([a], [b]) => a > b ? 1 : -1)) {
			const eventTitle = `[${findFriendly(eventName, mapFriendly)}]|${eventName}`;

			arrEventList.push(`### ** ${eventTitle}`);

			const arrEventText = [];

			for(const { hex, crc32 } of arrAudioInfo) {
				arrEventText.push(`- >${hex}< CRC32[${crc32}] \`${hex}\` ***`);
			}

			arrEventText.sort();

			arrEventText.forEach(text => arrEventList.push(text.replace(/>.*< /g, '')));

			arrEventList.push('');
		}

		arrCatalog.forEach(text => result.push(text));
		result.push('## Lines:台词');
		arrEventList.forEach(text => result.push(text));

		_fs.writeFileSync(RD('_texts', `[${C.champ}@${C.region}@${C.lang}]${skin.replace(/[:"]/g, '')}@${M().format('X')}.md`), result.join('\n'));
	}
};