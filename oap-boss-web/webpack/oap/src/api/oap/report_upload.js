import { get, post, deletes } from './http';

//列表
export function getReportTemplateList (params) {
  return get('/report/template/list', params);
}
//详情
export function getReportTemplateDetail (params) {
  return get('/report/template/detail', params);
}
//运行
export function reportUploadRun (params) {
  return post('/report/template/import', params);
}