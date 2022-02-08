import Poseidon from '@nuogz/poseidon';

import { dirConfig } from './global.dir.js';


// Poseidon Config
const C = new Poseidon('_,log', dirConfig);


export default C;