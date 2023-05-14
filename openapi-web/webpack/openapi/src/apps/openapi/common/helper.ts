import common from '@omc/common';
import constants from './constants';
import * as apis from '@/apps/openapi/common/apis';

const { transferAntdTableHeaderArray2Object } = common.helpers;

const fetchMerchants: any = async () => {
  let rows: any = [];
  const resp: any = await apis.getMerchantModule().list({ pageSize: 999 });
  if (resp?.code === 'SUCCESS') {
    rows = resp.data.rows;
  }
  return rows;
}

const fetchApps: any = async (searchObj: any) => {
  let rows: any = [];
  const params: any = { ...searchObj, pageSize: 999, pageNo: 1 };
  // if (searchObj.status) params.status = status;
  const resp: any = await apis.getAppModule().list(params);
  if (resp?.code === 'SUCCESS') {
    rows = resp.data.rows;
  }
  return rows;
}

const fetchApiGroups: any = async () => {
  let rows: any = [];
  const resp: any = await apis.getApiGroupModule().list({ pageSize: 999 });
  if (resp?.code === 'SUCCESS') {
    rows = resp.data.rows;
  }
  return rows;
}

const fetchApisByGroupId: any = async (apiGroupId: any) => {
  let rows: any = [];
  const resp: any = await apis.getApiModule().list({ apiGroupId, pageSize: 999, status: constants.api.status.APPROVED.value });
  if (resp?.code === 'SUCCESS') {
    rows = resp.data.rows;
  }
  return rows;
}

export async function getMerchantOptions(key?: any) {
  const rows: any = await fetchMerchants();
  return rows.map(((item: any) => ({ value: (key ? item[key] : item.id), label: item.merchantName })));
}

export async function getApiOptions(searchObj: any = {}, key?: any) {
  const resp: any = await apis.getApiModule().list({...searchObj, status: constants.api.status.APPROVED.value});
  return resp.data.rows?.map(((item: any) => ({ value: (key ? item[key] : item.id), label: item.apiName })));
}

export async function getSubscribedApiOptions(searchObj: any = {}, key?: any) {
  const resp: any = await apis.getApiSubscriptionModule().list(searchObj);
  return resp.data.rows?.map(((item: any) => ({ value: (key ? item[key] : item.id), label: item.apiName })));
}

export async function getApisByGroupIdOptions(apiGroupId: any) {
  const rows: any = await fetchApisByGroupId(apiGroupId);
  return rows.map(((item: any) => ({ value: item.id, label: item.apiName })));
}

export async function getApisMap() {
  const rows: any = await fetchApisByGroupId(null);
  const result: any = {};
  rows.forEach((item: any) => {
    if (item.isSubscription) return;
    result[item.id] = {
      value: item.id,
      label: item.apiName,
      requestMethod: item.requestMethod,
      path: item.path,
    };
  });
  return result;
}

export async function getApisByGroupIdTreeOptions(apiGroupId: any) {
  const rows: any = await fetchApisByGroupId(apiGroupId);
  return rows.map(((item: any) => ({ key: item.id, title: `${item.apiName} ${item.requestMethod} ${item.path}` })));
}

export async function getPublishedAppsOptions(searchObj: any, key?: any) {
  const rows: any = await fetchApps({
    ...searchObj, status: constants.app.status.PASSED.value
  });
  return rows.map(((item: any) => ({ value: key ? item[key] : item.id, label: item.appName })));
}

export async function getApiGroupOptions() {
  const rows: any = await fetchApiGroups();
  return rows.map(((item: any) => ({ value: item.id, label: item.groupName })));
}

export default {
  getMerchantOptions,
  getApisByGroupIdOptions,
  getPublishedAppsOptions,
  getApiGroupOptions,
  getDefaultFilterColumns: ($t = (v: any) => v) => {
    return transferAntdTableHeaderArray2Object([
      [$t('创建人'), 'createdUser'],
      [$t('创建时间'), 'createdDate'],
      [$t('更新人'), 'updatedUser'],
      [$t('更新时间'), 'updatedDate']
    ]);
  }
}