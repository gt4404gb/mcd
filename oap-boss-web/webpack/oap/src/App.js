import 'antd/dist/antd.css';
import '@aurum/icons/style.less';
import '@aurum/pfe-ui/dist/pfe-ui.less';
import '@mcd/boss-common';
import './style/common-style.less';
import React from 'react';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
// import {ConfigProvider} from 'antd'; // 不能删除
import { ConfigProvider, message, Modal } from "@aurum/pfe-ui";
import { checkLocaleIsCn } from "@mcd/boss-common/dist/utils/common";
import { useTranslation } from 'react-i18next';
import configureStore from './redux/store/configureStore';
// import rootSaga from './redux/saga';
import MainLayout from '@/MainLayout';
import './locales';
// import zhCN from '@mcd/portal-components/dist/local/zh_CN';
// import en_US from '@mcd/portal-components/dist/local/en_US';
import zh_CN from "@aurum/pfe-ui/es/locale/zh_CN";
import en_US from "@aurum/pfe-ui/es/locale/en_US";
Modal.config({
    rootPrefixCls: 'pfe',
});
message.config({
    prefixCls: 'pfe-message',
});
ConfigProvider.config({
    rootPrefixCls: 'pfe',
})
// const config = require('../config');
import config from '../config';
import { SetRGM } from './redux/actions/appAction';
const store = configureStore();
// then run the saga
// store.runSaga(rootSaga);
console.log('store.getState = ', store.getState());
const App = () => {
    const {t} = useTranslation();
    let regExp = /rgm-boss/gi;
    console.log('当前域名：= ', window.location.hostname);
    if (regExp.test(window.location.hostname)) {
        store.dispatch(SetRGM());
    }
    // 
    window.$oap_i18n_t = t; //将 t 挂载在 window 上，以至于在其他组建调用时不需要再次引入
    // const locale = localStorage.getItem('locale') === 'en' ? en_US : zh_CN;

    return (
        <section className="container">
            <ConfigProvider locale={checkLocaleIsCn() ? zh_CN : en_US} prefixCls={config.prefixCls}>
                <BrowserRouter>
                    <Provider store={store}>
                        {/*<Route path={`/${config.projectName}`} component={MainLayout}/>*/}
                        <MainLayout/>
                    </Provider>
                </BrowserRouter>
            </ConfigProvider>
        </section>
    );
};

export default App;
