import { combineReducers } from 'redux';
import appReducers from './appReducers';
import activityReducers from './activityReducers';
import merchantReducers from './merchantReducers';
import orderReducers from './orderReducers';

const rootReducer = combineReducers({
  app: appReducers,
  activity: activityReducers,
  merchant: merchantReducers,
  order: orderReducers
});

export default rootReducer