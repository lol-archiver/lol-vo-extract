import Hades from '@nuogz/hades';

import { dirLog } from './global.dir.js';
import C from './global.config.js';


// Hades Log
process.env.OUTPUT_FORMAT = 'hades';
process.env.OUTPUT_LOCALE = C.log?.lang?.split('_').join('-');

const G = new Hades(C.log.name, C.log.level, dirLog, C.log);


export default G;