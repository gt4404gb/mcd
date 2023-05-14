import { get, post, deletes, put } from './http';

//首页--查询BMS业务域列表  --- v1046作废
export function queryGuideCategoryList (params) {
  return get('/guide/category/list', params);
}
//首页--查询引导列表
export function queryGuideList (params) {
  return get('/guide/list', params);
}

// 申请分析————业务域
export function getBusinessCategory (params) {
  return get('/apply/all_business_category', params);
}

// 申请分析————列表
// export function queryGuideApplyList (params) {
//   return get('/apply/auth/list', params);
// }

// 数据查询
export function queryBieeLdwList (params) {
  return get('/report/biee/ldw/query/list', params);
}

//以下是 v1046新增接口

//主题域列表  树形结构
export function queryAnalyseSubjectTreeData (params) {
  return get('/analyse/subject/list', params);
}

//业务域列表  树形结构
export function queryAnalyseCategoryTreeData (params) {
  return get('/analyse/category/list', params);
}

//查询列表
export function queryAnalyseList (params) {
  return get('/analyse/list', params);
}

//订阅
export function subscribeAdd (data) {
  return post('/analyse/care/add', data);
}

//取消订阅
export function subscribeDel (data) {
  return deletes('/analyse/care/del', data);
}

// 申请分析————列表
export function queryGuideApplyList (params) {
  return get('/analyse/list/without/auth', params);
}

/**
 * 提醒相关IO
 */
export function checkWarnningStatus(params) {
  return get('/guidance/scenario/description/check/clue', params);
}
export function setNeverWarnning(params) {
  return put(`/guidance/scenario/description/cancel/clue?scope=${params.scope}&type=${params.type}`);
}
export function getLeftTreeData(params) {
  // level, businessId
  return get('/guidance/scenario/description/cascade', params);
}
export function getMenuPage(params) {
  return get('/guidance/quick/menu/guidance', params);
}
export function getCasePage(id) {
  return get(`/guidance/quick/case/guidance?id=${id}`)
}