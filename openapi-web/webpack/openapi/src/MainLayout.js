import React from 'react';
import { Redirect, Route, withRouter, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spin } from '@aurum/pfe-ui';
import Merchants from '@/apps/openapi/pages/Merchants';
import Apis from '@/apps/openapi/pages/Apis';
import ApiGroups from '@/apps/openapi/pages/ApiGroups';
import Apps from '@/apps/openapi/pages/Apps';
import SubscribedApis from '@/apps/openapi/pages/SubscribedApis';
import Dashboard from './apps/openapi/pages/Dashboard';
import Fusing from './apps/openapi/pages/mgr/Fusing';
import Blacklist from './apps/openapi/pages/mgr/Blacklist';
import BTBMerchants from '@/apps/btb/pages/merchant/List';
import BTBMerchantEdit from '@/apps/btb/pages/merchant/Edit';
import BTBMerchantAudits from '@/apps/btb/pages/merchant/Audits';
import BTBMerchantOrders from '@/apps/btb/pages/order/List';
import BTBMerchantOrderDetail from '@/apps/btb/pages/order/Detail';
import BTBCouponList from '@/apps/btb/pages/coupon/List';
import BTBCouponExpand from '@/apps/btb/pages/coupon/Expand';
import Codes from './apps/btb/pages/voucher/Codes';
import Orders from './apps/btb/pages/voucher/Orders';
import VoucherProducts from './apps/btb/pages/voucher/Products';
import VoucherProductEdit from './apps/btb/pages/voucher/ProductEdit';
import VoucherProductDetail from './apps/btb/pages/voucher/ProductDetail';
import VoucherOrderEdit from './apps/btb/pages/voucher/OrderEdit';

import DouyinGroupons from '@/apps/douyin/pages/groupon/List';
import DouyinGrouponEdit from '@/apps/douyin/pages/groupon/Edit';
import DouyinGrouponDetail from '@/apps/douyin/pages/groupon/Detail';
import DouyinPOIQuery from '@/apps/douyin/pages/poi/Query';
import DouyinPOIBind from '@/apps/douyin/pages/poi/Bind';

import DouyinTaxConfigList from '@/apps/douyin/pages/taxConfig/List';
import DouyinTaxConfigEdit from '@/apps/douyin/pages/taxConfig/Edit';

class MainLayout extends React.Component {
  componentDidMount() { }
  render() {
    const { pageLoadingVal, match } = this.props;
    const { path } = match;
    return (
      <Spin spinning={pageLoadingVal}>
        <Switch>
          <Route path={`${path}/douyin/groupons`} exact={true} component={DouyinGroupons} />
          <Route path={`${path}/douyin/groupon/edit/:grouponId?`} exact={true} component={DouyinGrouponEdit} />
          <Route path={`${path}/douyin/groupon/detail/:grouponId?`} exact={true} component={DouyinGrouponDetail} />
          <Route path={`${path}/douyin/poi/query`} exact={true} component={DouyinPOIQuery} />
          <Route path={`${path}/douyin/poi/bind`} exact={true} component={DouyinPOIBind} />
          <Route path={`${path}/douyin/taxConfigs`} exact={true} component={DouyinTaxConfigList} />
          <Route path={`${path}/douyin/taxConfig/edit/:taxConfigId?`} exact={true} component={DouyinTaxConfigEdit} />
          <Route path={`${path}/btb/merchants`} exact={true} component={BTBMerchants} />
          <Route path={`${path}/btb/merchant/edit/:merchantId?`} exact={true} component={BTBMerchantEdit} />
          <Route path={`${path}/btb/merchant/audits`} exact={true} component={BTBMerchantAudits} />
          <Route path={`${path}/btb/voucher/products`} exact={true} component={VoucherProducts} />
          <Route path={`${path}/btb/voucher/product/edit/:productId?`} exact={true} component={VoucherProductEdit} />
          <Route path={`${path}/btb/voucher/product/view/:productId?`} exact={true} component={VoucherProductDetail} />
          <Route path={`${path}/btb/voucher/orders`} exact={true} component={Orders} />
          <Route path={`${path}/btb/voucher/order/edit/:orderId?`} exact={true} component={VoucherOrderEdit} />
          <Route path={`${path}/btb/voucher/codes/:orderId?`} exact={true} component={Codes} />
          <Route path={`${path}/btb/orders`} exact={true} component={BTBMerchantOrders} />
          <Route path={`${path}/btb/order/detail/:orderId`} exact={true} component={BTBMerchantOrderDetail} />
          <Route path={`${path}/btb/coupons`} exact={true} component={BTBCouponList} />
          <Route path={`${path}/btb/coupon/expand`} exact={true} component={BTBCouponExpand} />
          <Route path={`${path}/merchants`} exact={true} component={Merchants} />
          <Route path={`${path}/apps/:merchantId?`} exact={true} component={Apps} />
          <Route path={`${path}/apis`} exact={true} component={Apis} />
          <Route path={`${path}/api/categories`} exact={true} component={ApiGroups} />
          <Route path={`${path}/subscribed/apis/:appId?`} exact={true} component={SubscribedApis} />
          <Route path={`${path}/dashboard`} exact={true} component={Dashboard} />
          <Route path={`${path}/mgr/fusing`} exact={true} component={Fusing} />
          <Route path={`${path}/mgr/blacklist`} exact={true} component={Blacklist} />
          <Route path={`${path}/`}>
            <Redirect to={`${path}/merchants`} />
          </Route>
          {/*路由都不匹配时重定向到*/}
          <Redirect to="/react" />
          {/*404 页面 一定要放到最后*/}
          <Route component={() => <h1>404</h1>} />
        </Switch>
      </Spin>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({});

const mapStateToProps = (state, ownProps) => {
  return {
    pageLoadingVal: state.app.pageLoadingVal,
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(MainLayout)
);