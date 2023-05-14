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

export function getActivityService() {
  const baseUrl = config.BACKEND_ECS_API_ECA_URL;

  return {
    signList: (params) => {
      return httpCtx.get('/eca/activadmin/goods/sign/list', { params }); //活动商品参与记录-列表
    },
    recordList: (params) => {
      return httpCtx.get( '/eca/activadmin/goods/record/List', { params }); //活动商品出价记录-列表
    },
    //活动列表
    list: (params) => {
      return httpCtx.get('/eca/activadmin/activity/list', { params })
    },
    //活动编辑第一步
    createStep1:(params) => {
      if (params.activityId) {
        return httpCtx.put('/eca/activadmin/activity/create', { params }) // 修改
      } else {
        return httpCtx.post('/eca/activadmin/activity/create', { params }) // 新增
      }
    },
    //活动编辑第二步
    createStep2:(params) => {
      return httpCtx.post('/eca/activadmin/activity/spu/bind', { params })
    },
    // 活动编辑第二步，绑定预付券
    bindPmt: (params) => {
      return httpCtx.post('/eca/activadmin/activity/reward/bind', { params })
    },
    //活动第一步查看
    step1Detail: (params) => {
      return  httpCtx.get('/eca/activadmin/activity/detail/' + params.activityId, { pathVars: [params.activityId] })
    },
    //活动列表上线
    publish:(params) => {
      return httpCtx.post('/eca/activadmin/opt/up/'+params.activityId, {params}, { pathVars: [params.activityId]})
    },
    //活动-下线提示
    downTips:(params) => {
      return httpCtx.post('/eca/activadmin/opt/down/tips/'+params.activityId, {params}, { pathVars: [params.activityId]})
    },
    //活动列表下线
    unpublish:(params) => {
      return httpCtx.post('/eca/activadmin/opt/down/'+params.activityId, {params}, { pathVars: [params.activityId]})
    },
    //活动关联商品-列表第二部展示
    bindList:(params) => {
      return httpCtx.get('/eca/activadmin/activity/bind/spu/list', { params })
    },
    //活动解绑
    spuUnbind:(params) => {
      return httpCtx.post('/eca/activadmin/activity/spu/unbind', { params })
    },
    //活动筛选
    filter:(params) => {
      return httpCtx.get('/eca/activadmin/activity/filter', { params })
    },
    //活动筛选新
    filterNew: (params) => {
      return httpCtx.get('/eca/activadmin/activity/good/filter', { params });
    },
    //活动商品排序
    activitySort: (params) => {
      return httpCtx.post('/eca/activadmin/activity/spu/sort', { params })
    },
    //买赠活动关联赠品(关联赠品)
    rewardBind:(params) => {
      return httpCtx.post('/eca/activadmin/activity/reward/bind', { params })
    },
    //买赠活动关联赠品(解绑赠品)
    rewardUnBind:(params) => {
      return httpCtx.post('/eca/activadmin/activity/reward/unbind', { params })
    },
    //活动关联赠品-列表
    rewardList:(params) => {
      return httpCtx.get('/eca/activadmin/activity/bind/reward/list', { params })
    },
    //活动创建第二步预付券列表
    activPmtListSearch: (params) => { 
      return httpCtx.get('/eca/activadmin/activity/coupon/list', { params })
    },
    //活动创建第二步上传excel
    uploadExcel: (params) => {
        return httpCtx.post(`/eca/activadmin/activity/excel/ab/update`, { 
        params,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'arraybuffer',
      })
    },
    //查询活动创建第二步上传excel
    searchExcel: (activityId) => {
      return httpCtx.get(`/eca/activadmin/activity/excel/ab/detail/${activityId}`, { activityId })
    }
  }
}


export function getProService() {
    const baseUrl = config.BACKEND_ECS_API_BASE_URL;
    return {
      activList: (params) => {   //活动创建第二部的产品列表
          return prohttpCtx.get('/ecc/commodity/activ/list', { params })
      },
      activListSearch: (params) => {   //活动创建第二部的产品列表
        return prohttpCtx.post('/ecc/commodity/online/common/search', { params })
      }
    }
  }
