const Url = require('url-parse');
let PAGE_BASE_PATH = '/cms/pages/';

// const env = require('./.env');
let DEBUG = false;
let DEBUG_PROD = false;
const urlObj = new Url(window.location.href);
if (urlObj.query.match(/debug=1/)) {
  DEBUG = true;
}
if (urlObj.query.match(/debug_prod=1/)) {
  DEBUG_PROD = true;
}

const defaultConfig = {
  BACKEND_OPENAPI_API_BASE_URL: '/api/inner/openapi',
  BACKEND_CMS_API_BASE_URL: '/api/inner/cms',
  BACKEND_ECS_API_BASE_URL: '/api/inner/commodity',
  BACKEND_ECS_STOCK_API_BASE_URL: '/api/inner/stock',
  BACKEND_ECS_SHOP_BASE_URL: '/api/inner/shop',
  BACKEND_ECS_CATEGORY_BASE_URL: '/api/inner/category',
  BACKEND_ECS_ORDERADMIN_BASE_URL: '/api/inner/orderadmin',
  BACKEND_ECS_API_ECA_URL: '/api/inner/activadmin',
  BACKEND_B2B_API_BASE_URL: '/api/inner/bms',
  BACKEND_STORE_API_BASE_URL: '/api/inner/store',
  BACKEND_PLATFORM_API_BASE_URL: '/api/inner/platform',
  BACKEND_VOUCHER_API_BASE_URL: "/api/inner/voucher",
}
let envConfig = {};
if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
  envConfig = require('./config.local');
} else if (urlObj.hostname === 'boss.dev.mcd.com.cn' || urlObj.hostname === 'cdn-test.mcdchina.net') {
  envConfig = require('./config.develop');
} else if (urlObj.hostname === 'boss.test.mcd.com.cn' || urlObj.hostname === 'cdn-test.mcdchina.net') {
  envConfig = require('./config.test');
} else if (urlObj.hostname === 'boss.sit.mcd.com.cn' || urlObj.hostname === 'cdn-sit.mcdchina.net') {
  envConfig = require('./config.sit');
} else if (urlObj.hostname === 'boss.pt.mcd.com.cn' || urlObj.hostname === 'cdn-dev.mcdchina.net') {
  envConfig = require('./config.pt');
} else if (urlObj.hostname === 'boss.uat.mcd.com.cn' || urlObj.hostname === 'cdn-uat.mcdchina.net') {
  envConfig = require('./config.uat');
} else if (urlObj.hostname === 'boss.stg.mcd.com.cn' || urlObj.hostname === 'cdn-stg.mcdchina.net') {
  envConfig = require('./config.stage');
} else {
  envConfig = require('./config.master');
}

if (DEBUG_PROD) {
  envConfig = require('./config.master');
}
// envConfig = require('./config.' + process.env.REACT_APP_BRANCH);
envConfig = Object.assign({}, defaultConfig, envConfig.default);

let {
  LEGO_CDN_URL,
  BBF_BASE_URL,
  BACKEND_CMS_API_BASE_URL,
  BACKEND_OPENAPI_API_BASE_URL,
  BACKEND_ECS_API_BASE_URL,
  BACKEND_ECS_API_ECA_URL,
  BACKEND_ECS_SHOP_BASE_URL,
  BACKEND_ECS_STOCK_API_BASE_URL,
  BACKEND_ECS_CATEGORY_BASE_URL,
  BACKEND_ECS_ORDERADMIN_BASE_URL,
  BACKEND_B2B_API_BASE_URL,
  BACKEND_STORE_API_BASE_URL,
  BACKEND_PLATFORM_API_BASE_URL,
  BACKEND_VOUCHER_API_BASE_URL
} = envConfig;

export default {
  DEBUG,
  DEBUG_PROD,
  BACKEND_CMS_API_BASE_URL,
  BACKEND_OPENAPI_API_BASE_URL,
  BACKEND_ECS_API_BASE_URL,
  BACKEND_ECS_API_ECA_URL,
  BACKEND_ECS_SHOP_BASE_URL,
  BACKEND_ECS_STOCK_API_BASE_URL,
  BACKEND_ECS_CATEGORY_BASE_URL,
  BBF_BASE_URL,
  LEGO_CDN_URL,
  PAGE_BASE_PATH,
  BACKEND_ECS_ORDERADMIN_BASE_URL,
  BACKEND_B2B_API_BASE_URL,
  BACKEND_STORE_API_BASE_URL,
  BACKEND_PLATFORM_API_BASE_URL,
  BACKEND_VOUCHER_API_BASE_URL,

  getUploadProps: (setImageCallback, message, type = 'image', targetPath = 'gallery') => {
    let authorization = '';
    document.cookie.split(';').forEach((item) => {
      if (item.includes('Authorization')) {
        authorization = item.replace('Authorization=', '');
      }
    })

    return {
      name: 'file',
      action: defaultConfig.BACKEND_CMS_API_BASE_URL + '/cms/file/upload',
      data: {
        path: targetPath
      },
      headers: {
        Authorization: authorization,
      },
      showUploadList: false,
      beforeUpload: file => {
        let msg = '';
        if (type === 'video') {
          if (file.type !== 'video/mp4') {
            msg = 'is not a valid video file';
            if (window.$t) msg = window.$t(msg);
            message.error(`${file.name} ${msg}`);
            return false;
          }
        } else {
          if (file.type !== 'image/png' &&
            file.type !== 'image/jpeg' &&
            file.type !== 'image/x-png' &&
            file.type !== 'image/pjpeg' &&
            file.type !== 'image/svg+xml') {
            msg = 'is not a valid image file';
            if (window.$t) msg = window.$t(msg);
            message.error(`${file.name} ${msg}`);
            return false;
          }
        }
        return true;
      },
      onChange(resp) {
        if (resp.file.status === 'done') {
          const {
            fileUrl,
            width,
            height
          } = resp.file.response.data;
          setImageCallback({
            imageUrl: fileUrl,
            width,
            height,
            name: resp.file.name
          });
        } else if (resp.file.status === 'error') {
          if (message) {
            let msg = '图片上传失败，请重新操作';
            if (window.$t) msg = window.$t(msg);
            message.error(msg);
          }
        }
      }
    }
  },
  getUploadPropsFile: (setImageCallback, message, type = 'image', targetPath = 'ecs', params) => {
    let authorization = '';
    document.cookie.split(';').forEach((item) => {
      if (item.includes('Authorization')) {
        authorization = item.replace('Authorization=', '');
      }
    })

    return {
      name: 'file',
      action: defaultConfig.BACKEND_ECS_API_BASE_URL + '/ecc/commodity/excel/redeemCode/upload',
      data: {
        path: targetPath,
        importType: 3,
        operationType: params.operationType,
        spuId: params.spuId,
        skuId: params.skuId
      },
      headers: {
        Authorization: authorization,
      },
      showUploadList: false,
      beforeUpload: file => {
        let msg = '';
        if (type === 'excel') {
          return true
        } else {
          return false;
        }
      },
      onChange(resp) {
        if (resp.file.status === 'done') {
          const state = resp.file.response.success;
          setImageCallback({
            state: state,
          });
        } else if (resp.file.status === 'error') {
          if (message) {
            let msg = '上传失败，请重新操作';
            if (window.$t) msg = window.$t(msg);
            message.error(msg);
          }
        }
      }
    }
  }
}