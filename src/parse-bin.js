import Biffer from '@nuogz/biffer';



/**
 * @param {string} file
 * @returns {string[]}
 */
export default function parseBIN(file) {
	let bifferBin;
	try {
		bifferBin = new Biffer(file);

		const events = [];

		while(true) {
			if(bifferBin.find([0x84, 0xE3, 0xD8, 0x12]) == -1) { break; }

			const [, , , , sizeEvent] = bifferBin.unpack('LBBLL');

			for(let i = 0; i < sizeEvent; i++) {
				const event = bifferBin.unpackString('H');

				events.push(event);
			}
		}


		return events;
	}
	finally {
		bifferBin.close();
	}
}
