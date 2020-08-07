class Biffer {
	constructor(raw: Buffer | string);

	buffer: Buffer;
	path?: string;

	pos: number = 0;
	length: number;

	unpack(format: string): string;
	tell(): number;
	raw(length: number): Buffer;
	sub(length: number): Biffer;
	seek(position: number): number;
	skip(position: number): number;
	find(from: Array): number;
	findFromStart(from: Array): number;
	unpackString(format: string = 'L'): string;
	isEnd(): boolean;
};

export default Biffer;