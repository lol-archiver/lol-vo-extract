module.exports = function saveEve(mapAudioID_Event, arrAudioPackFile) {
	L(`[Main] Save Event info for dictaion`);

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
		result.push(`### ${skin}`);

		for(const [eventName, eventInfos] of Object.entries(skinMap)) {
			result.push(`-  | ${eventName}`);

			let arrEventText = [];

			for(const { hex, crc32 } of eventInfos) {
				arrEventText.push(`  - \`${hex}\`: CRC32[${crc32}] ***`);
			}

			for(const text of arrEventText.sort()) {
				result.push(text);
			}

			result.push('');
		}
	}

	_fs.writeFileSync(RD('_final', `${C.hero}@${C.lang}.events.md`), result.join('\n'));
};