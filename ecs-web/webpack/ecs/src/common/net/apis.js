import http from '@omc/boss-https';
import config from '@/common/config/config';
import { OpenLoading, CloseLoading } from '@/redux/actions/appAction';

const httpCtx = http({
  baseUrl: config.BACKEND_ECS_API_BASE_URL,
  openLoading: OpenLoading,
  closeLoading: CloseLoading
});

const httpStockCtx = http({
  baseUrl: config.BACKEND_ECS_STOCK_API_BASE_URL,
  openLoading: OpenLoading,
  closeLoading: CloseLoading
});

export function getMerchantModule() {
  const basePath = '/ecc/commodity';
  const baseScsPath = '/scs/stock/sku';
  const httpShopList = http({
    baseUrl: config.BACKEND_ECS_API_BASE_URL
  });

  
  return {
    filter: (params) => {
      return httpCtx.get(basePath + '/filter', { params });
    },
    list: (params) => {
      return httpCtx.post(basePath + '/list', { params });
    },
    online: (params) => {
      return httpCtx.put(basePath + '/up/' + params.spuId, {});
    },
    offline: (params) => {
      return httpCtx.put(basePath + '/down/' + params.spuId, {});
    },
    addStockAlert: (params) => {
      return httpCtx.get(basePath + '/skuAlert/' + params.spuId, {});
    },
    addStock: (params) => {
      return httpStockCtx.post(baseScsPath + '/incr/' + params.skuId, {params});
    },
    addStockBatch: (params) => {
      return httpStockCtx.post(baseScsPath + '/incr/batch', {params});
    },
    detail: (params) => {
      return httpCtx.get(basePath + '/activity/basic/' + params.activityId, { pathVars: [params.activityId] });
    },
    save: (params) => {
      if (params.activityId) {
        const filterUpdParams = {};
        Object.entries(params).map(([key, value]) => {
          const availableColumns = ['activityName', 'activityCoverImg', 'activityMsgImg', 'bgColor', 'repostMsgList', 'posterImg', 'posterTitle', 'posterSubtitle', 'activityRuleDesc', 'appliedChannelList'];
          if (availableColumns.indexOf(key) !== -1) {
            filterUpdParams[key] = value;
          }
        });
        return httpCtx.put(basePath + '/activity/basic/' + params.activityId, { params: filterUpdParams, pathVars: [params.activityId] }); // 更新
      } else {
        params.activityType = 1; // 恒为1 （活动类型 1：红包）
        return httpCtx.post(basePath + '/activity/basic', { params }); // 新增
      }
    },
    delete: (params) => {
      return httpCtx.delete(basePath + '/activity/basic/' + params.activityId, { pathVars: [params.activityId] });
    },
    redpacketList: (params) => {
      return httpCtx.get(basePath + '/activity/redpacket/collection/list', { params });
    },
    onlineView: (params) => {
      return httpCtx.get(basePath + '/online/view/' + params.spuId, { pathVars: [params.spuId] });
    },
    putOnlineView: (params) => {
      return httpCtx.put(basePath + '/online/edit/' + params.spuId,  { params: params, pathVars: [params.spuId] });
    },

    getShopList: (params) => {
      return httpShopList.get('/ecc/commodity/init/shop', { params });
    },
    isSaveShopId: (params) => {
      return httpShopList.get('/ecc/commodity/shop/check', { params });
    },
    saveShopId: (params) => {
      return httpShopList.put('/ecc/commodity/shop/change', { params });
    }
  }
}

export function getTranscodeService() {
  const baseUrl = config.BACKEND_CMS_API_BASE_URL
  const basePath = '/cms'
  return {
    suggestPage: (params) => httpCtx.get(basePath + '/transcode/selectSuggestPageOptions', { params, baseUrl }),
    generateCode: (params) => httpCtx.post(basePath + '/transcode/generate', { params, baseUrl })
  }
}
