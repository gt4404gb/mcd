import { get, post, deletes, put } from "./http";
import request from "@/utils/request";
import { ApiPrefix } from "@/utils/ApiConstants";
// 报告工具-注册报告：查询报告注册列表
export function queryReportList (params) {
  return get("/report/list", params);
}
// 报告工具-注册报告：删除
export function deleteReportItem (id) {
  return deletes(`/report/delete?id=${id}`);
}
// 报告工具-注册报告：创建保存
export function saveReport (data) {
  return post("/report/save", data);
}
// 报告工具-注册报告：编辑保存
export function updateReport (data) {
  return post("/report/update", data);
}
// 报告工具-注册报告：编辑查询单个
// 获取报告详情  参数，报告id   id
export function updateReportById (id) {
  return get(`/report/detail?id=${id}`);
}
// 报告工具-注册报告：业务域
export function getBusinessList (params) {
  return get(`/report/business/list?reportRangeModule=${params}`);
}
// 报告工具-注册报告：报告范围
export function reportRange (params) {
  return get("/report/range/spinner", params);
}
// 报告工具-注册报告：MCD主题域 --- v1046作废
export function getThemeList (params) {
  return get("/report/subject/spinner", params);
}

// 报告工具-注册报告：RGM主题域 --- v1046作废
export function getRGBThemeList (params) {
  return get("/report/subject/rgm/spinner", params);
}

// 报告工具-注册报告：角色
export function getRoleList (params) {
  return get("/report/role/spinner", params);
}
// 管理者转移
export function transfer (params) {
  return put("/report/creator/transfer", params);
}

// MCD主题全部
export function getReportSubjectList (params) {
  return get("/report/subject/spinner", params);
}

// RGM 主题全部
export function getReportSubjectRGBList () {
  return get("/report/subject/rgm/spinner");
}

// 获取workflowid
export function getWorkflowId (code) {
  return get(`/sys/config/get?name=workflowid&code=${code}`);
}

// 通过报告id获取获取流程中心记录 获取到流程主id
export function getrequestId (id) {
  return get(`/report/apply/main?id=${id}`);
}

// 存取requestId
export function bindapplyAuthMain (params) {
  return post(`/report/apply/bind`, params);
}

//更新申请状态
export function changeStatus (params) {
  return put(`/report/apply/change/status?id=${params.id}&applyStatus=${params.applyStatus}`);
}
// 通过流程主id也就是mainId获取报告详情的流程记录
//状态为main，获取的报告详情以及requestid
export function getMainId (params) {
  return get(`/report/apply/report/detail?mainId=${params}`);
}

// 申请接口 提交表单内容 格式对象
export function applyAuth (params) {
  return post(`/report/auth`, params);
}
// 申请被退回或者撤回再修改提交 参数id 业务目标 申请用途 对象格式
export function againApply (params) {
  return post(`/report/apply/resubmit`, params);
}
// 获取供应商账号
export function getUserSession (params) {
  return get(`/report/user/detail?employeeNumber=${params}`)
}

// 获取对应业务域下面的报告数量
export function getBusinessCount (params) {
  console.log(params);
  return get(`/report/business/count`, params)
}

// 获取报告范围对应主题类型
export function getThemeType (params) {
  return get(`/report/subject/type?reportRangeId=${params}`)
}

// 订阅接口
export function subscribeReport (data) {
  return put(`/report/subscribe?id=${data.id}&isSubscribe=${data.isSubscribe}`);
}

// 首页 报告概览
export function getReportHome (params) {
  return get(`/report/home`, params)
}

// 以下是 v1046新增接口
// 获取主题treeData
export function getSubjectTreeData (params) {
  return get('/report/subject/count', params)
}
// 获取业务域treeData
export function getBusinessCategoryTreeData (params) {
  return get('/report/business_category/count', params)
}

export function getDetailsByMainId (params) {
  return get(`/report/apply/report/detail?mainId=${params}`);
}

export function getDetailsByReportId (id) {
  return get(`/report/detail?id=${id}`);
}