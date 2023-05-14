import {setPublicPath} from 'systemjs-webpack-interop';

const config = require('../config');
setPublicPath('@mf/' + config.projectName);
