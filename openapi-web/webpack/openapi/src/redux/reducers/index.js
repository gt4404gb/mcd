import { combineReducers } from 'redux';
import appReducers from './appReducers';
import tomatoReducers from './tomatoReducers';

const rootReducer = combineReducers({
  app: appReducers,
  tomato: tomatoReducers,
});

export default rootReducer