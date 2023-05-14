import {get, post, deletes, put} from './http';
import request from '@/utils/request';
import { ApiPrefix } from "@/utils/ApiConstants";
// querySubjectModelByLevel,
// sqlQuery, // 暂时没用
// queryModelInfoList, // 暂时没用
// saveTemplate,
// templatePage,
// deleteTemplate,
// editTemplate,
// getDetailTemplate,
// querySqlLog,
// savePersonalQueries,
// editPersonalQueries,
// personalQueriesPage,
// getDetailPersonalQueries,
// deletePersonalQueries,
// downLoadCsvForSqlSearchResult, // 暂时没用
// getSqlSchema,
// getSqlTableBySchema,
// getSqlFieldByTable,
// getSqlRunResult,
// downLoadCsvForSqlPrestoSearchResult,
// queryFieldInfoByTable,
// querySqlSubjectModelList,

//SQL查询接口
export function sqlQuery(data, cancelObj) {
  return post('/explore/sqlQuery', data, true, cancelObj, 10*60*1000);
}
//查询所有主题域下面表信息--（sql左侧列表）
export function queryModelInfoList(params) {
  return get('/model/queryModelInfoList', params);
}
//高阶分析--模板保存
export function saveTemplate(data) {
  return post('/template', data);
}
//高阶分析--查询模板列表
export function templatePage(params) {
  return get('/template/templatePage', params);
}
//高阶分析--删除单条模板
export function deleteTemplate(id) {
  return deletes(`/template/${id}`);
}
//高阶分析--查询单条模板详情
export function getDetailTemplate(id) {
  return get(`/template/${id}`);
}
//高阶分析--修改单条模板
export function editTemplate(params) {
  return put('/template', params);
}
//高阶分析--查询历史执行
export function querySqlLog(params) {
  return get('/explore/querySqlLog', params);
}
//高阶分析--保存
export function savePersonalQueries(data) {
  return post('/personalQueries', data);
}
//高阶分析--查询已保存的查询列表
export function personalQueriesPage(params) {
  return get('/personalQueries/page', params);
}
//高阶分析--修改单条已保存的查询
export function editPersonalQueries(params) {
  return put('/personalQueries', params);
}
//高阶分析--查询单条已保存的查询详情
export function getDetailPersonalQueries(id) {
  return get(`/personalQueries/${id}`);
}
//高阶分析--删除单条已保存的查询
export function deletePersonalQueries(id) {
  return deletes(`/personalQueries/${id}`);
}
// SQL查询结果--导出CSV
export function downLoadCsvForSqlSearchResult(data) {
  return post('/explore/sqlQueryDownData', data, true, {}, 10*60*1000);
}

// sql查询获取左侧presto中对应的hive库的catalog，schema，table和field
export function getSqlSchema() {
  return get('/sql/schema');
}
export function getSqlTableBySchema(name) {
  return get(`/sql/${name}/table`);
}
export function getSqlFieldByTable(name) {
  return get(`/sql/${name}/field`)
}
// SQL presto查询结果
export function getSqlRunResult(data, cancelObj) {
  return post('/sql/query', data, true, cancelObj, 10*60*1000);
}
// 优化轮询
export function getSqlRunResultNew(data, cancelObj) {
  return post('/sql/query2', data, true, cancelObj, 10*60*1000);
}
// 根据id查询结果返回是否失败,5s一轮
export function getSqlRunResultBoolean(data, cancelObj) {
  return post('/sql/query/run/status', data, true, cancelObj, 10*60*1000);
}
// 最后的结果
export function getSqlRunResultFinish(data, cancelObj) {
  return post('/sql/query/result', data, true, cancelObj, 10*60*1000);
}
// SQL 导出CSV结果
export function downLoadCsvForSqlPrestoSearchResult(data) {
  return post('/sql/query/download', data, true, {}, 10*60*1000, 'arraybuffer');
}
// SQL 预导出结果
export function downLoadCsvForSqlReady(data, cancelObj) {
  return post('/sql/query2/pre/download', data, true, cancelObj, 10*60*1000);
}
// SQL 真导出结果
export function downLoadCsvForSqlFinish(data) {
  // return post('/sql/query2/download', data, true, {}, 10*60*1000, 'arraybuffer');
  return request({
    url: `${ApiPrefix.OAP}/sql/query2/download`,
    method: 'post',
    data,
    // onDownloadProgress: processCallback,
    responseType: 'arraybuffer'
})
}
//SQL: 查询表下所有字段
export function queryFieldInfoByTable(params) {
  return get('/model/table/field/for_sql', params);
}
//SQL: 查询模板的业务域列表
export function querySqlSubjectModelList() {
  return get('/model/query_model_for_sql');
}
// SQL 左侧库表刷新缓存数据
export function refreshRedisDataForHive() {
  return get('/sql/refresh', {}, true,{}, 10*60*1000);
}

// 获取控制台列表
export function getUserConsoleInfo() {
  return get('/sql/console/list');
}
// 保存控制台&新建控制台
export function saveUserConsoleInfo(data) {
  return post('/sql/save/console', data);
}
// 删除控制台
export function deleteUserConsoleInfo(id) {
  return deletes(`/sql/delete/console?id=${id}`);
}

// 对话机器人
export function chatWithRobot(data) {
  return post('/ai/chat', data, true, {}, 10*60*1000);
}