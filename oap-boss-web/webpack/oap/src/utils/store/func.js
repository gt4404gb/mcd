import { getDictionaryLabel } from '@mcd/portal-components/dist/utils/DictUtil';
import { getCurrentUserIsStaff } from '@/api/oap/commonApi';

// 扁平化array
export const flattenArray = (arr) => {
  while (arr.some(item => Array.isArray(item))) {
    arr = [].concat(...arr);
  }
  return arr;
};

// 给定目标数组或字符串，从字典中取符合给定code的展示名
export const pickStringFromArray = (target, type) => {
  const targetArr = Array.isArray(target) ? target : target.split(',');
  let arr = [];
  for (let i = 0; i < targetArr.length; i++) {
    arr = [...arr, getDictionaryLabel(type, targetArr[i])];
  }
  return arr.join(', ');
};

// 将url中的参数转为key、value的形式
// 例如auditTaskCode=222&beCode=123，转化为{auditTaskCode: 222, beCode:123}
export const queryUrlParams = (str) => {
  if (str.indexOf('?') > -1) {
    const arr = str.substr(1).split('&');
    let target = {};
    arr.forEach((item, index) => {
      let temp = item.split('=');
      target = { ...target, [temp[0]]: temp[1] || '' };
    });
    return target;
  }
  return {};
};

export const numToMoneyField = (value, decimal = 2) => {
  if (value == 0 || value == '') {
    return Number(0).toFixed(decimal)
  }
  const val = Number(value)
  if (isNaN(val)) return ''
  var regExpInfo = /(\d{1,3})(?=(\d{3})+(?:$|\.))/g;
  var ret = val.toFixed(decimal).replace(regExpInfo, "$1,");
  return ret
}

//清除数字千分位
export const clearComma = (s) => {
  s = s.toString();
  if (s.trim() == "") {
    return s;
  } else {
    return (s + "").replace(/[,]/g, "");
  }
}

export const getFileContent = (file) => {
  return new Promise(function (resolve, reject) {
    const fileReader = new FileReader();
    fileReader.readAsText(file, 'utf-8');
    fileReader.onload = function (e) {
      let fileText = e.target.result;
      resolve(fileText);
    };

    fileReader.onerror = function () {
      reject('file reader error');
    };

    fileReader.onabort = function () {
      reject('file reader abort error');
    };
  });
}

export const uuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const optionFilterProp = (arr, key, matchedValue) => {
  let result = arr.find(item => {
    return item[key] == matchedValue;
  });
  return result;
};

export const formatTimeSeconds = (time, isStart) => {
  let result
  if (isStart) {
    result = new Date(time).setHours(0, 0, 0, 0)
  } else {
    result = new Date(time).setHours(23, 59, 59, 0)
  }
  return result
}

export const judgeIsStaff = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await getCurrentUserIsStaff();
      resolve(res)
    } catch (error) {
      reject(error)
    }
  })
}

//转化 0: 否 1：是 
export const whetherConversion = (whether) => {
  let value = '' + whether;
  if (!value) return '';
  return value == '0' ? '否' : '是';
}
