import * as merchantAction from '../actions/merchantAction';
import constants from '@/common/constants';

const initialState = {
  currentStep: 1,
  executeAction: false,
  activities: { data: { rows: [] } },
  mustList: [],
  optionList: [],

  //407
  merchantDetail: {
    basicInfo: { //商品详情-基本信息
      categoryId: '', // 商品分类Id
      spuId: '',//SPU_ID
      spuName: '', // 商品名称
      selling: '', //卖点
      images: [],//商品主图
      video: '',//商品视频
      detail: '', //商品详情
      notesToBuy: ''//购买须知
    },
    isNeedExtType: false,
    isNeedExtTypeEqual3: false,
    isThirdCode: false,
    isNotTasting: false
    
  },
  categories: [],
  shopId: '',
  IsAuction: false,  //是否是拍卖商品
  isShowShopSelect: false,
  sequentialMess: {  //新建和编辑批次的页面所有的数据
    show: false,  //是否展示
    isNew: true, //是否是新建
    type: '', //场次还是序列 ，场次：'0'， 序列：'1'
    id: '', // partyId 或 serialNo
    refresh: false  //是否重新请求场次，批次列表
  },
  saleCities: [],
  proUpdateRange: [],
  reduxOnlyView: false,   //因为小会员没有第四步的查看页面，所以单页面得不到商品状态，所以添加一个redux状态
  thirdParties: [], // 第三方商家数据来自filter接口
}

export default (state = initialState, action) => {
  switch (action.type) {
    case merchantAction.MERCHANT_EXECUTE_ACTION: {
      return {
        ...state,
        executeAction: action.payload
      };
    }
    case merchantAction.MERCHANT_NEXT_STEP: {
      const step = action.payload;
      let shopId = state.shopId;
      let max_step = shopId === 5? constants.merchants.NO_DIKAER_STEP:constants.merchants.MAX_STEP;
      let toStep = state.currentStep + step;
      if (toStep >= max_step) {
        toStep = max_step;
      } else if (toStep <= 1) {
        toStep = 1;
      }
      return {
        ...state,
        currentStep: toStep
      };
    }
    case merchantAction.SHOP_CATEGORIES: {
      const res = action.payload;
      return {
        ...state,
        categories: res.categories
      }
    }
    case merchantAction.MERCHANT_DETAIL: {
      const bInfo = Object.assign(state.merchantDetail.basicInfo, action.payload.basicInfo);
      state.merchantDetail.basicInfo = bInfo;
      state.merchantDetail.isNeedExtType = action.payload.isNeedExtType;
      state.merchantDetail.isNeedExtTypeEqual3 = action.payload.isNeedExtTypeEqual3;
      state.merchantDetail.isThirdCode = action.payload.isThirdCode;
      state.merchantDetail.isNotTasting = action.payload.isNotTasting;
      return {
        ...state,
        merchantDetail: { ...state.merchantDetail }
      }
    }
    case merchantAction.SHOP_ID: {
      const shopId = action.payload;
      return {
        ...state,
        shopId: shopId
      }
    }
    case merchantAction.ISAUCTION: {
      const IsAuction = action.payload;
      return {
        ...state,
        IsAuction: IsAuction
      }
    }
    case merchantAction.MERCHANT_SELECT_SHOP: {  //开心小会员打开配置门店和团期弹框
      const isShowShopSelect = action.payload;
      return {
        ...state,
        isShowShopSelect: isShowShopSelect
      }
    }
    case merchantAction.MERCHANT_SHOW_SEQUENTIAL: {  //新建和编辑批次的页面所有的数据
      const sequentialMess = Object.assign(state.sequentialMess, action.payload);
      state.sequentialMess = sequentialMess;
      return {
        ...state,
        sequentialMess: { ...state.sequentialMess }
      }
    }
    case merchantAction.MERCHANT_SALE_CITYS: {  //售卖城市，在小会员中选择门店需要根据商品的售卖城市
      let saleCities = action.payload;
      if (saleCities && saleCities.length === 1 && saleCities[0] == '-1') {
        saleCities = []
      }
      return {
        ...state,
        saleCities: saleCities
      }
    }
    case merchantAction.MERCHANT_PRO_UPDATE: {  //商品上下架时间，在小会员中选择场次需要在商品的上下架时间内
      const proUpdateRange = action.payload;
      return {
        ...state,
        proUpdateRange: proUpdateRange
      }
    }
    case merchantAction.MERCHANT_ONLY_VIEW: {  //页面只能查看状态
      const reduxOnlyView = action.payload;
      return {
        ...state,
        reduxOnlyView: reduxOnlyView
      }
    }
    case merchantAction.MERCHANT_THIRDPARTIES: {
      const thirdParties = action.payload;
      return {
        ...state,
        thirdParties: thirdParties
      }
    }
    default:
      return state;
  }
};
