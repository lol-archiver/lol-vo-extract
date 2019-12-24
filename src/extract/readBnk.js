const HircSound = require('../entry/bnk/HircSound');
const HircEvent = require('../entry/bnk/HircEvent');
const HircPool = require('../entry/bnk/HircPool');
const HircAction = require('../entry/bnk/HircAction');

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

module.exports = async function readBnk(bnkPath, allEvents) {
	L(`-------readBnk ${_pa.parse(bnkPath).base}-------`);

	const bnkBiffer = Biffer(bnkPath);

	const entries = [];

	while(!bnkBiffer.isEnd()) {
		const [magic, sectionSize] = bnkBiffer.unpack('4sL');

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
		else {
			bnkBiffer.skip(sectionSize);

			if(magic != 'BKHD') {
				L(magic);
			}
		}
	}

	const eventNameMap = {};
	const eventFileMap = {};

	for(const event of allEvents) {
		const hash = fnv_1(event);

		eventNameMap[hash] = event;
	}

	const eventSections = entries.filter(entry => entry instanceof HircEvent);

	for(const eventSection of eventSections) {
		const eventSounds = [];

		if(eventSection.count) {
			for(const actionID of eventSection.eventActions) {
				const action = entries.find(entry => entry.id == actionID);

				const actionSound = entries.find(entry => entry.id == action.hircID);

				if(actionSound instanceof HircSound) {
					eventSounds.push(actionSound.audioID);
				}
				else if(actionSound instanceof HircPool) {
					const sounds = entries.filter(entry => actionSound.soundIDs.indexOf(entry.id) > -1);

					for(const sound of sounds) {
						eventSounds.push(sound.audioID);
					}
				}
				else if(!actionSound) {
					L(`[WARNING] UnFind Entry Sound`);
				}
				else {
					L(`[WARNING] Unknown Entry Sound Type`);
				}
			}
		}

		for(const sound of eventSounds) {
			const soundMap = eventFileMap[sound] || (eventFileMap[sound] = []);

			const eventName = eventNameMap[eventSection.id];

			if(!eventName) {
				L(`[WARNING] Unknown Event Section ID ${eventSection.id}`);

				continue;
			}

			soundMap.push(eventName);
		}
	}

	return eventFileMap;
};
