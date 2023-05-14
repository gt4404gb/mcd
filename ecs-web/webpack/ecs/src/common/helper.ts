import constants from './constants';

export function getAtivityStatusLabel(value: number) {
  let label: string = '未知';
  const statusCodes: any = constants.activity.STATUS_CODE;
  const labels: any = {
    [statusCodes.NOT_STARTED]: '待发布',
    [statusCodes.ONLINE]: '上线中',
    [statusCodes.OFFLINE]: '已结束'
  }
  label = labels[value] || label;
  return label;
}

export function getActivityStatusColor(status: number) {
  if (status === constants.activity.STATUS_CODE.ONLINE) {
    return 'green';
  } else if (status === constants.activity.STATUS_CODE.OFFLINE) {
    return 'red';
  } else if (status === constants.activity.STATUS_CODE.NOT_STARTED) {
    return '#A0A0A0';
  }
  return 'black';
}

export function getAtivityTypeLabel(type: number) {
  const typeCodes: any = constants.activity.TYPE_CODE;
  const labels: any = {
    [typeCodes.RED_PACKET]: '拍卖',
  }
  return labels[type] || type || '';
}

export function getAtivityStateLabel(value: number) {
  let label: string = '未知';
  const stateCodes: any = constants.activity.STATE_CODE;
  const labels: any = {
    [stateCodes.NOT_STARTED]: '草稿',
    [stateCodes.READY_ONLINE]: '待上线',
    [stateCodes.ONLINE]: '已上线',
    [stateCodes.OFFLINE]: '已下线',
    [stateCodes.OVER]: '已结束'
  }
  label = labels[value] || label;
  return label;
}

export function getAuctionStateLabel(value: number) {
  let label: string = '未知';
  const stateCodes: any = constants.acutionList.STATUS_CODE;
  const labels: any = {
    [stateCodes.AUCTION_IN_PROFGRESS]: '正在竞拍',
    [stateCodes.AUCTION_NO_START]: '即将开拍',
    [stateCodes.AUCTION_SUCCESS]: '竞拍成功',
    [stateCodes.AUCTION_END]: '竞拍结束'
  }
  label = labels[value] || label;
  return label;
}

export function getActivityStateColor(status: number) {
  if (status === constants.activity.STATE_CODE.ONLINE) {
    return 'green';
  } else if (status === constants.activity.STATE_CODE.READY_ONLINE) {
    return 'orange';
  } else if (
    status === constants.activity.STATE_CODE.OFFLINE
    || status === constants.activity.STATE_CODE.OVER
  ) {
    return 'red';
  } else if (status === constants.activity.STATE_CODE.NOT_STARTED) {
    return 'grey';
  }
  return 'black';
}

export function getChannelLabels(values: any) {
  const labels: any = [];
  values.map((val: any) => {
    labels.push(getChannelLabel(val));
  })
  return labels;
}

