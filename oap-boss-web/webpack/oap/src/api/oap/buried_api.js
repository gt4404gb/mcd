/**
 * 埋点接口
 */
import {get,post} from './http';

export function visitRouterForEveryPage(data) {
  return post(`/log/menu/save?menu=${data.menu}`, {});
}
export function viewReportForReportCenter(data) {
  return post(`/log/report/save`, data);
}
export function runAnalysisTaskForSelfCheckout(data) {
  // return post(`/log/slice/save`, data);
  return post(`/log/slice/save?sliceId=${data.sliceId}`, {});
}
export function viewSqlTemplateForSqlSearch(data) {
  // return post(`/log/sql/save`, data);
  return post(`/log/sql/save?sqlTemplateId=${data.templateId}`, {});
}