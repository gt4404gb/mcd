import * as tomatoActions from '../actions/tomatoActions';
import moment from 'moment';

const initialState = {
  activityDetail: {
    "basicInfo": { //活动信息
      "activityId": undefined, // 活动ID
      "activityCode": "", // 活动CODE
      "activityName": "", // 活动名称
      "activityType": 1, //活动类型 1：红包
      "activityCoverImg": "", //活动封面
      "activityMsgImg": "", //小程序消息封面图
      "posterImg": "", //海报分享图
	    "posterTitle": "", //海报标题
      "posterSubtitle": "", //海报副标题
      "activityRuleDesc": "", // 活动规则
      "activityBeginTime": null, //活动开始时间
      "activityEndTime": null, //活动结束时间
      "appliedChannelList": [], //适用渠道
      "receiveDayLimit": 0, //枚举：0 不限；1 每天
      "receiveTimeLimit": 0, //非枚举：0 不限; N 为N次
    },
    "summaryInfo": { //活动概况 如果活动类型为红包时返回
      "redpacket": {
        "totalCount": 0, // 红包总数
        "unusedCount": 0, // 未使用数
        "releasingCount": 0, // 发放中数量
        "completedCount": 0 // 已发完数量
      },
      "coupon": {
        "totalCount": 0, // 券总数
        "unclaimedCount": 0, // 未领取数量
        "claimedCount": 0 // 已领取数量
      }
    },
    dateRange:[]
  },
  activities: { data: { rows: [] } },
  redpacketCollections: { data: { rows: [] } },
  redpacketCollectionDetail: {
    "collectionId": 456, // 红包集ID
    "activityCode": "90235345", // 活动CODE
    "activityName": "元旦大联欢", // 活动名称
    "appliedChannels": ['03', '08'],
    "totalCount": 900, // 红包总数
    "canClaimedTimes": 300, // 可领取次数
  },
  mustList: [],
  optionList: []
}

export default (state = initialState, action) => {
  switch (action.type) {
    case tomatoActions.ACTIVITY_LIST: {
      const response = action.payload;
      return {
        ...state,
        activities: response || { data: { rows: [] } },
      };
    }
    case tomatoActions.ACTIVITY_LIST_UPDATE: {
      return {
        ...state,
        activities: action.payload
      };
    }
    case tomatoActions.ACTIVITY_DETAIL: {
      let resp = action.payload;
      if (resp.data) resp = resp.data;
      const bInfo = resp && resp.basicInfo;
      if (bInfo && bInfo.activityBeginTime && bInfo.activityEndTime) {
        const dateFormat = 'YYYY-MM-DD HH:mm:ss';
        resp.dateRange = [moment(bInfo.activityBeginTime, dateFormat), moment(bInfo.activityEndTime, dateFormat)];
      }
      return {
        ...state,
        activityDetail: resp || {},
      };
    }
    case tomatoActions.ACTIVITY_DETAIL_BASICINFO_UPDATE: {
      state.activityDetail.basicInfo = Object.assign(state.activityDetail.basicInfo, action.payload);
      if (bInfo && bInfo.activityBeginTime && bInfo.activityEndTime) {
        const dateFormat = 'YYYY-MM-DD HH:mm:ss';
        resp.dateRange = [moment(bInfo.activityBeginTime, dateFormat), moment(bInfo.activityEndTime, dateFormat)];
      }
      return {
        ...state,
        activityDetail: { ...state.activityDetail }
      };
    }
    case tomatoActions.ACTIVITY_DETAIL_DEFAULT: {
      return {
        ...state,
        activityDetail: initialState.activityDetail
      };
    }
    case tomatoActions.REDPACKET_COLLECTION_LIST: {
      const response = action.payload;
      return {
        ...state,
        redpacketCollections: response || { data: { rows: [] } },
      };
    }
    case tomatoActions.REDPACKET_COLLECTION_LIST_UPDATE: {
      return {
        ...state,
        activitiess: action.payload
      };
    }
    case tomatoActions.REDPACKET_COLLECTION_DETAIL: {
      let resp = action.payload;
      if (resp.data) resp = resp.data;
      return {
        ...state,
        redpacketCollectionDetail: data || {},
      };
    }
    case tomatoActions.REDPACKET_COLLECTION_DETAIL_BASICINFO_UPDATE: {
      state.redpacketCollectionDetail = Object.assign(state.redpacketCollectionDetail, action.payload);
      return {
        ...state,
        redpacketCollectionDetail: { ...state.redpacketCollectionDetail }
      };
    }
    case tomatoActions.REDPACKET_COLLECTION_DETAIL_DEFAULT: {
      return {
        ...state,
        redpacketCollectionDetail: initialState.redpacketCollectionDetail
      };
    }
    case tomatoActions.REDPACKET_COLLECTION_MUST: {
      const mustList = action.payload;
      return {
        ...state,
        mustList
      }
    }
    case tomatoActions.REDPACKET_COLLECTION_OPTION: {
      const optionList = action.payload;
      return {
        ...state,
        optionList
      }
    }
    default:
      return state;
  }
};
