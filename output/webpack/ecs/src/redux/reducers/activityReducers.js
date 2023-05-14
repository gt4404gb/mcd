import * as activityActions from '../actions/activityActions';
import moment from 'moment';
import constants from '@/common/constants';

const initialState = {
  currentStep: 0,
  executeAction: false,
  activityType:1, // 活动类型拍卖 4:买赠
  rewardDependedFields: {
    maxTimesOfActivityLaunch: 1, // 活动发起次数
    rangeOfPeriod: -1,
    activityEndTime: null,
    maxQtyOfAssistant: null, // 活动助力人数
    rewardTarget: 0,
    state: 0,
    activityType: 2,
    activitySubType: 1,
  },
  activityDetail: {
    "basicInfo": { //活动信息
      "activityType":1,//活动类型拍卖
      "beginTime": null, //活动开始时间
      "endTime":null, //活动结束时间
      "categoryIds":[],
      "mode": 1,//活动形式：1全款; 2保证金
      "name":'', // 活动名称
      "payObjType":1,//支付单位 1:积分;2:现金
      "ruleText":'',//规则描述
      "userCount":-1,//拍卖活动参与用户数：-1不限制
      "userTimes":-1,//单用户可参与次数：-1不限制
      "userOfferTimes":-1,//单用户出价次数？？？
      "partyType": [1]
    },
    dateRange: []
  },
  activities: { data: { rows: [] } },
  mustList: [],
  optionList: [],
  prizeLists: [],  //第二部已关联的活动列表
}

export default (state = initialState, action) => {
  switch (action.type) {
    case activityActions.ACTIVITY_LIST: {
      const response = action.payload;
      return {
        ...state,
        activities: response || { data: { rows: [] } },
      };
    }
    case activityActions.ACTIVITY_EXECUTE_ACTION: {
      return {
        ...state,
        executeAction: action.payload
      };
    }
    case activityActions.ACTIVITY_NEXT_STEP: {
      const step = action.payload;
      let toStep = state.currentStep + step;
      if (toStep >= constants.activity.MAX_STEP) {
        toStep = constants.activity.MAX_STEP;
      } else if (toStep < 0) {
        toStep = 0;
      }

      return {
        ...state,
        currentStep: toStep
      };
    }
    case activityActions.ACTIVITY_LIST_UPDATE: {
      return {
        ...state,
        activities: action.payload
      };
    }
    case activityActions.ACTIVITY_DETAIL: {
      let resp = action.payload;
      if (resp.data) resp = resp.data;
      const bInfo = resp && resp.basicInfo;
      if (bInfo && bInfo.activityStartTime && bInfo.activityEndTime) {
        const dateFormat = 'YYYY-MM-DD HH:mm:ss';
        resp.dateRange = [moment(bInfo.activityStartTime, dateFormat), moment(bInfo.activityEndTime, dateFormat)];
      }
      return {
        ...state,
        activityDetail: resp || {},
      };
    }
    case activityActions.ACTIVITY_DETAIL_BASICINFO_UPDATE: {
      const bInfo = Object.assign(state.activityDetail.basicInfo, action.payload);
      if (bInfo && bInfo.activityStartTime && bInfo.activityEndTime) {
        const dateFormat = 'YYYY-MM-DD HH:mm:ss';
        state.activityDetail.dateRange = [moment(bInfo.activityStartTime, dateFormat), moment(bInfo.activityEndTime, dateFormat)];
      }
      state.activityDetail.basicInfo = bInfo;
      return {
        ...state,
        activityDetail: { ...state.activityDetail }
      };
    }
    case activityActions.ACTIVITY_REWARD_DEPENDED_FIELDS_UPDATE: {
      return {
        ...state,
        rewardDependedFields: { ...state.rewardDependedFields, ...action.payload }
      };
    }
    case activityActions.ACTIVITY_REWARD_DEPENDED_FIELDS_RESET: {
      return {
        ...state,
        rewardDependedFields: {
          maxTimesOfActivityLaunch: 1,
          rangeOfPeriod: -1,
          activityEndTime: null,
          maxQtyOfAssistant: null,
          rewardTarget: 0,
          state: 0,
        }
      };
    }
    case activityActions.ACTIVITY_DETAIL_DEFAULT: {
      return {
        ...state,
        activityDetail: initialState.activityDetail
      };
    }

    case activityActions.ACTIVITY_PRIZE_LISTS: {
      return {
        ...state,
        prizeLists: action.payload
      };
    }

    default:
      return state;
  }
};
