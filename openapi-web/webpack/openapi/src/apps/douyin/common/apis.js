import { message } from '@aurum/pfe-ui';
import common from '@omc/common';
import http from '@omc/boss-https';
import config from '@/common/config/config';
import { OpenLoading, CloseLoading } from '@/redux/actions/appAction';
import constants from '@/apps/douyin/common/constants';

const { joinObjectToUrlPath, filterEmptyFields } = common.helpers;

const httpCtx = http({
  baseUrl: config.BACKEND_OPENAPI_API_BASE_URL,
  openLoading: OpenLoading,
  closeLoading: CloseLoading,
  message,
});

export function getDouyinModule() {
  const baseUrl = config.BACKEND_BOS_API_BASE_URL;
  const basePath = '/btb/bos';
  // @docs https://api-docs.mcd.com.cn/project/1029/interface/api/91394
  const forwardDouyin = (params) => {
    if (params.requestJson) {
      params.requestJson = filterEmptyFields(params.requestJson);
      params.requestJson = JSON.stringify(params.requestJson);
    }
    return httpCtx.post(`${basePath}/douyin/forward`, { params, baseUrl });
  };

  return {
    fetchGroupons: (params) => {
      const query = joinObjectToUrlPath(params);
      return forwardDouyin({
        method: 'GET',
        path: `/enterprise/v3/groupon/list/${query ? `?${query}` : ''}`,
      });
    },
    getGroupon: (grouponId) => {
      return forwardDouyin({
        method: 'GET',
        path: `/enterprise/v3/groupon/detail/?groupon_ids=${grouponId}`,
      });
    },
    saveGroupon: (data) => {
      if (data) {
        data.actual_amount = parseFloat(data.actual_amount);
        data.use_type = constants.groupon.use_type.VERIFIED_IN_STORE.value;
        data.code_type = constants.groupon.code_type.THIRD.value;
        // data.pay_item_groups = [
        //   {
        //     group_name: '商品组A',
        //     item: [
        //       { count: 1, name: '板烧', price: 1000 },
        //       { count: 2, name: '麦辣', price: 1680 },
        //     ],
        //     option_count: 2,
        //   },
        // ];

        data = filterEmptyFields(data, [
          'sale_valid_moment',
          'order_valid_moment',
        ]);
      }
      console.log('Data TO Save: ', data);

      return forwardDouyin({
        method: 'POST',
        path: `/enterprise/v3/groupon/save/`,
        requestJson: { groupon: data },
      });
    },
    olineGroupon: (grouponId) => {
      return forwardDouyin({
        method: 'POST',
        path: `/enterprise/v3/groupon/online/`,
        requestJson: { groupon_id: grouponId },
      });
    },
    offlineGroupon: (grouponId) => {
      return forwardDouyin({
        method: 'POST',
        path: `/enterprise/v3/groupon/offline/`,
        requestJson: { groupon_id: grouponId },
      });
    },
    saveGrouponWithoutVerify: (data) => {
      return forwardDouyin({
        method: 'POST',
        path: `/enterprise/v3/groupon/modify/`,
        requestJson: data,
      });
    },
    getGrouponDraft: (grouponId) =>
      httpCtx.get(`${basePath}/douyin/getDraftGroupon`, {
        params: { grouponId },
        baseUrl,
      }),
    // https://open.douyin.com/platform/doc/7005578946813184030  抖音接口，导出新任务
    fetchNewTask: (params) => {
      return forwardDouyin({
        method: 'GET',
        path: '/poi/supplier/query_all/',
      });
    },
    // @docs https://api-docs.mcd.com.cn/mock/1029/btb/bos/douyin/getDownloadTasks 获取全部任务列表
    fetchTaskList: (params) => {
      return httpCtx.get(`${basePath}/douyin/getDownloadTasks`, {
        params,
        baseUrl,
      });
    },
    // https://open.douyin.com/platform/doc/7005579747056977928 下载
    onDownLoad: (task_id) => {
      return forwardDouyin({
        method: 'GET',
        path: `/poi/supplier/query_callback/?task_id=${task_id}`,
      });
    },
    // https://open.douyin.com/platform/doc/6848798600688928779 查询门店POI信息
    fetchShopInfo: (shopId) => {
      return forwardDouyin({
        method: 'GET',
        path: `/poi/supplier/query/?supplier_ext_id=${shopId}`,
      });
    },
    // https://open.douyin.com/platform/doc/6848798600688961547 绑定门店与抖音POI
    bindShop: (params) => {
      return forwardDouyin({
        method: 'POST',
        path: '/poi/supplier/sync/',
        requestJson: params,
      });
    },
    shopMatch: (params) => {
      return forwardDouyin({
        method: 'POST',
        path: '/poi/v2/supplier/match/',
        requestJson: params,
      });
    },
    fetchShopMatchInfo: (shopId) => {
      return forwardDouyin({
        method: 'GET',
        path: `/poi/v2/supplier/query/supplier/?supplier_ext_id=${shopId}`,
      });
    },
  };
}

export function getJimiaoModule() {
  const baseUrl = config.BACKEND_BOS_API_BASE_URL;
  const basePath = '/btb/bos';
  // @docs https://api-docs.mcd.com.cn/project/1029/interface/api/95861
  const forwardJimiao = (params) => {
    if (params.requestJson) {
      params.requestJson = filterEmptyFields(params.requestJson);
      params.requestJson = JSON.stringify(params.requestJson);
    }
    return httpCtx.post(`${basePath}/jm/forward`, {
      params,
      baseUrl,
    });
  };

  return {
    taxConfigList: (params) => {
      return forwardJimiao({
        method: 'POST',
        requestJson: params,
        path: `/invoice/getConfig`,
      });
    },
    taxConfigAdd: (params) => {
      return forwardJimiao({
        method: 'POST',
        requestJson: params,
        path: `/invoice/insertConfig`,
      });
    },
    taxConfigUpdate: (params) => {
      return forwardJimiao({
        method: 'POST',
        requestJson: params,
        path: '/invoice/updateConfig',
      });
    },
    taxConfigDelete: (skuId) => {
      return forwardJimiao({
        method: 'POST',
        requestJson: { skuId },
        path: `/invoice/deleteConfig`,
      });
    },
  };
}
