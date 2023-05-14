import request from './request';
import { ApiPrefix } from "@/utils/ApiConstants";
import axios from 'axios';

const BASE_API = ApiPrefix.OAP;

function sendHttpRequest (requests, showLoading = true) {
    return new Promise((resolve, reject) => {
        // if (showLoading && window.__store) {
        //     window.__store.dispatch(OpenLoading());
        // }
        requests
            .then((response) => {
                if (response.code !== '00000') {
                    // var message = response.message;
                    reject(response); // 返回错误
                } else {
                    resolve(response); // 返回成功
                }
            })
            .catch((e) => {
                reject(e);
            });
    });
}

export function post (url, param, prefixUrl, showLoading = true, cancelObj = {}, timeout = 10000, responseType = '') {
    if (arguments[2] === void 0) {
        prefixUrl = BASE_API;
    }
    return sendHttpRequest(
        request({
            url: prefixUrl + url,
            method: 'post',
            data: param ? param : '',
            cancelToken: new axios.CancelToken(function excutor (c) {
                cancelObj.cancel = c;
            }),
            timeout: timeout,
            responseType: responseType
        }),
        showLoading
    );
}

export function put (url, param, prefixUrl, showLoading = true) {
    if (arguments[2] === void 0) {
        prefixUrl = BASE_API;
    }
    return sendHttpRequest(
        request({
            url: prefixUrl + url,
            method: 'put',
            data: param ? param : '',
        }),
        showLoading
    );
}

export function deletes (url, param, prefixUrl, showLoading = true) {
    if (arguments[2] === void 0) {
        prefixUrl = BASE_API;
    }
    return sendHttpRequest(
        request({
            url: prefixUrl + url,
            method: 'delete',
            data: param ? param : '',
        }),
        showLoading
    );
}

export function get (url, param, prefixUrl = BASE_API, showLoading = true, cancelObj = {}, timeout = 10000, responseType = '') {
    if (arguments[2] === void 0) {
        prefixUrl = BASE_API;
    }
    return sendHttpRequest(
        request({
            url: prefixUrl + url,
            method: 'get',
            headers: {
                Version: '1.0'
            },
            params: param ? param : '',
            cancelToken: new axios.CancelToken(function excutor (c) {
                cancelObj.cancel = c;
            }),
            timeout: timeout,
            responseType: responseType
        }),
        showLoading
    );
}

export function post_param (url, param, prefixUrl, showLoading = true) {
    if (arguments[2] === void 0) {
        prefixUrl = BASE_API;
    }
    return sendHttpRequest(
        request({
            url: prefixUrl + url,
            method: 'post',
            params: param ? param : '',
        }),
        showLoading
    );
}
