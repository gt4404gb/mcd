import {get, post, put} from './http';

const prefixStr = '/demandboard';

// 需求看板
export function getDemandBoardTop(data) {
    return post(`${prefixStr}/query/demandreview`, data);
}

export function getSpintList(data) {
    return post(`${prefixStr}/query/sprintlist`, data);
}

export function getTopCheckOptions() { // 概览顶部需求范围:
    return get(`${prefixStr}/query/demand/checkbox?name=JIRA_ISSUE_LABEL`);
}

export function getDemandBUOptions() {
    return get(`${prefixStr}/query/demand/bu/options`);
}
export function createDemandItem(data) {
    return post(`${prefixStr}/query/demand/create`, data);
}
export function getDetailById(id) {
    return get(`${prefixStr}/query/demand/detail?key=${id}`);
}

// 根据maindid获取detail
export function getApplyDetailById(id) {
    return get(`${prefixStr}/query/apply/detail?mainId=${id}`);
}
export function getLabel() { // Label
    return get(`${prefixStr}/query/demand/checkbox?name=JIRA_ISSUE_LABEL_WITHOUT_OWNER`)
}
export function getDataBP() { // Data BP：
    return get(`${prefixStr}/query/demand/checkbox?name=JIRA_DATA_BP_LABEL`)
}
export function getProductManager() { // 产品经理：
    return get(`${prefixStr}/query/demand/checkbox?name=JIRA_PRODUCT_MANAGER_LABEL`)
}
export function updateDemandFormData(mainId, data) {
    return put(`${prefixStr}/query/demand/update/${mainId}`, data);
}
export function modifyWorkflowStatus(id, status) {
    return put(`${prefixStr}/query/demand/apply/change/status?id=${id}&applyStatus=${status}`)
}
export function getDownloadTemplateList() {
    return get(`${prefixStr}/query/demand/file/model?name=JIRA_FILE_MODEL`)
}
// 首页4个表格分开请求-0:开发中，1:排期中，2:已上线，3:待开发清单
export function getTableListByType(type, data) {
    return post(`${prefixStr}/query/sprintlist?type=${type}`, data);
}
// 流程中心执行日志 mainId=xx&workflowId=xxx
export function getWorkflowNodeInfo(params) {
    return get(`/callback/logs`, params)
}
export function getCurEnvNodeId() { // Data BP：
    return get(`${prefixStr}/query/demand/checkbox?name=DEMAND_WORKFLOW_NODE`)
}