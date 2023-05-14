const constants: any = {
  ORDER_FOOD_TYPE: {
    MCD_TAKE_AWAY: 1,
    MCD_CAFE: 2,
    MCD_IN_PERSON: 3,
  },
  CHANNEL: { // https://pmo.mcd.com.cn/confluence/pages/viewpage.action?pageId=14555385
    CMA: '01',
    WOS: '02',
    App: '03',
    NewWeb: '04',
    CallCenter: '05',
    WeChatMcDMP: '06',
    WeChatPickupMP: '07',
    AliPayPIckupMP: '08',
    WeChatDeliveryMP: '09',
    WeChatMcCafeMP: '10',
    WeChatDKMP: '11',
    InStore: '12',
    POS: '13',
    SOK: '14',
    WeChatShelfMP: '15',
    WeChatGiftMP: '16',
    WeChatWalletMP: '17',
    WeChatFamilyMP: '18',
    MeiTuan: '19',
    Eleme: '20',
    AlibabaiStore: '21',
    Douyin: '22',
    AppShelf: '23',
    CRM: '24',
    IRMS: '25',
    MA: '26',
    CMAPoint: '27',
    Sandload: '28',
    QIY: '29',
    JD: '30',
    HuaWei: '31',
    Ctrip: '32',
    SurveyMP: '33',
    WeChatOA: '34',
    WechatH5: '35',
    QQ: '36',
    ZhongXin: '37',
    Tmall: '38',
    Taobao: '39',
    MeiTuanPickup: '40',
    DianPingPickup: '41',
    AlibabaOffline: '42'
  },
  activity: {
    MAX_STEP: 1,
    STATUS_CODE: {
      NOT_STARTED: 0, // 待发布（创建成功后默认状态）
      ONLINE: 1, // 上线中（到达开始时间后自动开始，或手动点上线，开始时间自动更新为当前时间）
      OFFLINE: 2, // 已结束（到达活动结束时间或关联的红包已全部发完）
    },
    STATE_CODE: {
      NOT_STARTED: 0, // 草稿
      READY_ONLINE: 1, // 待上线
      ONLINE: 2, // 已上线
      OFFLINE: 3, // 已下线
      OVER: 4, // 已结束
    },
    TYPE_CODE: {
      RED_PACKET: 1, //拍卖
    },
    CHANNEL: { //20210127修改成目前的三个
      APP: '10',
      ICC: '21',
      RGM: '22'
    },
    REWARD: {
      TARGET_ALL: 0, // 全部奖励
      TARGET_ONLY_SENDER: 1, // 仅奖励发起人
      ROLE_SENDER: 1,
      ROLE_ASSISTANT: 2,
      REWARD_WAY_FIXED: 1,
      REWARD_WAY_GENERAL_RANDOM: 2,
    },
    REWARD_WAYS: {
      FIXED: 1, // 固定奖励
      RANDOM: 2, // 随机奖励
      COMBINATION: 3, // 组合奖励
      CUSTOM: 4, // 自定义概率
    },
    SUB_TYPES: {
      TIMED_LOTTERY: 1,
      RT_LOTTERY: 2
    },
    LOTTERY_TYPES: {
      BY_TIME: 1,
      BY_USER: 2,
      BY_TIME_AND_USER: 3,
    }
  },
  redpacket: {
    STATUS_CODE: {
      IN_PROGRESS: 0, // 上线中
      OFFLINE: 1, // 已下线
    },
    USE_STATUS_CODE: {
      UNUSE: 0, // 待使用
      GIVEOUT: 1, // 发放中
      FINISHED: 2 //已发完
    },
  },
  merchants: {
    MAX_STEP: 4,
    NO_DIKAER_STEP: 3
  },
  acutionList: {
    STATUS_CODE: {
      AUCTION_IN_PROFGRESS: 0, // 正在竞拍
      AUCTION_NO_START: 1, // 即将开拍
      AUCTION_SUCCESS: 2, // 竞拍成功
      AUCTION_END: 3, // 竞拍结束
    },
  },
  cycleObj: [
    {
      value: 0,
      name: '不限',
      label: '不限'
    },
    {
      value: 1,
      name: '每天',
      label: '每天'
    },
    {
      value: 7,
      name: '每周',
      label: '每周'
    },
    {
      value: 30,
      name: '每月',
      label: '每月'
    },
    {
      value: 999,
      name: '终身限购',
      label: '终身限购'
    }],
    CHANNELS:{
      '03': 'APP',
      '45': '微信小程序',
      '54': '支付宝小程序',
      '79': 'B2B'
    }
}
export default constants;