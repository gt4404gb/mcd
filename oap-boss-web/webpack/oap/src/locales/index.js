import React from 'react';
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import zh from './zh';
import en from './en';

let lng = 'zh';
let enUsTrans = en;
let zhCnTrans = zh;

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

function onChange(e) {
    if (e === 'en') {
        lng = 'en';
        i18n
            .use(initReactI18next) // passes i18n down to react-i18next
            .init({
                resources: {
                    en: {
                        translation: {...enUsTrans},
                    },
                    zh: {
                        translation: {...zhCnTrans},
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
                        translation: {...enUsTrans},
                    },
                    zh: {translation: {...zhCnTrans}},
                },
                lng: lng,
                fallbackLng: lng,
                interpolation: {escapeValue: false},
            });
    }
}
