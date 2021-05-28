
global._fs = require('fs');
global._pa = require('path');
global._as = require('assert');
global._ul = require('url');
global._cp = require('child_process');
global._cr = require('crypto');

global.Axios = require('axios');
global.Fex = require('fs-extra');
global.Zstd = require('node-zstandard');
global.Gzip = require('node-gzip');

const XXHash = require('xxhashjs');
const CRC32 = require('buffer-crc32');

global.M = require('moment');

global.R = global._pa.resolve;

global.P = {
	// 当前工作目录
	cwd: process.cwd(),
	// 程序目录
	dir: R(__dirname)
};

global.RC = function(...paths) { return global.R(P.cwd, ...paths); };
global.RD = function(...paths) { return global.R(P.dir, ...paths); };

let logs = [];

global.L = function(...argv) {
	(console || {}).log(...argv);

	logs.push(argv.join('\t'));
};

const LogUpdate = require('log-update');
global.LU = function(...argv) {
	LogUpdate(...argv);

	logs.push(argv.join('\t'));
};

global.L.end = function(text, path) {
	if(text) {
		L('END', text);
	}
	else {
		L('END');
	}

	if(path) {
		_fs.writeFileSync(path, logs.join('\n'));
	}
};

global.T = {
	objSort(obj) {
		Object.keys(obj).sort().map(function(key) {
			let val = obj[key];

			delete obj[key];

			obj[key] = val;

			if(val && typeof val == 'object') {
				T.objSort(val);
			}
		});

		return obj;
	},
	async unZstd(path, buffer, returnBuffer = false) {
		_fs.writeFileSync(RD('_cache', 'zstd'), buffer);

		await new Promise((resolve, reject) => Zstd.decompress(RD('_cache', 'zstd'), path, err => err ? reject(err) : resolve()));

		if(returnBuffer) {
			return _fs.readFileSync(path);
		}
	},
	toHexL(number, pad = 0) {
		const hex = BigInt(number).toString(16).toUpperCase().padStart(pad, '0');

		const hexArr = [];
		for(let i = 0; i < hex.length; i += 2) {
			hexArr.push(hex.slice(i, i + 2));
		}

		return hexArr.reverse().join('');
	},
	wadHash(str, isHex = false) {
		if(typeof str != 'string') { throw 'argv not String'; }

		const strLower = str.toLowerCase();
		const strBuffer = Buffer.from(strLower);
		const hashBuffer = Buffer.from(XXHash.h64(strBuffer, 0).toString(16).split(/(?<=^(?:.{2})+)(?!$)/).reverse().map(a => Number(`0x${a}`)));
		const hashHexRaw = hashBuffer.swap64().toString('hex');
		const hashBigInt = BigInt(`0x${hashHexRaw}`);

		if(isHex) {
			const hashBigIntSlice = hashBigInt;
			const hashHex = hashBigIntSlice.toString('16').toUpperCase();
			const hashHexPad = hashHex.padStart(10, '0');

			return hashHexPad;
		}

		return hashBigInt;
	},
	rstHash(str, isHex = false) {
		if(typeof str != 'string') { throw 'argv not String'; }

		const strLower = str.toLowerCase();
		const strBuffer = Buffer.from(strLower);
		const hashBuffer = XXHash.hash64(strBuffer, 0);
		const hashHexRaw = hashBuffer.swap64().toString('hex');
		const hashBigInt = BigInt(`0x${hashHexRaw}`) & 0xffffffffffn;

		if(isHex) {
			const hashBigIntSlice = hashBigInt;
			const hashHex = hashBigIntSlice.toString('16').toUpperCase();
			const hashHexPad = hashHex.padStart(10, '0');

			return hashHexPad;
		}

		return hashBigInt;
	},
	crc32(buffer) {
		try {
			return T.toHexL(CRC32.unsigned(buffer), 8);
		}
		catch(error) {
			return '';
		}
	}
};

try {
	global.C = require('./config');

	for(const { slot, id } of Object.values(require('./data/BaseData/en_us.json'))) {
		if(slot.toLowerCase() == C.champ.toLowerCase()) {
			C.champ = slot;
			C.id = id;
			break;
		}
	}

	if(!(C.detect.array instanceof Array)) {
		C.detect.array = [];
	}

	if(!C.detect.array.length) {
		for(let i = C.detect.min; i <= C.detect.max; i++) {
			C.detect.array.push(i);
		}
	}
} catch(error) {
	L('[Config] Default');

	global.C = require('./config.default');
}

global.Biffer = require('./src/util/Biffer');

process.on('unhandledRejection', (error, promise) => {
	debugger;
});