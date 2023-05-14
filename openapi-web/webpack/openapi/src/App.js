import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConfigProvider, Button, Modal, message } from '@aurum/pfe-ui'; // 不能删除
import Store from '@/redux/store';
import MainLayout from '@/MainLayout';
import { getLocalLocale } from './locales/init';
import zhCN from 'antd/es/locale/zh_CN';
import en_US from 'antd/es/locale/en_US';

const store = Store();
const config = require('./config');

Modal.config({
  rootPrefixCls: 'pfe',
});

message.config({
  prefixCls: 'pfe-message',
});


const App = () => {
  const { t } = useTranslation();
  return (
    <section className="container">
      <ConfigProvider locale={getLocalLocale(t) === 'en' ? en_US : zhCN} prefixCls="pfe">
        <BrowserRouter>
          <Provider store={store}>
            <Route path={`/${config.projectName}`} component={MainLayout} />
          </Provider>
        </BrowserRouter>
      </ConfigProvider>
    </section>
  );
};

export default App;