export function getChannelLabel(value: string) {
  const channelCodes: any = constants.CHANNEL;
  const labels: any = {
    [channelCodes.CMA]: 'CMA',
    [channelCodes.WOS]: 'WOS',
    [channelCodes.App]: 'App',
    [channelCodes.NewWeb]: 'NewWeb',
    [channelCodes.CallCenter]: '电话订餐',
    [channelCodes.WeChatMcDMP]: 'i麦当劳小程序',
    [channelCodes.WeChatPickupMP]: 'i麦当劳点餐微信小程序',
    [channelCodes.AliPayPIckupMP]: 'i麦当劳点餐支付宝小程序',
    [channelCodes.WeChatDeliveryMP]: 'i麦乐送微信小程序',
    [channelCodes.WeChatMcCafeMP]: 'i麦咖啡微信小程序',
    [channelCodes.WeChatDKMP]: 'i甜品站微信小程序',
    [channelCodes.InStore]: '线下门店',
    [channelCodes.POS]: 'POS',
    [channelCodes.SOK]: 'SOK',
    [channelCodes.WeChatShelfMP]: '超值好礼微信小程序',
    [channelCodes.WeChatGiftMP]: '麦有礼微信小程序',
    [channelCodes.WeChatWalletMP]: '麦钱包余额小程序',
    [channelCodes.WeChatFamilyMP]: '麦当劳生日会微信小程序',
    [channelCodes.MeiTuan]: '美团',
    [channelCodes.Eleme]: '饿了么',
    [channelCodes.AlibabaiStore]: '阿里轻店铺',
    [channelCodes.Douyin]: '抖音',
    [channelCodes.AppShelf]: 'App超值好礼',
    [channelCodes.CRM]: 'CRM',
    [channelCodes.IRMS]: 'IRMS',
    [channelCodes.MA]: 'MA',
    [channelCodes.CMAPoint]: 'CMA积点兑换',
    [channelCodes.Sandload]: '非码',
    [channelCodes.QIY]: '爱奇艺',
    [channelCodes.JD]: '京东',
    [channelCodes.HuaWei]: '华为',
    [channelCodes.Ctrip]: '携程',
    [channelCodes.SurveyMP]: 'Survey小程序',
    [channelCodes.WeChatOA]: '微信公众号',
    [channelCodes.WechatH5]: '微信H5',
    [channelCodes.QQ]: 'QQ',
    [channelCodes.ZhongXin]: '中信',
    [channelCodes.Tmall]: '天猫',
    [channelCodes.Taobao]: '淘宝',
    [channelCodes.MeiTuanPickup]: '美团Pickup',
    [channelCodes.DianPingPickup]: '点评Pickup',
    [channelCodes.AlibabaOffline]: '口碑线下码',
    [channelCodes.WeChatCommunity]: '微信社群',
  }
  return labels[value] || value;
}

export function getChannelOptions(): any {
  const options: any = [];
  Object.keys(constants.CHANNEL).map((code: any) => {
    const value: string = constants.CHANNEL[code];
    options.push({
      label: getChannelLabel(value),
      value
    });
  });
  return options;
}

export function getAtivityChannelLabel(value: string) {
  let label: string = '未知';
  const channelCodes: any = constants.activity.CHANNEL;

  const labels: any = {
    [channelCodes.APP]: '社群 - APP',
    [channelCodes.ICC]: '社群 - ICC',
    [channelCodes.RGM]: '社群 - RGM'
  }

  label = labels[value] || label;
  return label;
}

export function getOrderTypeLabel(value: number) {
  let label: string = '未知';
  const orderFoodType: any = constants.ORDER_FOOD_TYPE;
  const labels: any = {
    [orderFoodType.MCD_TAKE_AWAY]: '麦乐送',
    [orderFoodType.MCD_CAFE]: '麦咖啡',
    [orderFoodType.MCD_IN_PERSON]: '到店取餐'
  }
  label = labels[value] || label;
  return label;
}

export function getAtivityChannelOptions(): any {
  const options: any = [];
  Object.keys(constants.activity.CHANNEL).map((code: any) => {
    const value: string = constants.activity.CHANNEL[code];
    options.push({
      label: getAtivityChannelLabel(value),
      value
    });
  });
  return options;
}

export function getAtivityTypeOptions(): any {
  const options: any = [];
  Object.keys(constants.activity.TYPE_CODE).map((code: any) => {
    const value: number = constants.activity.TYPE_CODE[code];
    options.push({
      label: getAtivityTypeLabel(value),
      value
    });
  });
  return options;
}

export function getAtivityStateOptions(): any {
  const options: any = [];
  Object.keys(constants.activity.STATE_CODE).map((code: any) => {
    const value: number = constants.activity.STATE_CODE[code];
    options.push({
      label: getAtivityStateLabel(value),
      value
    });
  });
  return options;
}

