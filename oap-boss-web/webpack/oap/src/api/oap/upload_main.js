import { get, post, deletes, put } from './http';
import request from '@/utils/request';
import { ApiPrefix } from "@/utils/ApiConstants";

const prefixStr = '/product'

// Upload Data For Main data
// 列表
export function getUploadMainDataList (params) {
  return get(`${prefixStr}/history`, params);
}

// 上传文件
export function uploadMainDataFile (typeName, file) {
  let formData = new FormData();
  formData.append('file', file);
  return post(`${prefixStr}/upload`, formData);
}