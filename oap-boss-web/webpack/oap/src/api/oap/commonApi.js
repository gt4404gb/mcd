import { get, post, deletes, put } from './http';
import request from '@/utils/request';
import { ApiPrefix } from "@/utils/ApiConstants";

// 获取业务域
// export function querySubjectModelByLevel(params) {
//   return get('/model/querySubjectModelByLevel', params);
// }

// 获取当前用户是否雇员
export function getCurrentUserIsStaff () {
  return get('/employee/check')
}

//获取人员信息
export function querySupplierInfo (params) {
  return get('/employee/info', params);
}

//获取用户+权限 信息
export function queryUserBusinessInfo (params) {
  return get('/employee/business/info', params);
}

//下载--发送密码
export function reSendPswByEmail (params) {
  return get('/email/resend', params);
}

//预测看板URL
export function reportAiSSO () {
  return post('/report/ai/sso');
}

export function dashboardAiSSO (params) {
  return request({
    url: `${ApiPrefix.OAP}/report/dashboard/sso?url=${params}`,
    method: 'post'
  })
}

// 上传文件
export function uploadDataFile (typeName, file) {
  let formData = new FormData();
  formData.append('file', file);
  return post(`/files/${typeName}`, formData);
}

//下载文件
export function downloadFile (id) {
  return request({
    url: `${ApiPrefix.OAP}/files/${id}?download=true`,
    responseType: 'blob',
    method: 'get',
    timeout: 10 * 60 * 1000,
  })
}
//针对 -- 下载jira文件
export function downloadFileJira (id) {
  return request({
    url: `${ApiPrefix.OAP}/files/jira/attachment/${id}`,
    responseType: 'blob',
    method: 'get',
    timeout: 10 * 60 * 1000,
  })
}

//查询人员信息
export function queryUserInfo (params) {
  return get('/oap/user/user_info_list', params);
}

//查询人员信息+权限
export function queryUserInfoByPermission (params) {
  return get('/oap/user/permission/user_info_list', params);
}