export function getPartyTime(): any {
  const options: any = [
    { label: '0.5', value: 1 },
    { label: '1', value: 2 },
    { label: '1.5', value: 3 },
    { label: '2', value: 4 },
    { label: '2.5', value: 5 },
  ];
  return options;
}

//新，调用接口，更新于20210915
export function getEachOptions(list: any) {
  let options: any = [];
  list.forEach((item: any) => {
    Object.keys(item).map((key: any) => {
      if (key) {
        item.value = Number(key);
        item.label = item[key];
      }
    })
    options.push(item)
  })
  return options;
}

export function modifyCategoriesData(data: any) {
  if (data && data.length > 0) {
    data.map((item: any) => {
      item.key = item.ruleId;
      item.value = item.ruleId;
      item.title = item.name;
      if (item.subCategories && item.subCategories.length > 0) {
        modifyCategoriesData(item.subCategories);
        item.children = item.subCategories
      }
    });
  }
  return data;
};

export function getAtivityStatusOptions(): any {
  const options: any = [];
  Object.keys(constants.activity.STATUS_CODE).map((code: any) => {
    const value: number = constants.activity.STATUS_CODE[code];
    options.push({
      label: getAtivityStatusLabel(value),
      value
    });
  });
  return options;
}

export function getAuctionStateOptions(): any {
  const options: any = [];
  Object.keys(constants.acutionList.STATUS_CODE).map((code: any) => {
    const value: number = constants.acutionList.STATUS_CODE[code];
    options.push({
      label: getAuctionStateLabel(value),
      value
    });
  });
  return options;
}

export function getRedpacketStatusLabel(value: number) {
  let label: string = '未知';
  const statusCodes: any = constants.redpacket.STATUS_CODE;
  const labels: any = {
    [statusCodes.IN_PROGRESS]: '上线中',
    [statusCodes.OFFLINE]: '已下线'
  }
  label = labels[value] || label;
  return label;
}

export function getRedpacketStatusOptions(): any {
  const options: any = [];
  Object.keys(constants.redpacket.STATUS_CODE).map((code: any) => {
    const value: number = constants.redpacket.STATUS_CODE[code];
    options.push({
      label: getRedpacketStatusLabel(value),
      value
    });
  });
  return options;
}

export function getOrderTypeOptions(): any {
  const options: any = [];
  Object.keys(constants.ORDER_FOOD_TYPE).map((code: any) => {
    const value: number = constants.ORDER_FOOD_TYPE[code];
    options.push({
      label: getOrderTypeLabel(value),
      value
    });
  });
  return options;
}


export function getRedpacketUseStatusLabel(value: number) {
  let label: string = '未知';
  const statusCodes: any = constants.redpacket.USE_STATUS_CODE;
  const labels: any = {
    [statusCodes.UNUSE]: '待使用',
    [statusCodes.GIVEOUT]: '发放中',
    [statusCodes.FINISHED]: '已发完'
  }
  label = labels[value] || label;
  return label;
}

export function getRedpacketUseStatusOptions(): any {
  const options: any = [];
  Object.keys(constants.redpacket.USE_STATUS_CODE).map((code: any) => {
    const value: number = constants.redpacket.USE_STATUS_CODE[code];
    options.push({
      label: getRedpacketUseStatusLabel(value),
      value
    });
  });
  return options;
}

export function sanitizeToInteger(value: any) {
  const regexpLimitDecimals = /^(0+)|\.|[^\d]+/g;
  if (!value) value == '';
  value += '';
  return value?.replace(regexpLimitDecimals, '');
}

export function sanitizeToInteger0(value: any) {
  const regexpLimitDecimals = /^(-1+)|\.|[^\d]+/g;
  if (!value) value == '';
  value += '';
  return value?.replace(regexpLimitDecimals, '');
}

export function getMerchantChannelOptions(filterObj: any): any {
  filterObj.map((item: any, index: any) => {
    if (item) {
      item.label = item.v;
      item.value = item.k;
    }
  })
  return filterObj;
}

