module.exports = async function saveEve(allSkinEventFileMap) {
	L(`-------saveEve-------`);

	const result = [];

	const eventMap = {};

	for(const [soundID, eventInfos] of Object.entries(allSkinEventFileMap)) {
		const src = RD('_cache', 'sound', `${soundID}.${C.finalFormat}`);

		const crc32 = T.crc32(_fs.readFileSync(src));
		const hex = T.toHexL(soundID, 8);

		for(const eventInfo of eventInfos) {
			const skin = eventInfo.isBase ? 'Base' : eventInfo.skinName.replace(/:/g, '');
			const skinMap = eventMap[skin] || (eventMap[skin] = {});

			(skinMap[eventInfo.name] || (skinMap[eventInfo.name] = [])).push({ hex, crc32 });
		}
	}

	for(const [skin, skinMap] of Object.entries(eventMap)) {
		result.push(`### ${skin}`);

		for(const [eventName, eventInfos] of Object.entries(skinMap)) {
			result.push(`-  | ${eventName}`);

			for(const { hex, crc32 } of eventInfos) {
				result.push(`  - \`${hex}\`: ****** CRC32[${crc32}]`);
			}

			result.push('');
		}
	}

	_fs.writeFileSync(RD('_final', `${C.hero}@${C.lang}.events.md`), result.join('\n'));
};