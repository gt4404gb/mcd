import {get, post, deletes, put} from './http';
import request from '@/utils/request';
import {ApiPrefix} from "@/utils/ApiConstants";

const prefixStr = '/public/getpublicinfo';
// 公共监控看板
export function getBoradData(date) {
  return get(`${prefixStr}?date=${date}`);
}