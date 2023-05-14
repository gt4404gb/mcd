import {
  message
} from '@aurum/pfe-ui';
import common from '@omc/common';
import http from '@omc/boss-https';
import config from '@/common/config/config';
import {
  OpenLoading,
  CloseLoading
} from '@/redux/actions/appAction';
const {
  sanitizeFields
} = common.helpers;

const httpCtx = http({
  baseUrl: config.BACKEND_OPENAPI_API_BASE_URL,
  openLoading: OpenLoading,
  closeLoading: CloseLoading,
  message,
});

export function getBMSModule() {
  const baseUrl = config.BACKEND_BMS_API_BASE_URL;
  const basePath = '/btb/bms';

  return {
    accessList: (params) =>
      httpCtx.get(`${basePath}/admin/access/list`, {
        params,
        baseUrl
      }),
    accessCheck: (params) =>
      httpCtx.post(`${basePath}/admin/access/check`, {
        params,
        baseUrl
      }),
    fetchMerchantList: (params) =>
      httpCtx.get(`${basePath}/merchant/manager/list`, {
        params,
        baseUrl
      }),
    getMerchant: (params) =>
      httpCtx.get(`${basePath}/merchant/manager/detail`, {
        params,
        baseUrl
      }),
    updateMerchant: (params) =>
      httpCtx.put(`${basePath}/merchant/manager/update`, {
        params,
        baseUrl
      }),
    fetchContactList: (params) =>
      httpCtx.get(`${basePath}/person/list`, {
        params,
        baseUrl
      }),
    addContact: (params) =>
      httpCtx.post(`${basePath}/person/add`, {
        params,
        baseUrl
      }),
    updateContact: (params) =>
      httpCtx.put(`${basePath}/person/update`, {
        params,
        baseUrl
      }),
    delContact: (params) =>
      httpCtx.delete(`${basePath}/person/delete?id=${params.id}`, {
        params,
        baseUrl,
      }),
    closeAccount: (params) =>
      httpCtx.delete(`${basePath}/person/close/account?id=${params.id}`, {
        params,
        baseUrl,
      }),
    resetPassword: (params) =>
      httpCtx.delete(`${basePath}/person/reset/password?id=${params.id}`, {
        params,
        baseUrl,
      }),

    addMerchant: (params) =>
      httpCtx.post(`${basePath}/boss/merchant`, {
        params,
        baseUrl
      }),
    toggleMerchant: (params) =>
      httpCtx.put(`${basePath}/boss/merchant/status`, {
        params,
        baseUrl
      }),
    // @docs https://api-docs.mcd.com.cn/project/1023/interface/api/87627
    resetMerchantPwd: (merchantId) =>
      httpCtx.put(`${basePath}/boss/merchant/${merchantId}/password`, {
        pathVars: [merchantId],
        baseUrl,
      }),
  };
}

export function getXmenModule() {
  const baseUrl = '/api/inner/xmen';

  return {
    queryEmployeesByName: (queryKey) => {
      return httpCtx.get(`/backer/xmen/query/by/name`, {
        params: {
          queryKey
        },
        baseUrl,
      });
    },
    // 正规方式
    queryUsers: (keyword) => {
      return httpCtx.get(`/core/api-group/getUsers`, {
        params: {
          name: keyword
        },
        baseUrl: config.BACKEND_OPENAPI_API_BASE_URL,
      });
    },
    queryOrgUsers: (params) => {
      return httpCtx.get(`/project/getOrgUser`, {
        params: {
          pageNum: 1,
          pageSize: 200,
          isCurrentOrg: 'false',
          ...params,
        },
        baseUrl: '/api/inner/platform',
      });
    },
  };
}

export function getECOModule() {
  return {
    getOrderExportUrl: (params) =>
      httpCtx.get(`/eco/ordercore/online/b2b/order/download`, {
        params,
        baseUrl: '/api/inner/ordercore',
        responseType: 'arraybuffer',
      }),
  };
}

