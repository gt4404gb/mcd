import {get, post, deletes, put} from './http';

/**
 * 数据目录
 */

//数据目录--主题域
export function querySubjectTree(params) {
  return get('/model/subject_model/tree/list', params);
}
//数据目录--表分层
export function querySheetLayerList(params) {
  return get('/model/layer/all', params);
}
//数据目录--列表
export function querySheetList(params) {
  return get('/model/table/list', params);
}
//数据目录--查看字段
export function querySheetFieldList(params) {
  return get('/model/table/field/all', params);
}
//数据目录--初次保存流程id
export function saveApplyRequest(params) {
  return post('/table/apply/save', params);
}
//数据目录--查询流程详情
export function queryApplyRequestDetail(params) {
  return get('/table/apply/detail', params);
}
//数据目录--查询
export function queryApplyRequestInit(params) {
  return get('/table/apply/init', params);
}
//数据目录--保存流程状态
export function saveApplyStatus(params) {
  return get('/table/apply/back', params);
}
//数据目录--同步
export function syncAuthStatus(params) {
  return get('/table/apply/sync', params);
}
/**
 * --------------- end
 */


/**
 * 指标目录
 */
//指标目录--标签列表
export function queryIndexesTagList(params) {
  return get('/model/tag/all', params);
}

//指标目录--指标域
export function queryIndexesTree(params) {
  return get('/model/index/domain/tree/list', params);
}

//指标目录--列表
export function queryIndexesList(params) {
  return get('/model/index/list', params);
}

//指标目录--详情
export function queryIndexDetail(params) {
  return get('/model/index/info', params);
}

//指标目录--修饰词类型
export function queryIndexDecorationTypesInfo(params) {
  return get('/model/index/decorationTypesInfo', params);
}

//指标目录--修饰词列表
export function queryIndexDecorationsInfo(params) {
  return get('/model/index/decorationsInfo', params);
}
/**
 * --------------- end
 */
/**
 * 维度目录
 */
//维度目录--主题域
export function queryDimensionTree(params) {
  return get('/model/subject/tree/list', params);
}
//维度目录--列表
export function queryDimensionList(params) {
  return get('/model/dimension/list', params);
}