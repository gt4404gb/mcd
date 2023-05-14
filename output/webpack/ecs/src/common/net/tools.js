import { getToken, removeToken } from '@omc/boss-common/dist/utils/auth';
import axios from 'axios';
export function $fileDownload(url, config = {}) {
    let downloadUrl =  url;
    let method = config.method || 'get';
    axios
      .request({
        url: downloadUrl,
        method: method,
        headers: {
          Authorization: getToken(),
          'Content-Type': 'application/json',
        },
        data: config.data,
        responseType: 'blob'
      })
      .then(
        response => {
          let filename = response.headers['content-disposition'];  // 取出文件名字
          if (filename) {
            let index = filename.indexOf('fileName=');
            if (index >= 0) {
              filename = filename.substr(index + 9);
              filename = decodeURI(filename);
            }
            filename = filename.substr(index + 21);
            filename = decodeURI(filename);
          }
          let fileDownload = require('js-file-download');
          fileDownload(response.data, '太阳码');
    
          if (typeof config.resolve === 'function') {
            config.resolve();
          }
        
        },
        error => {
          let hasError = true;
          if (error.response) {
            const status = error.response.status;
            if (status === 401) {
              hasError = false;
            }
          }
          if (hasError) {
            this.$showError('下载出错，请稍后再试');
          }
          if (typeof config.reject === 'function') {
            config.reject();
          }
        }
      );
  }