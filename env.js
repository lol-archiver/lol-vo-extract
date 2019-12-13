
global._fs = require('fs');
global._pa = require('path');
global._as = require('assert');
global._ul = require('url');

global.Axios = require('axios');
global.Fex = require('fs-extra');
global.Zstd = require('node-zstandard');

let logs = [];

global.L = function(...argv) {
	(console || {}).log(...argv);

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
		_fs.writeFileSync(path, logs.join('\r\n'));
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
		_fs.writeFileSync('./_cache/zstd', buffer);

		await new Promise((resolve, reject) => Zstd.decompress('./_cache/zstd', path, err => err ? reject(err) : resolve()));

		if(returnBuffer) {
			return _fs.readFileSync(path);
		}
	},
	toHexL(number) {
		const hex = number.toString(16).toUpperCase();

		const hexArr = [];
		for(let i = 0; i < hex.length; i += 2) {
			hexArr.push(hex.slice(i, i + 2));
		}

		return hexArr.reverse().join('');
	}
};

try {
	global.C = require('./config');
} catch (error) {
	L('[Config] Default');
	global.C = require('./config.default');
}

global.Biffer = require('./src/util/Biffer');