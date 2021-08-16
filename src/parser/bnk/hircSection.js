import HIRCEntry from './hircEntry.js';


export default function HircSection(type) {
	if(!(this instanceof HircSection)) {
		return new HircSection(...arguments);
	}

	this.type = type;

	this.parse = function(B) {
		if(this.type == 'BKHD') {
			const [version, id, unknown1, unknown2] = B.unpack('LLLxxxxL');

			this.version = version;
			this.id = id;
			this.unknown1 = unknown1;
			this.unknown2 = unknown2;
		}
		if(this.type == 'HIRC') {
			const [count] = B.unpack('L');

			this.count = count;
			this.subs = [];

			while(!B.isEnd()) {
				const [type, length, id] = B.unpack('BLL');
				this.subs.push(HIRCEntry(type, id).parse(B.sub(length - 4)));
			}
		}

		return this;
	};
}