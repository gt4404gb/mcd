const Url = require("url-parse");

// const env = require('./.env');
let ENV = "DEV";

let envConfig = {};
const urlObj = new Url(window.location.href);
if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1") {
  ENV = "LOCAL";
  envConfig = require("./config.local");
} else if (urlObj.hostname === "boss.dev.mcd.com.cn") {
  ENV = "DEV";
  envConfig = require("./config.develop");
} else if (urlObj.hostname === "boss.test.mcd.com.cn") {
  ENV = "TEST";
  envConfig = require("./config.test");
} else if (urlObj.hostname === "boss.sit.mcd.com.cn") {
  ENV = "SIT";
  envConfig = require("./config.sit");
} else if (urlObj.hostname === "boss.pt.mcd.com.cn") {
  ENV = "PT";
  envConfig = require("./config.pt");
} else if (urlObj.hostname === "boss.uat.mcd.com.cn") {
  ENV = "UAT";
  envConfig = require("./config.uat");
} else if (urlObj.hostname === "boss.stg.mcd.com.cn") {
  ENV = "STG";
  envConfig = require("./config.stage");
} else {
  ENV = "PROD";
  envConfig = require("./config.master");
}

export default {
  BACKEND_OPENAPI_API_BASE_URL: "/api/inner/openapi",
  BACKEND_BMS_API_BASE_URL: "/api/inner/bms",
  BACKEND_BOS_API_BASE_URL: "/api/inner/bos",
  BACKEND_VOUCHER_API_BASE_URL: "/api/inner/voucher",
  ...(envConfig.default || envConfig),
  ENV,
  DEBUG: false,
};
