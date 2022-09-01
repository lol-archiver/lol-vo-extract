// This library should be removed after fs-extra.js fully supports ESM.

import FSX from 'fs-extra';



export const emptyDirSync = FSX.emptyDirSync;
export const ensureDirSync = FSX.ensureDirSync;
export const readJSONSync = FSX.readJSONSync;
export const removeSync = FSX.removeSync;