export function getBOSModule() {
  const baseUrl = config.BACKEND_BOS_API_BASE_URL;
  const basePath = '/btb/bos';

  return {
    getUploadImageUrl: () => `${baseUrl}${basePath}/boss/file/upload`,
    getUploadImageUrlWithoutSign: () =>
      `${baseUrl}${basePath}/boss/file/noSign/upload    `,
    getCredentialImageUrl: (filename) => {
      let baseUrl = config.BFF_BASE_URL.replace(/\/bff/, '');
      return `${baseUrl}/btb/bip/credential/download/${filename}`;
    },

    orderList: (params) =>
      httpCtx.post(`${basePath}/boss/order/list`, {
        params: {
          ...params
        },
        baseUrl,
      }),
    detail: (params) =>
      httpCtx.get(`${basePath}/boss/order/detail`, {
        params,
        baseUrl
      }),
    cancelOrder: (orderId, params) =>
      httpCtx.post(`${basePath}/boss/order/${orderId}/cancellation`, {
        pathVars: [orderId],
        params,
        baseUrl,
      }),
    getOrderCancelReason: (orderId) =>
      httpCtx.get(`${basePath}/boss/order/${orderId}/cancellation`, {
        pathVars: [orderId],
        baseUrl,
      }),
    submitReceipt: (params) =>
      httpCtx.post(`${basePath}/boss/credential/submit`, {
        params: {
          ...params
        },
        baseUrl,
      }),
    auditReceipt: (params) =>
      httpCtx.post(`${basePath}/boss/credential/audit`, {
        params: {
          ...params
        },
        baseUrl,
      }),
    fetchOrdersToAudit: (params) =>
      httpCtx.get(`${basePath}/boss/order/pays`, {
        params: {
          ...params
        },
        baseUrl,
      }),
    fetchOrdersToPriceAmendAudit: (orderId) =>
      httpCtx.get(`${basePath}/change/apply/list`, {
        params: {
          orderId
        },
        baseUrl,
      }),
    uploadReceiptImage: (params) =>
      httpCtx.post(`${basePath}/boss/credential/upload`, {
        params: {
          ...params
        },
        baseUrl,
      }),
    priceAmendApply: (params) =>
      httpCtx.post(`${basePath}/change/price/apply`, {
        params: {
          ...params
        },
        baseUrl,
      }),
    priceAmendAudit: (params) =>
      httpCtx.post(`${basePath}/change/price/audit`, {
        params: {
          ...params
        },
        baseUrl,
      }),
    allCouponExportUrl: (orderid) =>
      `${baseUrl}${basePath}/boss/coupon/export?orderid=${orderid}`,
    usedCouponExportUrl: (orderid) =>
      `${baseUrl}${basePath}/boss/coupon/export?orderId=${orderid}`,
    getCouponInfo: (params) =>
      httpCtx.post(`${basePath}/boss/coupon/export/info`, {
        params: {
          ...params
        },
        baseUrl,
      }),
    getCouponStats: (params) =>
      httpCtx.get(`${basePath}/boss/coupon/count`, {
        params: {
          ...params
        },
        baseUrl,
      }),
    queryCoupons: (params) =>
      httpCtx.post(`${basePath}/boss/query/coupon`, {
        params,
        baseUrl
      }),
    queryCouponHistory: (params) =>
      httpCtx.get(`${basePath}/boss/coupon/history`, {
        params,
        baseUrl
      }),
    couponExpand: (query, file) =>
      httpCtx.post(`${basePath}/boss/coupon/codes`, {
        query,
        params: file,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'arraybuffer',
        baseUrl,
      }),
    orderRemarkAdd: (params) =>
      httpCtx.post(`${basePath}/boss/order/remark`, {
        params,
        baseUrl,
      }),
  };
}

export function getVoucherModule() {
  const baseUrl = config.BACKEND_VOUCHER_API_BASE_URL;
  const basePath = '/btb/voucher';

  return {
    templateQuery: (params) =>
      httpCtx.get(`${basePath}/templates`, {
        params,
        baseUrl
      }),
    templateDetail: (templateCode) =>
      httpCtx.get(`${basePath}/templates/${templateCode}`, {
        pathVars: [templateCode],
        baseUrl,
      }),
    templateSave: (params) => {
      sanitizeFields(params);
      if (params.templateCode) {
        return httpCtx.put(`${basePath}/templates/${params.templateCode}`, {
          params,
          baseUrl,
        }); // 更新
      } else {
        return httpCtx.post(`${basePath}/templates`, {
          params,
          baseUrl
        }); // 新增
      }
    },
    templateUnpublish: (templateCode) =>
      httpCtx.put(`${basePath}/templates/${templateCode}/unpublish`, {
        pathVars: [templateCode],
        baseUrl,
      }),
    templatePublish: (templateCode) =>
      httpCtx.put(`${basePath}/templates/${templateCode}/publish`, {
        pathVars: [templateCode],
        baseUrl,
      }),
    templateStockQuery: (templateCode) =>
      httpCtx.get(`${basePath}/templates/${templateCode}/stock`, {
        pathVars: [templateCode],
        baseUrl,
      }),
    templateStockIncrease: (templateCode, changeStock) =>
      httpCtx.put(`${basePath}/templates/${templateCode}/stock`, {
        params: {
          changeStock
        },
        pathVars: [templateCode],
        baseUrl,
      }),

    orderQuery: (params) =>
      httpCtx.get(`${basePath}/order`, {
        params,
        baseUrl
      }),
    orderDetail: (orderId) =>
      httpCtx.get(`${basePath}/order/${orderId}`, {
        baseUrl
      }),
    orderCancel: (orderId) =>
      httpCtx.put(`${basePath}/order/cancel/${orderId}`, {
        baseUrl
      }),
    orderAdd: (params) =>
      httpCtx.post(`${basePath}/order`, {
        params,
        baseUrl
      }),

    redeemCodeQuery: (params) =>
      httpCtx.get(`${basePath}/redeemCode`, {
        params,
        baseUrl
      }),
    redeemCodeCancel: (id) =>
      httpCtx.put(`${basePath}/redeemCode/cancel/${id}`, {
        pathVars: [id],
        baseUrl,
      }),

    exportCodes: (file) =>
      httpCtx.post(`${basePath}/redeemCode/export/codes`, {
        params: file,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'arraybuffer',
        baseUrl,
      }),
    getExportTask: (params) =>
      httpCtx.post(`${basePath}/redeemCode/getExportTask`, {
        params,
        baseUrl,
      }),
    getExportTemplate: (params) =>
      httpCtx.get(`${basePath}/redeemCode/export/template/download`, {
        params,
        baseUrl,
        responseType: 'arraybuffer',
      }),
  };
}