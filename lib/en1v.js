
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