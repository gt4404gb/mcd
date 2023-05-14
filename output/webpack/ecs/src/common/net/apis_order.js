import http from '@omc/boss-https';
import config from '@/common/config/config';
import { OpenLoading, CloseLoading } from '@/redux/actions/appAction';

const httpCtx = http({
  baseUrl: config.BACKEND_ECS_ORDERADMIN_BASE_URL,
  openLoading: OpenLoading,
  closeLoading: CloseLoading
});

const httpShopList = http({
  baseUrl: config.BACKEND_ECS_API_BASE_URL,
  openLoading: OpenLoading,
  closeLoading: CloseLoading
});
export function getMerchantModule() {
  const hostPath = '/eco/orderadmin';

  return {
    //订单后台-筛选项列表
    filter: (params) => {
      return httpCtx.get(hostPath + '/filter', { params });
    },
    //订单后台-列表
    list: (params) => {
      return httpCtx.get(hostPath + '/list', { params });
    },
    //订单后台-列表导出
    export: (params) => {
      return httpCtx.get(hostPath + '/export', { 
        params,
        responseType: "arraybuffer",
       });
    },
    //订单后台-列表导出校验
    exportValidate: (params) => {
      return httpCtx.get(hostPath + '/export/validate', { params });
    },
    //订单后台-详情
    detail: (params) => {
      return httpCtx.get(hostPath + '/detail', { params });
    },
    //订单后台-订单取消申请
    orderRfund: (params) => {
      return httpCtx.get(hostPath + '/opt/order/refund/apply/' + params.orderCode, { pathVars: [params.orderCode] });
    },
    //订单退款-action
    refundAction: (params) => {
      return httpCtx.get(hostPath + '/opt/order/refund/action/' + params.orderCode, { params }, { pathVars: [params.orderCode] });
    },
    //退款流程
    refundProgress: (params) => {
      return httpCtx.get(hostPath + '/opt/order/refund/progress/' + params.refundOrder, { pathVars: [params.refundOrder] });
    },
    //关闭自动续费
    terminateOrder: (params) => {
      return httpCtx.get(hostPath + '/opt/order/terminate/action/' + params.orderCode, { params }, { pathVars: [params.orderCode] });
    },
    //订单解约申请
    terminateOrderApply: (params) => {
      return httpCtx.get(hostPath + '/opt/order/terminate/apply/' + params.orderCode, { params }, { pathVars: [params.orderCode] });
    },
    //发放
    orderGoodId: (params) => {
      return httpCtx.get(hostPath + '/opt/good/bind/' + params.orderGoodId, { pathVars: [params.orderGoodId] });
    },
    getShopList: (params) => {
      return httpShopList.get('/ecc/commodity/init/shop', { params });
    },
    isSaveShopId: (params) => {
      return httpShopList.get('/ecc/commodity/shop/check', { params });
    },
    saveShopId: (params) => {
      return httpShopList.put('/ecc/commodity/shop/change', { params });
    },
    deliverDoods: (params) => {
      return httpCtx.get(hostPath + '/opt/order/express', { params });
    },
    orderCheck: (params) => {  //订单直搜校验
      return httpCtx.get(hostPath + '/order/check', { params });
    },
    couponDetail: (params) => {  //卡券详情
      return httpCtx.get(hostPath + '/coupon/detail', { params });
    },
    couponUseStatusSync: (params) => {  //订单后台-卡券详情-核销状态同步
      return httpCtx.get(hostPath + '/coupon/useStatus/sync', { params });
    },
    benefitRetry: (params) => {
      return httpCtx.get(hostPath + '/opt/benefit/retry/' + params.id, { params }, { pathVars: [params.id] });
    },
    addOrderRemark:  (params) => { // 添加订单备注
      return httpCtx.post(hostPath + '/opt/addOrderRemark', { params });
    },
    updateOrderRemark:  (params) => { // 编辑订单备注
      return httpCtx.post(hostPath + '/opt/updateOrderRemark', { params });
    },
    delOrderRemark: (params) => {  //删除订单备注
      return httpCtx.post(hostPath + '/opt/delOrderRemark/' + params.id, { params }, { pathVars: [params.id] });
    },
  }
}