

const HircSection = require('../entry/bnk/HircSection');

module.exports = async function unpackBnk(file) {
	L(`[Progress][4/4] -------Download-------`);

	const bnkBiffer = Biffer('E:/loldata/assets/sounds/wwise2016/vo/en_us/characters/senna/skins/base/senna_base_vo_events.bnk');

	const hircSection;

	while(!bnkBiffer.isEnd()) {
		let [magic, length] = bnkBiffer.unpack('<4sL');

		if(this.type == 'HIRC') {
			// unused entry count
			B.unpack('L');


			hircSection = HircSection();

			this.subs = [];

			while(!B.isEnd()) {
				const [type, length, id] = B.unpack('BLL');


				this.subs.push(HIRC(type, id).parse(B.sub(length - 4)));
			}
		}

		Hirc.push(HircSection(magic).parse(bnkBiffer.sub(length)));

		L('[Top Section]', magic, length);
	}
};


const fnv_1 = function(name) {
	let h = 0x811c9dc5n;

	for(const c of name) {
		const b = BigInt(c.toLowerCase().charCodeAt(0));

		h = (h * 0x01000193n) % 0x100000000n;
		h = (h ^ b) % 0x100000000n;
	}

	return h;
};

const eventNames = require('./data/events.json');
const eventNameMap = {};

for(const name of eventNames) {
	eventNameMap[fnv_1(name)] = name;
}

const unpackEV = function(hirc) {
	const eventSections = hirc.subs.filter(sub => sub.type == 4);

	for(const eventSection of eventSections) {
		const eventResult = [];

		for(const eActionID of eventSection.eActions) {
			const action = hirc.subs.find(sub => sub.id == eActionID);

			const pool = hirc.subs.find(sub => sub.id == action.hircID);

			if(pool.type == 2) {
				eventResult.push(pool.audioID);
			}
			else if(pool.type == 5) {
				const sounds = hirc.subs.filter(sub => {
					pool.soundIDs.indexOf(sub.id) > -1;
				});

				for(const sound of sounds) {
					eventResult.push(sound.audioID);
				}
			}
			else {
				debugger
			}
		}

		L(eventNameMap[eventSection.id], eventSection.id, ...eventResult);
	}
};

unpackEV(topSections[1]);