import axios from 'axios';
import Qs from 'qs';
import {getToken, removeToken} from '@mcd/portal-components/dist/utils/auth';
import {message} from '@mcd/portal-components';
import _ from 'lodash';

// 创建axios实例
const request = axios.create({
    // baseURL: process.env.VUE_APP_BASE_API, // api的base_url
    timeout: 10 * 60 * 1000, // 请求时间超过10秒视为超时
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    },
    paramsSerializer: function (params) {
        return Qs.stringify(params, {arrayFormat: 'repeat', allowDots: true});
    }
});

let sysValues = ['syslang', 'sysdictionary', 'sysparams'];

// let pending = []; //声明一个数组用于存储每个ajax请求的取消函数和ajax标识
// let cancelToken = axios.CancelToken;
// request拦截器
request.interceptors.request.use(
    (config) => {
        let _token = getToken();

        if (_token) {
            config.headers['Authorization'] = _token; // 让每个请求携带自定义token 请根据实际情况自行修改 // change by wen hao
            config.headers['Content-Type'] = 'application/json';
            config.headers['Cache-Control'] = 'no-cache';
        }
        let signs = localStorage.getItem('sign');

        let userInfo = localStorage.getItem('USER_INFO');

        if (signs) {
            config.headers['appkey'] = 'platform';
            config.headers['sign'] = signs;
        }

        if(userInfo){
            try {
                let userInfoObj = JSON.parse(userInfo);

                if(userInfoObj && userInfoObj.eid){
                    config.headers['eid'] = userInfoObj.eid
                }
                config.headers['username'] = userInfoObj.username || ''
            }
            catch (e){

            }

        }

        // let url = config.url;
        // if (dataName) {
        //   config.headers[dataName] = localStorage.getItem(dataName);
        // }
        // if (config.params) {
        //   config.params.time = +new Date().getTime();
        // } else {
        //   config.url =
        //     config.url +
        //     (config.url.includes('?') ? '&' : '?') +
        //     'time=' +
        //     new Date().getTime();
        // }
        return config;
    },
    (error) => {
        // Do something with request error
        return Promise.reject(error);
    }
);

// respone拦截器
request.interceptors.response.use(
    (response) => {
        // window.__store && window.__store.dispatch(CloseLoading());
        // removeRepeatUrl(response.config); //在一个ajax响应后再执行一下取消操作，把已经完成的请求从pending中移除
        const res = response.data;
        // 判断是否Arraybuffer
        const isArraybuffer = _.isArrayBuffer(res);
        if (isArraybuffer) {
            // let res_ = String.fromCharCode.apply(null, new Uint8Array(res));
            // if (Object.prototype.hasOwnProperty.call(res_, 'code')) {
            // 判断返回的arraybuffer转换成string后，是否是失败的json
            // if (res_.includes('"code":') && res_.includes('"data":') && res_.includes('"msg":')) {
            if (response.headers['content-type'].toLowerCase().includes('json')) {
                let res_ = String.fromCharCode.apply(null, new Uint8Array(res));
                response.data = JSON.parse(res_);
            }
        }
        if (response.headers) {
            if (parseInt(res.code) == 2010) {
                return;
            }
            for (let i in response.headers) {
                if (response.headers.hasOwnProperty(i) && sysValues.includes(i)) {
                    localStorage.setItem(i, response.headers[i]);
                    return response.data;
                }
            }
        }
        if (response.headers['content-type'].includes('image/')) {
            let fileName = decodeURIComponent(response.headers['content-disposition'].split(';')[1].split('filename=')[1]);
            return Promise.resolve({
                data: {
                    fileBlob: response.data,
                    fileName: fileName,
                    fileType: response.headers['content-type']
                }, 
                code: '00000'
            });
        }
        // 针对接口返回的excel(csv)文件格式，进行统一的数据处理
        if (['application/vnd.ms-excel;charset=utf-8', 'application/csv'].includes(response.headers['content-type'])) {
            return Promise.resolve({data: response.data, code: '00000'});
        }
        if (['application/x-zip-compressed;charset=UTF-8'].includes(response.headers['content-type'])) {
            let fileName = decodeURIComponent(response.headers['content-disposition'].split(';')[1].split('filename*=utf-8')[1]);
            return Promise.resolve({
                data: {
                    fileBlob: response.data,
                    fileName: fileName,
                },
                code: '00000'
            });
        }
        // 针对下载文件
        if (['application/octet-stream','application/octet-stream;charset=UTF-8'].includes(response.headers['content-type'])) {
            let fileName = decodeURIComponent(response.headers['content-disposition'].split(';')[1].split('filename=')[1]);
            if (['application/octet-stream;charset=UTF-8'].includes(response.headers['content-type'])) {
                fileName = decodeURIComponent(response.headers['content-disposition'].split(';')[1].split('filename*=utf-8')[1]);
            }
            return Promise.resolve({
                data: {
                    fileBlob: response.data,
                    fileName: fileName,
                },
                code:'00000'
            })
        }
        if (res instanceof Blob) {
            let fileName = decodeURIComponent(response.headers['content-disposition'].split(';')[1].split('filename=')[1]);
            return Promise.resolve({
                data: {
                    fileBlob: response.data,
                    fileName: fileName,
                },
                code: '00000'
            })
        }
        if (parseInt(res.code) !== 200) {
            if (parseInt(res.code) === 0) {
                return Promise.resolve(response.data);
            }
            if (res.code === 'SUCCESS') {
                return Promise.resolve({
                    data: res.data,
                    code: '00000'
                })
            }
            // token过期
            if (parseInt(res.code) === 4030) {
                removeToken();
                message.warning('登录过期！');
                setTimeout(() => {
                    window.location.href = window.location.origin + '/login';
                }, 1000)
            } else if (parseInt(res.code) === 4050) {
                message.warning(res.message || '没有权限！');
                return Promise.reject(res);
            } else {
                return Promise.reject(res);
            }
        }
        return Promise.resolve(response.data);
    },
    (error) => {
        // window.__store && window.__store.dispatch(CloseLoading());
        if(error.code == 'ECONNABORTED' && error.message.indexOf('timeout')!=-1){
            message.warning('网络请求超时，请稍后再试！');
            return Promise.reject(error);
        }
        if (error.toString() !== 'Cancel') {
            message.warning(error.message || '系统异常！');
        }
        return Promise.reject(error);
    }
);

export default request;
