import {get,post} from '../oap/http';

/**
 * 数据资产管理
 */

// 业务域分页列表
export function getBusinessDomainList(params) {
    return get('/assets/business_category/list', params);
}
// 业务详情
export function getBusinessDetail(id) {
    return get(`/assets/business_category/detail?id=${id}`);
}
// 业务域配置-reportOwner
// params = {id:xxx,employeeNumber:xxx};
export function reportOwnerConfig(params) {
    return get('/assets/business_category/owner/report', params);
}
// 业务域配置-businessOwner
export function businessOwnerConfig(params) {
    return get('/assets/business_category/owner/business', params);
}
// 再次确认-业务域
export function getBusinessOwnerAgain(id) {
    return get('/assets/business_category/owner/again/?flowId='+id);
}