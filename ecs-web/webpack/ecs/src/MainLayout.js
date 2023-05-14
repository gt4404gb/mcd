import React from 'react';
import { Redirect, Route, withRouter, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spin } from '@aurum/pfe-ui';
import MerchantList from '@/pages/merchant/List';
import MerchantEdit from '@/pages/merchant/Edit';
import OrderList from '@/pages/order/List';
import OrderDetail from '@/pages/order/Detail';
import Distribution from '@/pages/distribution/List';
import DistributionEdit from '@/pages/distribution/Edit';
import Tools from '@/pages/tool/Index';
import ActivityList from '@/pages/activity/List';
import ActivityEdit from '@/pages/activity/Edit';
import ThemeEdit from '@/pages/activity/ThemeEdit';
import AuctionList from '@/pages/auctionList/List';
import PartyList from '@/pages/party/List';
import ExportOrder from '@/tools/pages/ExportOrder';

class MainLayout extends React.Component {
  componentDidMount() { }
  render() {
    const { pageLoadingVal, match } = this.props;
    const { path } = match;
    return (
      <Spin spinning={pageLoadingVal}>
        <Switch>
          <Route path={`${path}/merchants`} exact={true} component={MerchantList} />
          <Route path={`${path}/merchants/edit/:spuId/:isShow?`} component={MerchantEdit} />
          <Route path={`${path}/merchants/edit/:spuId?`} component={MerchantEdit} />
         
          <Route path={`${path}/orders`} exact={true} component={OrderList} />
          <Route path={`${path}/orders/detail/:orderCode`} component={OrderDetail} />
          <Route path={`${path}/distribution`} exact={true} component={Distribution} />
          <Route path={`${path}/distribution/edit/:id?`} exact={true} component={DistributionEdit} />

          <Route path={`${path}/tool`} exact={true} component={Tools} />

          <Route path={`${path}/activities`} exact={true} component={ActivityList} />
          <Route path={`${path}/activity/edit/:activityId/:isShow?`} component={ActivityEdit} />
          <Route path={`${path}/activity/edit/:activityId?`} exact={true} component={ActivityEdit} />

          <Route path={`${path}/theme/edit/:activityId/:isShow?`} component={ThemeEdit} />
          <Route path={`${path}/theme/edit/:activityId?`} exact={true} component={ThemeEdit} />

          <Route path={`${path}/auctionList`} exact={true} component={AuctionList} />

          <Route path={`${path}/party`} exact={true} component={PartyList} />

          <Route path={`${path}/tools/exportOrder`} exact={true} component={ExportOrder} />
          

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
