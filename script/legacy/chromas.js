import AS from 'assert';
import { appendFileSync } from 'fs';

import { G } from '../../lib/global.js';
import { en_us as dataE, zh_cn as dataZ } from '../../lib/database.js';


const ids =
	// ['10.20', '064031', '875009', '022023', '136011', '063008', '875008']
	// ['10.19', '360000', '157035', '007029', '010015', '555025', '360001', '112005', '238015']
	// ['10.18', '037017', '081023', '115023', '081022', '011033', '098022', '254020']
	// ['10.17']
	// ['10.16', '777000', '103027', '069009', '203003', '092023', '777001']
	// ['10.15', '876000', '412017', '017027', '876001', '017025', '067014', '157036']
	// ['10.14', '142019', '111006', '096019', '035015', '142018', '030010', '161004', '085008']
	// ['10.13', '074015', '059011', '061011', '134007', '163003', '084004', '085004', '098003']
	// ['10.12', '235010', '056016', '039018', '202001', '009003']
	// ['10.11', '106000', '432008', '150015', '078016', '106006', '111003', '017004']
	// ['10.10', '236019', '245028', '114041', '080016', '236018', '051011', '092018', '098015', '004011']
	// ['10.09', '041021', '064029', '054025', '412015', '067015']
	// ['10.08', '025026', '143006', '007020', '143005']
	// ['10.07', '009000', '009006', '018033', '006015', '045023', '057016', '090009', '014014']
	// ['10.06', '099018', '099017', '054024', '054023', '082006', '101005', '091020', '044009', '029027', '059007', '061007', '412005', '110006']
	// ['10.05', '113015', '012022', '421009', '058018']
	// ['10.04', '055021', '011024', '023010']
	// ['10.03', '235009', '222029', '350011']
	// ['10.02', '040020', '107023', '013013', '131018', '002016', '048006']
	// ['10.01', '875000', '024014', '086023', '119013', '086022', '089012', '875001', '517008']
	// ['09.24', '523000', '016015', '016016', '064028', '050011', '043019', '523001', '064027', '076011', '201024', '028008', '115014', '026006']
	// ['09.23', '412014', '266009', '412013']
	// ['09.22', '235000', '245019', '246010', '084015', '246002', '235001', '157018']
	// ['09.21', '001012', '021018', '021020', '038006', '053022']
	// ['09.20', '022017', '122016', '120008']
	// ['09.19', '092022', '013011', '032023', '025017', '267015', '092020']
	// ['09.18', '497005', '498004', '518011', '518010', '142009']
	// ['09.17', '103017', '056007', '045013', '003013', '098016', '110009']
	// ['09.16', '080000', '033016', '077005']
	// ['09.15', '555016', '039017', '084014', '039016', '222020', '019016']
	// ['09.14', '086014', '236009']
	// ['09.13', '246000', '051020', '051019', '145017', '246001', '157017']
	['09.12', '082000', '202005', '043008', '035008']
		.map(id => [~~id.substr(0, 3), ~~id.substr(3, 3)]);
ids.shift();

const namesChroma_color = {
	'#27211C': 'Obsidian', '#2756CE': 'Sapphire', '#2DA130': 'Emerald', '#54209B': 'Tanzanite', '#5F432B': 'Meteorite', '#6ABBEE': 'Aquamarine',
	'#73BFBE': 'Turquoise', '#85827F': 'Granite', '#9C68D7': 'Amethyst', '#9F4A25': 'Jasper', '#B6E084': 'Peridot', '#C1F2FF': 'Rainbow',
	'#D33528': 'Ruby', '#DED6B0': 'Sandstone', '#DF9117': 'Citrine', '#E58BA5': 'Rose Quartz', '#ECF9F8': 'Pearl', '#FF2C25': 'Amber',
	'#FFC948': 'Golden', '#FFEE59': 'Catseye',

	'#88FF00#00B170': 'Jadeclaw', // 10.20
	'#B2D1E4#3CABFF': 'Hunter', // 10.18
	'#0C0C0F#B2D1E4': 'Night', // 10.16
	'#162D57#A50031': 'Chrono', // 10.11, 10.10
	'#0C0C0F#9B1520': 'Elite', // 10.09
	'#000000#A50031': 'Antimatter', // 10.06
	'#0C0E15#611B9E': 'Peacekeeper', // 10.01
	'#6FFDFF#2377FF': 'Paragon', // 09.24
	'#C33C3E#0C0E15': 'Pariah', // 09.24
	'#E58BA5#6FFDFF': 'Sweet Tooth', // 09.24
	'#BD1357#19182A': 'Freestyle', // 09.22
	'#95ECFF#C33C3E': 'Nomad', // 09.20
	'#E0FFFF#C50041': 'Heavenly Crane', // 09.19
	'#FF5500#162B30': 'Reckoning', // 09.15
	'#611B9E#19E888': 'Neon Noir', // 09.14
	'#A5FFF8#D87BFF': 'K.O.', // 09.13

	'#2377FF': 'Sapphire', // 09.17
};

const resultN = [];
const resultC = [];

for(const [hid, sid] of ids) {
	G.info(hid, sid);

	const heroE = dataE[hid];
	const heroZ = dataZ[hid];
	const skinE = heroE.skins[sid];
	const skinZ = heroZ.skins[sid];
	const chromasE = Object.values(skinE.chromas);
	const chromasZ = Object.values(skinZ.chromas);

	G.info(skinE.name);
	G.info(skinZ.name);

	AS(chromasE.length == chromasZ.length);

	const rN = [[], []];
	const rC = [[], []];
	// const rN = sid == 0 ? [[heroE.name], [heroZ.name]] : [[skinE.name], [skinZ.name]];
	// const rC = sid == 0 ? [[heroE.name], [heroZ.name]] : [[skinE.name], [skinZ.name]];

	const rNE = rN[0];
	const rNZ = rN[1];
	const rCE = rC[0];
	const rCZ = rC[1];

	for(let i = 0; i < chromasZ.length; i++) {
		const chromaE = chromasE[i];
		const chromaZ = chromasZ[i];

		const color1E = chromaE.colors[0];
		const color2E = chromaE.colors[1];
		const color1Z = chromaZ.colors[0];
		const color2Z = chromaZ.colors[1];

		AS(chromaE.id == chromaZ.id);
		AS(color1E == color1Z);
		AS(color2E == color2Z);

		rNE.push((color1Z == color2Z ? namesChroma_color[color1E] : namesChroma_color[color1E + color2E]) || '****');
		rNZ.push(chromaZ.name.replace(skinZ.name, '').trim());
		rCE.push(color1Z);
		rCZ.push(color1Z != color2Z ? color2Z : '');
	}

	if(chromasZ.length == 0) {
		if(skinZ.name.includes('至臻')) {
			rNE.push('至臻');
			rCE.push('#FFFF66');
		}
		else if(Object.values(heroZ.skins).filter(({ name: n }) => n && n.includes('至臻') && n.includes(skinZ.name.trim())).length) {
			rNE.push('至臻炫彩');
			rCE.push('#F8CBAD');
		}
		else {
			rNE.push('无');
			rCE.push('#FFFFFF');
		}
	}

	resultN.push(rN);
	resultC.push(rC);
}

appendFileSync('./_final/chromas.txt', [
	'\n-------',
	resultN.map(l => l.map(s => s.join('\t')).join('\n')).join('\n'),
	'-------',
	resultC.map(l => l.map(s => s.join('\t')).join('\n')).join('\n'),
].join('\n'));
