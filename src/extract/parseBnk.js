const HircSound = require('../entry/bnk/HircSound');
const HircEvent = require('../entry/bnk/HircEvent');
const HircPool = require('../entry/bnk/HircPool');

const parseHircEntry = require('../parser/bnk/hircEntry');

const fnv_1 = function(name) {
	let h = 0x811c9dc5n;

	for(const c of name) {
		const b = BigInt(c.toLowerCase().charCodeAt(0));

		h = (h * 0x01000193n) % 0x100000000n;
		h = (h ^ b) % 0x100000000n;
	}

	return h;
};

module.exports = async function parserBnk(bnkPath, events) {
	L('-------parserBnk-------');

	const bnkBiffer = Biffer(bnkPath);

	const entries = [];

	while(!bnkBiffer.isEnd()) {
		let [magic, sectionSize] = bnkBiffer.unpack('4sL');

		if(magic == 'HIRC') {
			const sectionBiffer = bnkBiffer.sub(sectionSize);

			const [count] = sectionBiffer.unpack('L');

			for(let i = 0; i < count; i++) {
				const [type, length, id] = sectionBiffer.unpack('BLL');

				const entry = parseHircEntry(type, id, sectionBiffer.sub(length - 4));

				if(entry) {
					entries.push(entry);
				}
			}
		}
	}

	const eventNameMap = {};
	const eventFiles = [];

	for(const [idx, name] of events) {
		const hash = fnv_1(name);

		(eventNameMap[hash] || (eventNameMap[hash] = [])).push(`${idx}-${name}`);
	}

	const eventSections = entries.filter(entry => entry instanceof HircEvent);

	for(const eventSection of eventSections) {
		const eventSounds = [];

		for(const actionID of eventSection.eventActions) {
			const action = entries.find(entry => entry.id == actionID);

			const entrySound = entries.find(entry => entry.id == action.hircID);

			if(entrySound instanceof HircSound) {
				eventSounds.push(entrySound.audioID);
			}
			else if(entrySound instanceof HircPool) {
				const sounds = entries.filter(entry => entrySound.soundIDs.indexOf(entry.id) > -1);

				for(const sound of sounds) {
					eventSounds.push(sound.audioID);
				}
			}
			else {
				debugger
			}
		}

		eventFiles.push([eventNameMap[eventSection.id], eventSounds]);
	}

	return eventFiles;
};
