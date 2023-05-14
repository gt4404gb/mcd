import { get, post, deletes } from './http';
import request from '@/utils/request';
import { ApiPrefix } from "@/utils/ApiConstants";

//列表
export function getScheduleList (params) {
  return get('/dispatch/list', params);
}

//保存
export function saveSchedule (params) {
  return post('/dispatch/add', params);
}

//修改
export function updateSchedule (params) {
  return post('/dispatch/update', params);
}

//校验sql
export function checksql (params) {
  return post('/dispatch/checksql', params);
}

//查详情
export function getScheduleDetail (params) {
  return get('/dispatch/taskdetail', params);
}

//查详情
export function getScheduleDetailList (params) {
  return get('/dispatch/taskdetaillist', params);
}

//删除
export function deleteSchedule (params) {
  return deletes('/dispatch/delete', params);
}

//刷新
export function refreshSchedule (params) {
  return get('/dispatch/refresh', params);
}

//下载
export function downloadSchedule (params, processCallback) {
  //return get('/dispatch/download', params, true, {}, 10 * 60 * 1000, 'arraybuffer');
  return request({
    url: `${ApiPrefix.OAP}/dispatch/download`,
    method: 'get',
    params,
    onDownloadProgress: processCallback,
    responseType: 'arraybuffer'
  })
}