export function getB2bManager(result: any): any {
  result.map((item: any, index: any) => {
    if (item) {
      item.label = item.merchantName;
      item.value = item.merchantId;
    }
  })
  return result;
}



export function skuListToShopType(skus: any): any {
  const skuModels: any = {};
  skus.forEach((sku: any) => {
    sku.specList.forEach((spec: any) => {
      skuModels[spec.specMain] = skuModels[spec.specMain] || {};
      const st = skuModels[spec.specMain];
      st.specMain = spec.specMain;
      st.models = st.models || [];
      const labels = st.models.map((item: any) => item.specItem);
      if (!labels.includes(spec.specItem))
        st.models.push({ specMain: spec.specMain, specItem: spec.specItem, specItemEn: spec.specItemEn, specImage: spec.specImage, specMainId: spec.specMainId });
    })
  })
  return Object.values(skuModels);

}

export function shopTypeToSkuList(skuList: any): any {
  let arr: any = [];
  skuList.forEach((item: any) => [
    item.specList.forEach((len: any) => {
      let _arr = [];
      _arr.push({
        type: len.specItem,
        img: len.specImage || ''
      })
      arr.push({
        name: len.specMain,
        typeNames: _arr
      })
    })
  ])
  return arr;
}

export function imagesExtra(shopId: any) {
  if (shopId == 5) {
    return '主题活动的商品图，只能上传单张';
  } else {
    return '所有图片尺寸需要保持一致，要么全部上传横图，要么全部上传竖图。横图1035*621像素，竖图1035*1380像素。图片数量最少1张，最多20张';
  }
}

export function dikaerTip(shopId: any) {
  return '如果有面值、颜色、尺寸等多种规格，需要维护商品规格'
}

export function getShopName(shopId: any) {
  if (shopId == 2) {
    return '(积分)'
  } else if (shopId == 3) {
    return '(积点)'
  } else {
    return ''
  }
}

export function getBetweenDateStr(start: any, end: any) {
  if (start.toString() === end.toString()) {
    return [start.toString()];
  }

  var result = [];
  var beginDay = start.split("-");
  var endDay = end.split("-");
  var diffDay = new Date();
  var dateList = new Array;
  var i = 0;
  diffDay.setDate(beginDay[2]);
  diffDay.setMonth(beginDay[1] - 1);
  diffDay.setFullYear(beginDay[0]);
  result.push(start);
  while (i == 0) {
    var countDay = diffDay.getTime() + 24 * 60 * 60 * 1000;
    diffDay.setTime(countDay);
    dateList[2] = diffDay.getDate();
    dateList[1] = diffDay.getMonth() + 1;
    dateList[0] = diffDay.getFullYear();
    if (String(dateList[1]).length == 1) { dateList[1] = "0" + dateList[1] };
    if (String(dateList[2]).length == 1) { dateList[2] = "0" + dateList[2] };
    result.push(dateList[0] + "-" + dateList[1] + "-" + dateList[2]);
    if (dateList[0] == endDay[0] && dateList[1] == endDay[1] && dateList[2] == endDay[2]) {
      i = 1;
    }
  };
  return result;
};

export function timeSlot() {   //  间隔半小时
  let timeArr: any = [];
  for (let i: any = 0; i <= 24; i++) {   //  stepM * f = 24H*60M
    let hourStep = Math.floor(i / 2);
    let hour = 9 + hourStep;
    let minu = i % 2 === 1 ? '30' : '00';
    timeArr.push(
      {
        value: hour + ':' + minu,
        label: hour + ':' + minu,
      }
    )
  }
  return timeArr
}
export function getThirdPartyName(arr: any, value: any, style: any) {
  let label = '';
  arr.forEach((item: any) => {
    if (item.value === value) {
      label = item[style]
    }
  });
  return label
}

export function getCascaderDataId(data: any) {
  return data.slice(-1).toString()

}

