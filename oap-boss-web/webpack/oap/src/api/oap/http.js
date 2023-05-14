import {get as commonGet, post as commonPost, deletes as commonDelete, put as commonPut} from '../../utils/http';
import {ApiPrefix} from '../../utils/ApiConstants';

export function post(url, param, showLoading = true, cancelObj = {}, timeout = 600000, responseType='') {
    return commonPost(url, param, ApiPrefix.OAP, showLoading, cancelObj, timeout, responseType);
}

export function get(url, param, showLoading = true, cancelObj = {}, timeout = 600000, responseType='') {
    return commonGet(url, param, ApiPrefix.OAP, showLoading, cancelObj, timeout, responseType);
}

export function put(url, param, showLoading = true) {
    return commonPut(url, param, ApiPrefix.OAP, showLoading);
}

export function deletes(url, param, showLoading = true) {
    return commonDelete(url, param, ApiPrefix.OAP, showLoading);
}