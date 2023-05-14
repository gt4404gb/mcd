import { get, post, deletes } from './http';
import request from '@/utils/request';
import { ApiPrefix } from "@/utils/ApiConstants";

export function querySubjectModelByLevel (params) {
  return get('/model/querySubjectModelByLevel', params);
}
export function querySliceLog (params) {
  return get('/querySlice/querySliceLog', params);
}
// 列表页批量删除
export function deleteSliceLogMulti (params) {
  return deletes(`/querySlice/delete/slice`, params)
}
// ck任务自助取数---单条任务刷新
export function handleRefreshCkAnalysisTask (id) {
  return get(`/explore/refresh?id=${id}`)
}
// ck任务自助取数---单挑任务取消
export function handleCancelCkAnalysisTask (id) {
  return get(`/explore/cancel?id=${id}`)
}
//[选择数据]列表
export function queryModelBySubjectIdAndTableName (params) {
  return get('/model/queryModelBySubjectIdAndTableName', params);
}
export function prepareChart (params) {
  return get('/explore/prepareChart', params);
}
//获取选中数据的详情
export function openChart (id) {
  return get(`/explore/openChart/${id}`);
}
//保存图表
export function saveChart (data) {
  return post('/explore/saveChart', data);
}
//自主取数--自动获取分析数据接口
export function taskPageResultPage (params) {
  return get('/explore/taskPageResultPage', params);
}
//自主取数--异步下载
export function downloadAsync (params, processCallback) {
  //return get('/explore/sqlDownload', params, true, {}, 10 * 60 * 1000, 'arraybuffer');
  return request({
    url: `${ApiPrefix.OAP}/explore/sqlDownload`,
    method: 'get',
    params,
    onDownloadProgress: processCallback,
    responseType: 'arraybuffer'
  })
}
//自主取数--获取字段的逻辑关系、枚举值等相关配置
export function getConditionConfig (params) {
  return get('/explore/fieldInfo', params);
}
//自主取数--获取级联列表
export function queryCascadeFieldInfoList (params) {
  return post('/explore/query_cascade_field_info', params, true, {}, 30000);
}
//自主取数--获取级联字段列表
export function queryFieldCascadeList (params) {
  return post('/explore/query/cascade_info', params);
}
// 自定义规则：查详情
export function getCustomRulesDetailInfo (id) {
  return get(`/custom/dimension/info/${id}`)
}
// 人群包列表
export function getSegmentList () {
  return get('/segment/list')
}
// tag列表
export function getTagList () {
  return get('/tag/list')
}
//查询名称
export function queryBusinessList (params) {
  return get('/querySlice/getBusinessList', params)
}
//消息--自动提示
export function cancelAutoNotice (params) {
  return get('/explore/notTips', params)
}
//消息--内容
export function getMessageInfos (params) {
  return get('/explore/getMessage', params)
}

//创建为人群
export function toSaveSegment (params) {
  return post('/explore/create/seg', params)
}

/**
 * for Kylin
 */

// 获取麒麟业务sliceId的信息
export function prepareChartForKylin (params) {
  return get('/kylin/prepareChart', params);
}
// 麒麟查询
export function getKylinMetaList (id) {
  // ${id}
  return get(`/kylin/queryKylinMeta/${id}`)
}
// 麒麟的保存接口
export function saveKylinAnyData (data) {
  return post(`/kylin/query`, data, true, {}, 10 * 60 * 1000);
}
// 麒麟查看接口
export function viewKylinAnyData (id) {
  return get(`/kylin/getResult/${id}`)
}
// 麒麟第三个复杂的接口
export function getKylinResultByAnyData (data, projectId, bsId) {
  return post(`/kylin/queryDimension?businessId=${bsId}&projectId=${projectId}`, data, true, {}, 10 * 60 * 1000)
}
// 麒麟的下载接口
export function getKylinDownLoadStart (data, url) {
  return post(`/kylin/download/start?${url}`, data);
}
// 麒麟的下载接口
export function getKylinDownLoadData (params, processCallback) {
  //return post(`/kylin/download?businessId=${bsId}&sliceName=${name}&projectId=${id}&email=${email}`, data, true, {}, 10 * 60 * 1000, 'arraybuffer');
  return request({
    url: `${ApiPrefix.OAP}/kylin/download`,
    method: 'get',
    params,
    onDownloadProgress: processCallback,
    responseType: 'arraybuffer'
  })
}
// 麒麟的下载接口
export function getKylinDownLoadStatus (params) {
  return get('/kylin/download/status', params);
}

/**
 * 模板
 */
export function getTemplateList (params) {
  return get('/templatemain/list', params)
}

export function saveTemplateInfo (params) {
  return post('/templatemain/save', params)
}

export function deleteTemplateLogMulti (ids) {
  return deletes('/templatemain/delete', ids)
}

export function getTemplateDetail (id) {
  return get(`/templatemain/detail?id=${id}`)
}
//获取分享人员列表
export function getTemplateSharedList (params) {
  return get('/templatemain/share/list', params)
}
//保存分享的人员列表
export function saveTemplateSharedList (params) {
  return post('/templatemain/save/share', params)
}
//批量保存分享的人员列表
export function saveBatchTemplateSharedList (params) {
  return post('/templatemain/save/batch/share', params)
}
//查询nre/tag/规则是否是自建
export function checkDimensionByOwner (params) {
  return post('/templatemain/check/dimension/owner', params)
}
//自定义规则列表
export function getCustomList (params) {
  return get('/explore/prepare_chart_custom_dimension', params)
}

//保存为系统模板
export function saveTemplateInfoByPublic (params) {
  return post('/templatemain/public/save', params)
}
//删除系统模板
export function deleteTemplateLogByPublic (id) {
  return deletes(`/templatemain/public/delete?id=${id}`)
}

//tableFilter --->ck 文本字段下拉 分页
export function getTableFilterSelectByCk (params, pageInfo) {
  return post(`/explore/result/select?page=${pageInfo.page}&size=${pageInfo.size}`, params)
}

//tableFilter --->ck 条件刷新查询
export function queryTableFilterDataByCk (params, pageInfo) {
  return post(`/explore/result/condition/page?page=${pageInfo.page}&size=${pageInfo.size}`, params)
}

//tableFilter --->trino 文本字段下拉
export function getTableFilterSelectByTrino (params, pageInfo) {
  return post(`/trino/explore/result/select?page=${pageInfo.page}&size=${pageInfo.size}`, params)
}

//tableFilter --->trino 条件刷新查询
export function queryTableFilterDataByTrino (params, pageInfo) {
  return post(`/trino/explore/result/condition/page?page=${pageInfo.page}&size=${pageInfo.size}`, params)
}

//用户标签: 列表
export function getUserTagList (params) {
  return get('/user/tag/list', params)
}

// 用户标签：版本列表
export function getUserTagVersionList (params) {
  return get('/user/tag/version/list', params)
}

// 用户标签：枚举值
export function getUserTagEnumList (params) {
  return get('/user/tag/value/list', params)
}