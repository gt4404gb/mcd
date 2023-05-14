import {get, post, deletes, put} from './http';

// 自定义规则：列表
export function queryCustomRulesList(data) {
  return get('/custom/dimension/list', data)
}
// 自定义维度查询业务列表
export function queryModelForCustom(params) {
  // 增加入参:customType :0 自主取数，1小票分析
  return get('/model/query_model_for_custom_dimension', params);
}
// 自定义规则：保存
export function saveCustomRulesList(data) {
  return post('/custom/dimension/save', data)
}

// 自定义规则：修改
export function updateCustomRulesList(data) {
  return put('/custom/dimension/update', data)
}

// 自定义规则：删除
export function deleteCustomRules(id) {
  return deletes(`/custom/dimension/delete/${id}`)
}

// 自定义规则：查详情
export function getCustomRulesDetailInfo(id) {
  return get(`/custom/dimension/info/${id}`)
}

//获取分享人员列表
export function getCustomRulesSharedList(params) {
  return get('/custom/dimension/share/list',params)
}

//保存分享的人员列表
export function saveCustomRulesSharedList(params) {
  return post('/custom/dimension/save/share',params)
}
//批量保存分享的人员列表
export function saveBatchCustomRulesSharedList(params) {
  return post('/custom/dimension/save/batch/share',params)
}