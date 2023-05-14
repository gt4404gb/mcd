import { get, post, deletes, put } from './http';
import request from '@/utils/request';
import { ApiPrefix } from "@/utils/ApiConstants";

//应用市场列表
export function getAppMarketList (params) {
    return post('/masterdata/appmaster/list', params);
}

//产品列表
export function getProductMarketList (params) {
    return post('/masterdata/productmaster/list', params);
}

//卡券列表
export function getTicketList (params) {
    return post('/masterdata/ticket/list', params);
}

//活动列表
export function getCampaignList (params) {
    return post('/masterdata/campaign/list', params);
}

export function getMasterDataMeta (params) {
    return get('/masterdata/dimension/all', params);
}

//门店列表
export function getStoreList (params) {
    return post('/masterdata/store/list', params);
}

//BE列表
export function getBEList (params) {
    return post('/masterdata/be/list', params);
}

//促销列表
export function getPromotionList (params) {
    return post('/masterdata/promotion/list', params);
}

//门店层级
export function getStoreLevelQuery (params) {
    return post('/masterdata/store/levelQuery', params);
}

//promotion层级
export function getPromotionLevelQuery (params) {
    return post('/masterdata/promotion/promotionLevelQuery', params);
}

//下载
export function downloadMasterdata (data, processCallback, url) {
    //return post(`/masterdata/download/${url}`, params, true, {}, 10 * 60 * 1000, 'arraybuffer');//arraybuffer
    return request({
        url: `${ApiPrefix.OAP}/masterdata/download/${url}`,
        method: 'post',
        data,
        onDownloadProgress: processCallback,
        responseType: 'arraybuffer'
    })
}