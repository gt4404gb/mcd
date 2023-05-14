import { call, put, take, all, fork } from "redux-saga/effects";
import * as actions from "../actions/activityActions";
import * as apis from '@/common/net/apis_activity';

function* activityList(payload) {
  try {
    const response = yield call(apis.getActivityService().list, payload);
    yield put({ type: actions.ACTIVITY_LIST, payload: response });
  } catch (e) {
    yield put({ type: actions.ACTIVITY_LIST, payload: e });
  }
}

function* activityListAsync() {
  while (true) {
    const { payload } = yield take(actions.ACTIVITY_LIST_ASYNC);
    yield fork(activityList, payload);
  }
}

export default function* () {
  yield all([fork(activityListAsync)]);
}
