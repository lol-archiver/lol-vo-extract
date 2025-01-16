declare module '@nuogz/poseidon' {
	interface PoseidonInterface {
		readonly runcom: (string | import('./bases.d.ts').RawRuncomConfig)[];
		readonly default: {
			readonly [key:string] : import('./bases.d.ts').ExtractConfig;
		};
		readonly user: {
			readonly [key:string] : import('./bases.d.ts').ExtractConfig;
		};
		readonly 'event-manual': string[];
	}
}
