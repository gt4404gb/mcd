import {
  call,
  put,
  take,
  all,
  fork,
} from 'redux-saga/effects';

import tomatoSaga from './tomatoSaga';

export default function* rootSaga() {
  yield all([fork(tomatoSaga)]);
}
