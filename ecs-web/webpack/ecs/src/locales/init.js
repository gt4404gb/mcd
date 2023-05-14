import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocale } from './i18nAPI';

let lng = 'zh';
let enUsTrans = {};
let zhCnTrans = {};

function onChange(e) {
  if (e === 'en') {
    lng = 'en';
    i18n
      .use(initReactI18next) // passes i18n down to react-i18next
      .init({
        resources: {
          en: {
            translation: { ...enUsTrans },
          },
          zh: {
            translation: { ...zhCnTrans },
          },
        },
        lng: lng,
        fallbackLng: lng,

        interpolation: {
          escapeValue: false,
        },
      });
  } else {
    lng = 'zh';
    i18n
      .use(initReactI18next) // passes i18n down to react-i18next
      .init({
        resources: {
          en: {
            translation: { ...enUsTrans },
          },
          zh: { translation: { ...zhCnTrans } },
        },
        lng: lng,
        fallbackLng: lng,
        interpolation: { escapeValue: false },
      });
  }
}

i18n
  .use(initReactI18next) //init i18next
  .init({
    //引入资源文件
    resources: {
      en: {
        translation: enUsTrans,
      },
      zh: {
        translation: zhCnTrans,
      },
    },
    lng: lng,
    //选择默认语言，选择内容为上述配置中的key，即en/zh
    fallbackLng: lng,
    experimentalDecorators: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

const I18N_DATA = localStorage.getItem('I18N_DATA')
let langer = window.localStorage.getItem('locale');
if (I18N_DATA) {
  const data = JSON.parse(I18N_DATA)
  enUsTrans = data.en.multilang;
  zhCnTrans = data.cn.multilang;
  onChange(langer);
} else {
  getLocale().then((response) => {
    enUsTrans = response.data.messages.en.multilang;
    zhCnTrans = response.data.messages.cn.multilang;
    onChange(langer);
  });
}

export function getLocalLocale(t) {
  window.$t = t; //将 t 挂载在 window 上，以至于在其他组建调用时不需要再次引入
  return localStorage.getItem('locale');
} 