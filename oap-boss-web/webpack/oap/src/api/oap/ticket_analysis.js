import {get, post, deletes, put} from './http';

// Ticket Analysis
// 列表
export function getTicketAnalysisList(params) {
  return get(`/ticket_analysis/query_slice`, params);
}
// 删除
export function deleteTicketAnalysisItem(params) {
  return deletes(`/ticket_analysis/delete/slice`, params);
}
// 元数据列表
export function prepareChartForTicket() {
  return get(`/ticket_analysis/prepareChart`);
}
// 根据字段id(产品)查询对应的参数
export function getFieldInfoByIdForTicket(id) {
  return get(`/ticket_analysis/fieldInfo?fieldId=${id}`);
}
// 保存
export function saveChartForTicket(data) {
  return post(`/ticket_analysis/saveChart`, data);
}
// 查看详情
export function viewChartForTicket(id) {
  return get(`/ticket_analysis/openChart/${id}`);
}
// 下载
export function downloadResultForTicket(params) {
  return get(`/ticket_analysis/download`,params, true, {}, 10*60*1000, 'arraybuffer');
}
// 结果分页
export function getRunResultForTicket(params) {
  return get(`/ticket_analysis/taskPageResultPage`, params);
}
// 刷新
export function refreshTaskForTicket(id) {
  return get(`/ticket_analysis/refresh?id=${id}`)
}
// 取消
export function cancelTaskForTicket(id) {
  return get(`/ticket_analysis/cancel?id=${id}`)
}
// 自定义规则：获取小票分析所有的下拉字段
export function getTicketAnalysisField() {
  return get(`/ticket_analysis/getCategories`);
}