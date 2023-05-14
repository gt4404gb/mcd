import { get, post, deletes, put } from './http';

/**
 * 数仓目录
 */

//查询库列表分页
export function queryDatabaseList (params) {
  return get('/apply/hive/dataBase/list', params, true, {}, 20 * 1000);
}
//库列表刷新
export function refreshDatabaseList (params) {
  return get('/apply/hive/dataBase/refresh', params, true, {}, 20 * 1000);
}
//查询表列表分页
export function queryDatasheetList (params) {
  return get('/apply/hive/table/list', params, true, {}, 20 * 1000);
}
//表列表刷新
export function refreshDatasheetList (params) {
  return get('/apply/hive/table/refresh', params, true, {}, 20 * 1000);
}
//查询字段列表分页
export function queryDatafieldList (params) {
  return get('/apply/hive/field/list', params, true, {}, 20 * 1000);
}
//字段列表刷新
export function refreshDatafieldList (params) {
  return get('/apply/hive/field/refresh', params, true, {}, 20 * 1000);
}
//库下拉列表
export function getDatabaseOptions (params) {
  return get('/apply/hive/dataBase/select', params, true, {}, 20 * 1000);
}
//库下拉列表
export function getDatasheetOptions (params) {
  return post('/apply/hive/table/select', params, true, {}, 20 * 1000);
}
//库表申请保存
export function saveDatabaseApplyInfos (params) {
  return post('/apply/hive/save', params);
}
//hive申请修改
export function updateDatabaseApplyInfos (params) {
  return put('/apply/hive/update', params);
}
//查询详情
export function getDatabaseApplyDetails (params) {
  return get('/apply/hive/info', params);
}
//修改状态
export function changeDatabaseApplyStatus (params) {
  return put(`/apply/hive/change?id=${params.id}&applyStatus=${params.applyStatus}`);
}
//重新同步数据
export function syncDatabaseInfo (params) {
  return get('/apply/hive/sync', params, true, {}, 20 * 1000);
}