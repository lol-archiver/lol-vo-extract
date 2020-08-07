import fs from 'fs';
import path from 'path';
import url from 'url';
import assert from 'assert';
import childProcess from 'child_process';

import axios from 'axios';
import fex from 'fs-extra';
import zstd from 'node-zstandard';
import gzip from 'node-gzip';

import moment from 'moment';
import logUpdate from 'log-update';

import biffer from './src/util/Biffer';

declare global {
	const _fs = fs;
	const _pa = path;
	const _ul = url;
	const _as = assert;
	const _cp = childProcess;

	const Axios = axios;
	const Fex = fex;
	const Zstd = zstd;
	const Gzip = gzip;

	const M = moment;

	const R = _pa.resolve;

	/** Path hub */
	namespace P {
		/** Current work directory */
		const cwd: string;
		/** Program entry directory */
		const dir: string;
	};

	/** Resolves a sequence of paths or path segments into an absolute path with first parameter `Current work directory` */
	declare function RC(...paths: string[]): string;
	/** Resolves a sequence of paths or path segments into an absolute path with first parameter `Program entry directory` */
	declare function RD(...paths: string[]): string;

	/** Prints to `stdout` with newline. */
	declare function L(message?: any, ...optionalParams: any[]): void;
	const LU = logUpdate;

	declare namespace L {
		/** Print `end` with optional text. And write all logs to log file */
		declare function end(message?: any, ...optionalParams: any[]): void;
	}

	/** Tool hub */
	declare namespace T {
		declare function objSort(obj: object): object;
		declare async function unZstd(path: string, buffer: Buffer, returnBuffer: boolean = false): Buffer;
		declare function toHexL(number: number | string, pad: number = 0): string;
		declare function wadHash(str: string): BigInt;
		declare function crc32(buffer: Buffer): string;
	}

	/** Config hub */
	declare const C: object;

	const Biffer = biffer;
}