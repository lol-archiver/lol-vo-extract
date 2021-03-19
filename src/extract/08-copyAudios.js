module.exports = function copyAudios(mapAudioID_Event, arrAudioPackFile) {
	L(`[Main] Copy audio file`);


	for(const audioPackFile of arrAudioPackFile) {
		const copyWhileEmpty = audioPackFile.startsWith('sfx') ? (C.useSFXLevel >= 2 ? true : false) : true;

		for(let audioFile of _fs.readdirSync(RD('_cache', 'audio', audioPackFile))) {
			const audioID = _pa.parse(audioFile).name;
			const audioIDHex = T.toHexL(audioID, 8);
			const src = RD('_cache', 'audio', audioPackFile, `${audioID}.${C.format}`);

			const events_nameSkin = {};
			const events_audioID = mapAudioID_Event[audioID] || [];

			for(const eventInfo of events_audioID) {
				let nameSkin;
				let event;

				if(typeof eventInfo == 'object') {
					nameSkin = `[${String(C.id).padStart(3, '0')}${String(eventInfo.index).padStart(3, '0')}]${eventInfo.skinName.replace(/[:"]/g, '')}`;
					event = eventInfo.short;
				}
				else if(typeof eventInfo == 'number') {
					nameSkin = '[Bad]';
					event = eventInfo;
				}

				(events_nameSkin[nameSkin] || (events_nameSkin[nameSkin] = [])).push(event);
			}

			if(!events_audioID.length && copyWhileEmpty) {
				(events_nameSkin['[Bad]'] || (events_nameSkin['[Bad]'] = [])).push('Unmatch');
			}

			if(!Object.keys(events_nameSkin).length) { continue; }

			const crc32 = T.crc32(_fs.readFileSync(src));

			for(const [nameSkin, events] of Object.entries(events_nameSkin)) {
				const logsTooLong = [`-------${M().format('YYYY-MM-DD HH:mm:ss')}-------`];

				const pathFolder = RD('_final', `${nameSkin.replace(/[:"]/g, '')}[${C.champ}@${C.region}@${C.lang}]`);

				Fex.ensureDirSync(pathFolder);

				const eventsText = events.join('&');
				const audioText = `[${nameSkin == '[Bad]' ? `${audioID}][${audioIDHex}` : audioIDHex}][${crc32}].${C.format}`;

				try {
					if(eventsText.length > 128) { throw 'eventsText.length > 128'; }

					_fs.copyFileSync(
						src,
						RD(pathFolder, `${eventsText}${audioText}`),
					);
				} catch(error) {
					_fs.copyFileSync(
						src,
						RD(pathFolder, `_EventsTooLong${audioText}`),
					);

					logsTooLong.push(`[${audioIDHex}] ==> ${events.sort().join(' | ')}`);
				}

				if(logsTooLong.length > 1) {
					_fs.appendFileSync(RD(pathFolder, '_EventsTooLong.txt'), '\n' + logsTooLong.join('\n'));
				}
			}
		}
	}
};