import { message } from '@aurum/pfe-ui';
import common from '@omc/common';
import http from '@omc/boss-https';
import config from '@/common/config/config';
import { OpenLoading, CloseLoading } from '@/redux/actions/appAction';
const { sanitizeFields } = common.helpers;

const httpCtx = http({
  baseUrl: config.BACKEND_OPENAPI_API_BASE_URL,
  openLoading: OpenLoading,
  closeLoading: CloseLoading,
  message,
});

export function getMerchantModule() {
  const baseUrl = config.BACKEND_OPENAPI_API_BASE_URL;
  const basePath = '/core/merchant';

  return {
    list: (params) => httpCtx.get(`${basePath}/list`, { params, baseUrl }),
    detail: (params) => httpCtx.get(basePath, { params, baseUrl }),
    save: (params) => {
      sanitizeFields(params);
      if (params.id) {
        return httpCtx.put(basePath, { params }); // 更新
      } else {
        return httpCtx.post(basePath, { params }); // 新增
      }
    },
    disable: (params) =>
      httpCtx.put(`${basePath}/disable`, { params, baseUrl }),
    open: (params) => httpCtx.put(`${basePath}/open`, { params, baseUrl }),
  };
}

export function getAppModule() {
  const baseUrl = config.BACKEND_OPENAPI_API_BASE_URL;
  const basePath = '/core/application';

  return {
    list: (params) => httpCtx.get(`${basePath}/list`, { params, baseUrl }),
    detail: (params) => httpCtx.get(basePath, { params, baseUrl }),
    save: (params) => {
      sanitizeFields(params);
      if (params.id) {
        return httpCtx.put(basePath, { params }); // 更新
      } else {
        return httpCtx.post(basePath, { params }); // 新增
      }
    },
    approve: (params) => httpCtx.put(`${basePath}/verify`, { params, baseUrl }),
    reject: (params) => httpCtx.put(`${basePath}/reject`, { params, baseUrl }),
    disable: (params) =>
      httpCtx.put(`${basePath}/disable`, { params, baseUrl }),
    open: (params) => httpCtx.put(`${basePath}/open`, { params, baseUrl }),
  };
}

export function getGatewayModule() {
  const baseUrl = config.BACKEND_OPENAPI_API_BASE_URL;

  return {
    dashboard: (params) => {
      params = params || {};
      if (params.isHour === undefined) params.isHour = 1;
      return httpCtx.get(`/core/gateway/dashboard`, { params });
    },
    apiStats: (params) => {
      return httpCtx.get(`/core/gateway/getApiInfo`, { params });
    },
    appStats: (params) => {
      return httpCtx.get(`/core/gateway/getAppInfo`, { params });
    },
    errorStats: (params) => {
      return httpCtx.get(`/core/gateway/getErrorCodeInfo`, { params });
    },
    failedApiStats: (params) => {
      return httpCtx.get(`/core/gateway/getFailApiInfo`, { params });
    },
  };
}

export function getApiModule() {
  const baseUrl = config.BACKEND_OPENAPI_API_BASE_URL;
  const basePath = '/core/api';

  return {
    list: (params) => httpCtx.get(`${basePath}/list`, { params, baseUrl }),
    detail: (params) => httpCtx.get(basePath, { params, baseUrl }),
    save: (params) => {
      sanitizeFields(params);
      if (params.id) {
        return httpCtx.put(basePath, { params }); // 更新
      } else {
        return httpCtx.post(`${basePath}/inner`, { params }); // 新增
      }
    },
    disable: (params) =>
      httpCtx.put(`${basePath}/disable`, { params, baseUrl }),
    open: (params) => httpCtx.put(`${basePath}/open`, { params, baseUrl }),
    publish: (params) =>
      httpCtx.put(`${basePath}/publishOrNot`, { params, baseUrl }),
    auditRecall: (params) =>
      httpCtx.put(`${basePath}/recall`, { params, baseUrl }),
    auditSubmitVerify: (params) =>
      httpCtx.put(`${basePath}/submitVerify`, { params, baseUrl }),
    // docs: https://api-docs.mcd.com.cn/project/988/interface/api/87033
    auditVerify: (params) =>
      httpCtx.put(`${basePath}/verify`, { params, baseUrl }),
    auditReject: (params) =>
      httpCtx.put(`${basePath}/reject`, { params, baseUrl }),
  };
}

