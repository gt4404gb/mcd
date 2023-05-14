import { get, post, deletes, put } from './http';
import request from '@/utils/request';
import { ApiPrefix } from "@/utils/ApiConstants";

// Upload Data For Warehouse
// 列表
export function getUploadDataWarehouseList (params) {
  return get(`/hive/list`, params);
}
// 删除
export function deleteUploadDataWarehouseItem (params) {
  return deletes(`/hive/delete`, params);
}
// 详情
export function getWarehouseDetail (id) {
  return get(`/hive/detail?id=${id}`);
}

// 第一步解析
export function firstStepCommit (data) {
  return post(`/hive/prepare`, data)
}
// 第二步
export function secondStepCommit (data) {
  return post(`/hive/analyse`, data)
}
// 获取库
export function getTemplateDataBaseOptions () {
  return get(`/hive/getDataBases`)
}
// 获取表
export function getTemplateTableOptions (data) {
  return get('/hive/getTables', data)
}

//下载模板
export function downTableFieldsTemplate (data) {
  return request({
    url: ApiPrefix.OAP + `/hive/download?dbName=${data.dbName}&tableName=${data.tableName}`,
    responseType: 'blob',
    method: 'get'
  })
}
// 第一步解析
export function updateFirstStepCommit (data) {
  return post(`/hive/updatePrepare`, data)
}
// 第二步
export function updateSecondStepCommit (data) {
  return post(`/hive/updateAnalyse`, data)
}