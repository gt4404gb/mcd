import {combineReducers} from 'redux';
import appReducers from './appReducers';
import systemReducers from './systemReducers';

const rootReducer = combineReducers({
    app: appReducers,
    system: systemReducers,
});

export default rootReducer