export function getApiGroupModule() {
  const baseUrl = config.BACKEND_OPENAPI_API_BASE_URL;
  const basePath = '/core/api-group';

  return {
    list: (params) => httpCtx.get(`${basePath}/list`, { params, baseUrl }),
    detail: (params) => httpCtx.get(basePath, { params, baseUrl }),
    save: (params) => {
      sanitizeFields(params);
      if (params.id) {
        return httpCtx.put(basePath, { params }); // 更新
      } else {
        return httpCtx.post(basePath, { params }); // 新增
      }
    },
    disable: (params) =>
      httpCtx.get(`${basePath}/disable`, { params, baseUrl }),
    open: (params) => httpCtx.get(`${basePath}/open`, { params, baseUrl }),
    yapiSwaggerJSON: (id) =>
      httpCtx.get(`${basePath}/project/${id}`, { pathVars: [id], baseUrl }),
  };
}

export function getApiSubscriptionModule() {
  const baseUrl = config.BACKEND_OPENAPI_API_BASE_URL;
  const basePath = '/core/subscription';

  return {
    list: (params) => httpCtx.get(`${basePath}/list`, { params, baseUrl }),
    detail: (params) => httpCtx.get(`${basePath}`, { params, baseUrl }),
    add: (params) => {
      sanitizeFields(params);
      return httpCtx.post(`${basePath}/batch`, { params }); // 新增
    },
    delete: (params) => {
      return httpCtx.delete(`${basePath}/${params.id}`, {
        params,
        pathVars: [params.id],
      });
    },
  };
}

export function getBOSModule() {
  const baseUrl = config.BACKEND_BOS_API_BASE_URL;
  const basePath = '/btb/bos';

  return {
    getUploadImageUrlWithoutSign: () =>
      `${baseUrl}${basePath}/boss/file/noSign/upload`,
  };
}

export function getCoreMgrModule() {
  const baseUrl = config.BACKEND_OPENAPI_API_BASE_URL;
  const basePath = '/core';

  return {
    list: (params) =>
      httpCtx.post(`${basePath}/api-limit/list`, { params, baseUrl }),
    detail: (id) =>
      httpCtx.get(`${basePath}/api-limit`, { params: { id }, baseUrl }),
    save: (params) => {
      sanitizeFields(params);
      if (params.id) {
        return httpCtx.put(`${basePath}/api-limit`, { params }); // 更新
      } else {
        return httpCtx.post(`${basePath}/api-limit`, { params }); // 新增
      }
    },
    remove: (id) => httpCtx.delete(`${basePath}/api-limit/${id}`, { baseUrl }),
    enable: (id) =>
      httpCtx.put(`${basePath}/api-limit/open/${id}`, { baseUrl }),
    disable: (id) =>
      httpCtx.put(`${basePath}/api-limit/disable/${id}`, { baseUrl }),

    ipList: (params) =>
      httpCtx.get(`${basePath}/ipBlackWhite/list`, { params, baseUrl }),
    ipDetail: (id) =>
      httpCtx.get(`${basePath}/ipBlackWhite`, { params: { id }, baseUrl }),
    ipSave: (params) => {
      sanitizeFields(params);
      if (params.id) {
        return httpCtx.put(`${basePath}/ipBlackWhite`, { params }); // 更新
      } else {
        return httpCtx.post(`${basePath}/ipBlackWhite`, { params }); // 新增
      }
    },
    ipRemove: (id) =>
      httpCtx.delete(`${basePath}/ipBlackWhite/${id}`, { baseUrl }),
    ipBatchAdd: (params) =>
      httpCtx.post(`${basePath}/ipBlackWhite/batch`, { params, baseUrl }),
  };
}

export function getXmenModule() {
  const baseUrl = '/api/inner/xmen';

  return {
    queryEmployeesByName: (queryKey) => {
      return httpCtx.get(`/backer/xmen/query/by/name`, {
        params: { queryKey },
        baseUrl,
      });
    },
    // 正规方式
    queryUsers: (keyword) => {
      return httpCtx.get(`/core/api-group/getUsers`, {
        params: { name: keyword },
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
