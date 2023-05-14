import {get, post, deletes, put} from './http';
import request from '@/utils/request';
import {ApiPrefix} from "@/utils/ApiConstants";
// 报告工具-注册报告：业务域
export function getBusinessList(params) {
    return get(`/report/business/list`,params);
}
// 报告工具-注册报告：查询报告注册列表 
export function queryReportList(params) {
    return get('/report/list', params)
}
// 报告工具-注册报告：报告范围
export function reportRange(params) {
    return get('/report/range/spinner',params);
}
// 报告工具-注册报告：编辑查询单个
export function updateReportById(id) {
    return get(`/report/detail?id=${id}`);
}
// 远观--单点登录
export function toLogin(params) {
    return post('/report/sso',params);
  }

// 远观--单点登录之注册报告访问
export function getReportSSOUrl(params) {
    return post('/report/preview/sso',params);
  }

// 观远自动登录
export function guandataSso(params) {
    return post('/report/guandata/sso',params);
  }