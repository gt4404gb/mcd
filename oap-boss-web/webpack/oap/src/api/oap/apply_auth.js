import {get, post, deletes, put} from './http';

/**
 * 申请记录
 */

//列表
export function queryApplyAuthList(params) {
    return get('/apply/list', params);
  }