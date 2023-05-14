import {get,post} from '../oap/http';

/**
 *  分析场景管理
 */
// subjectId,categoryId,name,businessOwnerName,dataOwnerName,type,size,page
export function getAnalysisSceneList(params) {
    return get('/assets/business/list', params)
}
// 业务域详情 get(type 2_1自助取数 2_2SQL模板) id,type
export function getBusinessDetailByIdType(params) {
    return get(`/assets/business/detail`, params)
}
// 分析场景配置dataOwner
export function postDataOwnerConfig(id,data) {
    return post(`/assets/business/owner/data/${id}`, data);
}
// 分析场景配置businessOwner
export function postBusinessOwnerConfig(id,data) {
    return post(`/assets/business/owner/business/${id}`, data);
}
// 主题列表
export function getThemeList() {
    return get('/assets/business/subject/list');
}
// 业务域列表
export function getDomainList() {
    return get('/assets/business/category/list');
}
// 邮件确认 id,operate,type
export function confirmEmail(params) {
    return get('/assets/owner/status', params);
}
// 再次确认-分析场景
export function getReportOwnerAgain(id) {
    return get('/assets/business/owner/again?flowId='+id);
}