export function ab2str(buff: any, callback: any) {
  const b: any = new Blob([buff]);
  const r: any = new FileReader();
  r.readAsText(b, "UTF-8");
  r.onload = () => {
    if (callback) {
      let resp: any = {};
      try {
        resp = JSON.parse(r.result);
      } catch (e: any) { }
      callback.call(null, resp);
    }
  };
}

export function getAppUrl(shopId: any, spuId: any, spuType: any) {
  let url = '';
  if (shopId == '1' || shopId == '2' || shopId == '3') {
    url = `mcdapp://page?iosPageName=MCDMallDetailViewController&androidPageName=ComponentMall&androidPageAction=mall_product_detail&parameters={"shopId":"${shopId}","spuId":"${spuId}"}`;
  } else if (shopId == '5') {
    //小会员
    if (spuType == 1) {
      url = `mcdapp://page?iosPageName=MCDReactNativeViewController&androidPageName=com.mcd.library.rn.McdReactNativeActivity&parameters={"rctModule":"mcdmall","rctModuleName":"mallHappyMember","rctModuleParams":{"spuId":"${spuId}","shopId":"${shopId}"}}`
    } else {
      //其它
      url = `mcdapp://page?iosPageName=MCDReactNativeViewController&androidPageName=com.mcd.library.rn.McdReactNativeActivity&parameters={"rctModule":"mcdmall","rctModuleName":"mallTastingDetail","rctModuleParams":{"spuId":"${spuId}","shopId":"${shopId}"}}`
    }
  }
  return url;
}

export function getAlipayUrl(shopId: any, spuId: any, spuType: any) {
  let url = '';
  const linkParam = 'shopId=' + shopId + '&spuId=' + spuId;
  const encodeQuery = encodeURIComponent(linkParam);
  if (shopId == '1' || shopId == '2' || shopId == '3') {
    url = "alipays://platformapi/startapp?appId=2017090708602953&page=mall/pages/detail/mallProductDetail" + '&query=' + encodeQuery;
  } else if (shopId == '5') {
    //小会员
    if (spuType == 1) {
      url = "alipays://platformapi/startapp?appId=2017090708602953&page=mall/pages/happyMemberDetail/index" + '&query=' + encodeQuery;
    } else {
      //其它
      url = "alipays://platformapi/startapp?appId=2017090708602953&page=mall/pages/happyTaste/detail" + '&query=' + encodeQuery;
    }
  }
  return url;
}

export function getWeappUrl(shopId: any, spuId: any, spuType: any) {
  let url = '';
  if (shopId == '1' || shopId == '2' || shopId == '3') {
    url = 'mall/pages/detail/mallProductDetail';
  } else if (shopId == '5') {
    //小会员
    if (spuType == 1) {
      url = 'mall/pages/happyMemberDetail/index'
    } else {
      url = 'mall/pages/happyTaste/detail'
    }
  }
  return url;
}

export function getSecond(time:any) {
  let result = 0;
  result = (time.format('HH')) * 3600 + (time.format('mm')) * 60 + (time.format('ss'))
  return Number(result);
}

export function getChannelsName(channels:any) {
  let str = '', arr:any =[];
  if(channels.length > 0) {
    channels.forEach((code:any) => {
      arr.push(constants.CHANNELS[code])
    })
    str = arr.join('/')
  }
  return str;
}

export function getSubCategoriesFirstChild(arr:any) {
  var str = '';
  if(arr && arr.length>0) {
    if(arr[0].subCategories && arr[0].subCategories.length > 0) {
      let data = arr[0].subCategories
      if(data[0].subCategories && data[0].subCategories.length > 0) {
        let subData = data[0].subCategories;
        if(subData[0].subCategories && subData[0].subCategories.length > 0) {
          //....目前只有三层
        } else {
          str= subData[0].subRuleIds;
        }
      } else {
        str= data[0].subRuleIds;
      }
    } else {
      str= arr[0].subRuleIds;
    }
  }
  return str;
}