import { call, put, take, all, fork } from "redux-saga/effects";
import * as actions from "../actions/tomatoActions";
import * as apis from '@/apps/openapi/common/apis';

function* activityList(payload) {
  try {
    const response = yield call(apis.getMerchantModule().list, payload);
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

function* activityDetail(payload) {
  try {
    const response = yield call(apis.getMerchantModule().detail, payload);
    yield put({ type: actions.ACTIVITY_DETAIL, payload: response });
  } catch (e) {
    yield put({ type: actions.ACTIVITY_DETAIL, payload: e });
  }
}

function* activityDetailAsync() {
  while (true) {
    const { payload } = yield take(actions.ACTIVITY_DETAIL_ASYNC);
    yield fork(activityDetail, payload);
  }
}

function* redpacketCollListAsync() {
  while (true) {
    const { payload } = yield take(actions.REDPACKET_COLLECTION_LIST_ASYNC);
    yield fork(function* (payload) {
      try {
        const response = yield call(apis.getMerchantModule().redpacketList, payload);
        yield put({ type: actions.REDPACKET_COLLECTION_LIST, payload: response });
      } catch (e) {
        yield put({ type: actions.REDPACKET_COLLECTION_LIST, payload: e });
      }
    }, payload);
  }
}

export default function* () {
  yield all([fork(activityListAsync), fork(activityDetailAsync), fork(redpacketCollListAsync)]);
}
