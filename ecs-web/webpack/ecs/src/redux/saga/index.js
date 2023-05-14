import {
  call,
  put,
  take,
  all,
  fork,
} from 'redux-saga/effects';

import merchantSaga from './merchantSaga';
import activitySaga from './activitySaga';

export default function* rootSaga() {
  yield all([fork(merchantSaga), fork(activitySaga)]);
}
