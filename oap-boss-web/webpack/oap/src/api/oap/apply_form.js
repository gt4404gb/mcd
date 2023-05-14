import { get, post, deletes, put } from './http';

/**
 * 申请流程相关
 */

//表名列表
export function queryTableListAuthBySupplier (params) {
    return get('/apply/table/select', params);
}
//分析名列表
export function queryAnalysisAuthList (params) {
    return get('/apply/business_and_sql_template/select', params);
}
//保存
export function saveApplyInfos (params) {
    return post('/apply/save', params);
}
//绑定流程id
export function bindRequestId (params) {
    return put(`/apply/binding_request_id?id=${params.id}&requestId=${params.requestId}`);
}
//查详情
export function getApplyDetails (params) {
    return get('/apply/info', params);
}
//根据不同环境获取workflowId
export function getWorkflowId (code) {
    return get(`/sys/config/get?name=workflowid&code=${code}`);
}

//更新申请状态
export function changeApplyStatus (params) {
    return put(`/apply/change_apply_status?id=${params.id}&applyStatus=${params.applyStatus}`);
}
//修改
export function updateApplyInfos (params) {
    return put('/apply/update', params);
}
//获取owner
export function getApplyOwner (params) {
    return post('/apply/owner', params);
}