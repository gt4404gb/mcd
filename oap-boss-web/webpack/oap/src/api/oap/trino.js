import { get, post } from './http';
import request from '@/utils/request';
import { ApiPrefix } from "@/utils/ApiConstants";

export function prepareChartTrino (params) {
  return get('/trino/explore/prepareChart', params);
}
//获取选中数据的详情
export function openChartTrino (id) {
  return get(`/trino/explore/openChart/${id}`);
}
//保存图表
export function saveChartTrino (data) {
  return post('/trino/explore/saveChart', data);
}
//自主取数--自动获取分析数据接口
export function taskPageResultPageTrino (params) {
  return get('/trino/explore/taskPageResultPage', params);
}
//自主取数--获取字段的逻辑关系、枚举值等相关配置
export function getConditionConfigTrino (params) {
  return get('/trino/explore/fieldInfo', params);
}
//自主取数--异步下载
export function downloadAsyncTrino (params, processCallback) {
  //return get('/trino/explore/download', params, true, {}, 10 * 60 * 1000, 'arraybuffer');
  return request({
    url: `${ApiPrefix.OAP}/trino/explore/download`,
    method: 'get',
    params,
    onDownloadProgress: processCallback,
    responseType: 'arraybuffer'
  })
}