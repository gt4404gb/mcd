import http from '@omc/boss-https';
import config from '@/common/config/config';
import { OpenLoading, CloseLoading } from '@/redux/actions/appAction';

const httpCtx = http({
  baseUrl: config.BACKEND_ECS_API_ECA_URL,
  openLoading: OpenLoading,
  closeLoading: CloseLoading
});

const prohttpCtx = http({
  baseUrl: config.BACKEND_ECS_API_BASE_URL
});

export function getAcutionList() {
  
  return {
    filter: (params) => {
      return prohttpCtx.get('/ecc/commodity/filter', { params }); //商品类目筛选项
    },
    signList: (params) => {
      return httpCtx.get('/eca/activadmin/goods/sign/list', { params }); //活动商品参与记录-列表
    },
    recordList: (params) => {
      return httpCtx.get( '/eca/activadmin/goods/record/List', { params }); //活动商品出价记录-列表
    },
  }
}