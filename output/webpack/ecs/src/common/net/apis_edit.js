import http from '@omc/boss-https';
import config from '@/common/config/config';

const httpCtx = http({
  baseUrl: config.BACKEND_ECS_API_BASE_URL
});

const httpCtxB2b = http({
  baseUrl: config.BACKEND_B2B_API_BASE_URL
});

export function getMerchantModule() {
  const basePath = '/ecc/commodity';

  return {
    //查看-商品详情-基本信息
    getCommodityBase: (params) => {
      return httpCtx.get('/ecc/commodity/step1/' + params.spuId, {
        pathVars: [params.spuId]
      });
    },
    //查看-商品详情-上架信息
    getCommodityRule: (params) => {
      return httpCtx.get('/ecc/commodity/step2/' + params.spuId, {
        pathVars: [params.spuId]
      });
    },
    //查看-商品详情-库存信息
    getCommodityStock: (params) => {
      return httpCtx.get('/ecc/commodity/step3/' + params.spuId, {
        pathVars: [params.spuId]
      });
    },
    //查看-商品详情-第4部
    getStep4: (params) => {
      return httpCtx.get('/ecc/commodity/step4/' + params.spuId, {
        pathVars: [params.spuId]
      });
    },
    // 修改-商品详情-基本信息 && 新增-商品详情-基本信息 第一步
    saveCommodityBase: (params) => {
      if (params.spuId) {
        return httpCtx.put('/ecc/commodity/step1', {
          params
        }); // 修改
      } else {
        return httpCtx.post('/ecc/commodity/step1', {
          params
        }); // 新增
      }
    },
    // 修改-商品详情-基本信息 && 添加-商品详情-上架信息 第二步
    saveCommodityRule: (params, isCreated) => {
      if (isCreated) {
        return httpCtx.post('/ecc/commodity/step2', {
          params
        }); // 新增
      } else {
        return httpCtx.put('/ecc/commodity/step2', {
          params
        }); // 修改
      }
    },
    // 修改-商品详情-基本信息 && 添加-商品详情-上架信息 第三步
    saveCommodityStock: (params) => {
      return httpCtx.post('/ecc/commodity/step3', {
        params
      }); // 新增 
    },
    // 修改-商品详情-基本信息 && 添加-商品详情-上架信息 第四步
    saveStep4: (params) => {
      return httpCtx.post('/ecc/commodity/step4', {
        params
      }); // 新增
    },
    // 保存草稿 第四步
    draftStep4: (params) => {
      return httpCtx.post('/ecc/commodity/draft/step4', {
        params
      });
    },
    // 修改,新增-活动信息 第五步
    saveStep5: (params) => {
      return httpCtx.post('/ecc/commodity/step5', {
        params
      });
    },
    //商品添加/编辑-关联卡券弹窗-返回的是全部卡券列表-
    coupons: (params) => {
      return httpCtx.get('/ecc/commodity/relatedList', {
        params
      });
    },
    //商品添加/编辑-绑定卡券-检验
    couponsRelated: (params) => {
      return httpCtx.get('/ecc/commodity/related', {
        params
      });
    },
    //卡券详情接口
    couponsDetail: (params) => {
      return httpCtx.get('/ecc/commodity/related/detail', {
        params
      });
    },
    //商品名称重复校验
    nameCheck: (params) => {
      return httpCtx.get('/ecc/commodity/name/check', {
        params
      });
    },
    //查询分类的规格
    categories: (params) => {
      const baseUrl = config.BACKEND_ECS_SHOP_BASE_URL;
      return httpCtx.get('/scs/shop/admin/user/shop/categories', {
        params,
        baseUrl
      });
    },

    categorySpecs: (params) => {
      const baseUrl = config.BACKEND_ECS_CATEGORY_BASE_URL;
      return httpCtx.get('/ecc/category/specs', {
        params,
        baseUrl
      });
    },
    //商品的税率税点
    rate: (params) => {
      return httpCtx.get('/ecc/commodity/tax/rate', {
        params
      });
    },
    //获取家庭餐厅全部数据不分页
    partyFilterStoreList: (params) => {
      return httpCtx.get('/ecc/commodity/partyFilter/store/list/all', {
        params
      });
    },
    //冲突场次列表
    partyFilterConflictList: (params) => {
      return httpCtx.post('/ecc/commodity/partyFilter/conflict/lists', {
        params
      });
    },
    //餐厅序列变更列表
    serialChangeList: (params) => {
      return httpCtx.get('/ecc/commodity/party/store/serial/change/list', {
        params
      });
    },
    //创建活动场次条件数据
    partyFilter: (params) => {
      return httpCtx.get('/ecc/commodity/partyFilter/filter', {
        params
      });
    },
    //创建活动场次条件数据
    partyCreate: (params, isNew) => {
      if (isNew) {
        return httpCtx.post('/ecc/commodity/party/create', {
          params
        });
      } else if (params.id) {
        //活动场次修改
        return httpCtx.put('/ecc/commodity/party/edit', {
          params
        });
      } else if (params.serialNo) {
        //活动场次批次修改
        return httpCtx.put('/ecc/commodity/party/serial/edit', {
          params
        });
      }
    },
    //餐厅场次列表,  
    partyStoreList: (params, currentTab) => {
      if (currentTab === '0') {
        return httpCtx.get('/ecc/commodity/party/store/list', {
          params
        });
      } else {
        //餐厅序列列表
        let seriaSearch = {};
        seriaSearch.spuId = params.spuId;
        seriaSearch.serialNo = params.serialNo;
        seriaSearch.pageSize = params.pageSize;
        seriaSearch.pageNum = params.pageNum;
        params = seriaSearch;
        return httpCtx.get('/ecc/commodity/party/store/serial/list', {
          params
        });
      }
    },
    //活动场次详情
    partyDetail: (params) => {
      if (params.type === '0') {
        return httpCtx.get('/ecc/commodity/party/detail/' + params.id, {
          pathVars: [params.id]
        });
      } else {
        return httpCtx.get('/ecc/commodity/party/serial/detail/' + params.id, {
          pathVars: [params.id]
        });
      }
    },
    //活动场次删除
    partyDelete: (params) => {
      if (params.type === '0') {
        return httpCtx.put('/ecc/commodity/party/delete/' + params.id, {
          pathVars: [params.id]
        });
      } else {
        //活动场次批次删除
        return httpCtx.put('/ecc/commodity/party/serial/delete/' + params.id, {
          pathVars: [params.id]
        });
      }
    },

    //活动场次查询新（2021:11:09）
    newPartyList: (params) => {
      return httpCtx.get('/ecc/commodity/party/store/list', {
        params
      });
    },

    //删除第三方兑换码上传的excel（2022:02:23）
    redeemCode: (params) => {
      return httpCtx.delete('/ecc/commodity/excel/redeemCode/delete/' + params.skuId + '/' + params.operationType, {
        pathVars: [params.skuId, params.operationType]
      });
    },
    exportCodes: (file) => {
      return httpCtx.post(`${basePath}/excel/taste/party/upload`, {
        params: file,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'arraybuffer',
      })
    },
    exportSessions: (params) => {
      return httpCtx.get(basePath + '/export/sessions', { 
        params,
        responseType: "arraybuffer",
       });
    },
    expressConfig: (params) => {
      return httpCtx.get(basePath + '/express/config', { 
        params
       });
    },
  }
}
export function getBMSModule() {
  const basePath = '/btb/bms';
  return {
    fetchMerchantList: (params) => httpCtxB2b.get(`${basePath}/merchant/manager/info/list`, {}),
  }
}
export function region() {
  const baseUrl = config.BACKEND_PLATFORM_API_BASE_URL
  return {
    getAllRegion: (params) => {
      return httpCtx.get('/region/getAllRegion', {
        params,
        baseUrl
      })
    }
  }
}
export function getPosterService() {
  const baseUrl = config.BACKEND_CMS_API_BASE_URL;
  return {
    crowdList: (params) => {
      const httpCtx = http({
        baseUrl: config.BACKEND_CMS_API_BASE_URL
      });
      return httpCtx.get('/cms/crowd/list/mix', {
        params,
        baseUrl
      })
    }
  }
}

export function getVoucherModule() {
  const baseUrl = config.BACKEND_VOUCHER_API_BASE_URL;
  const basePath = '/btb/voucher';
  return {
    templateQuery: (params) =>
      httpCtx.get(`${basePath}/templates`, {
        params,
        baseUrl
      }),
    templateDetail: (templateCode) =>
      httpCtx.get(`${basePath}/templates/${templateCode}`, {
        pathVars: [templateCode],
        baseUrl,
      })
  };
}