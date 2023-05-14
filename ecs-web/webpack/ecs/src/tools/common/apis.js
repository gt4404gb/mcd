import http from '@omc/boss-https';
import config from '@/common/config/config';
import { OpenLoading, CloseLoading } from '@/redux/actions/appAction';

const httpCtx = http({
  baseUrl: config.BACKEND_ECS_ORDERADMIN_BASE_URL,
  openLoading: OpenLoading,
  closeLoading: CloseLoading
});

export function getMerchantModule() {
  const hostPath = '/eco/orderadmin';

  return {
    //导出待发货订单发货信息
    export: (params) => {
      return httpCtx.post(hostPath + '/waitSend/order/exportDeliveryInfo', { 
        params,
        responseType: "arraybuffer",
       });
    },
    //快递批量上传
    exportExpresses: (file) =>
      httpCtx.post(`${hostPath}/opt/export/expresses`, {
        params: file,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'arraybuffer',
      }),

    getExportTask: (params) =>
      httpCtx.post(`${hostPath}/opt/getExportTask`, {
        params,
      }),
  }
}