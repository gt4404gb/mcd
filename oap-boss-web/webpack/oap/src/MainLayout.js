import React from 'react';
import { connect } from 'react-redux';
import { Route, withRouter } from 'react-router-dom';
import CacheRoute, { CacheSwitch } from 'react-router-cache-route';
import config from '../config';
import './style/index.less'
import Home from "./modules/home/index";
import Sql from './modules/sql/index';
import Jupyter from "./modules/jupyter";
import Index from './modules/index/index';
import SheetDirectory from './modules/sheetDirectory/index';
import IndexDirectory from './modules/indexDirectory/index';
import DimensionDirectory from './modules/dimensionDirectory/index';
import CustomRules from './modules/customRules/index';
import CustomRulesForm from './modules/customRules/form';
import MDX from './modules/mdx/index';
import TicketAnalysis from './modules/ticketAnalysis/index';
import SheetDirectoryForm from './modules/sheetDirectory/form.jsx';
import reportBoard from './modules/reportBoard/index';
import GenerateReport from './modules/generateReport/index';
import BusinessTime from './modules/businessTime/index';
import RgistrationReport from './modules/rgistrationReport/index';
import ReportDataDetails from './modules/reportDataDetails/index';
import ProcessDetails from './modules/processDetails/index';
import ApplyAuth from './modules/applyAuth/index';
import IndexApplyList from './modules/index/applyList';
import CommonApplyForm from './components/applyForm';
import SupplierApplication from './modules/supplierApplication/index';
import withoutReportBoard from './modules/withoutReportBoard/index';
import WithoutBusinessTime from './modules/withoutBusinessTime/index';
import RegistrationApprovalProcess from './modules/registrationApprovalProcess/create';
//import RegistrationApprovalProcess from './modules/registrationApprovalProcess/createNew';
import MasterData from './modules/masterData/index.jsx';
import ApplyBusinessTime from './modules/applyBusinessTime/index';
import Schedule from './modules/schedule/index';
import UploadData from './modules/uploadData/index';
import Forecast from './modules/forecast/index';
import UploadMainData from './modules/uploadMainData/index';
import MonitorBorad from './modules/monitorBorad/index';
import ReportUpload from './modules/reportUpload/index';
import Database from './modules/databaseDirectory/index';
import Datasheet from './modules/databaseDirectory/datasheet';
import Datafield from './modules/databaseDirectory/datafield';
import DataApplyForm from './modules/databaseDirectory/form';
import routeMenuList from './routes/menu';
import DemandBoard from './modules/dashboard/index';
import { visitRouterForEveryPage } from './api/oap/buried_api';
import DemandApplyForm from './modules/demandApply/index';
import DataQuery from './modules/dataQuery/index';
import DataQueryDetail from './modules/dataQuery/details';

import EmailResult from './modules/emailResult';
import FastEntrance from './modules/index/fastEntrance';
import SceneDesc from './modules/index/sceneDesc';
/**
 * 数据资产管理
 */
import DataAssetForBusinessDomainList from './modules/dataAssetManagement/appliedAsset/businessDomain';
import DataAssetForAnalysisSceneList from './modules/dataAssetManagement/appliedAsset/analysisScene';
// const { path } = match;
const path = '/' + config.projectName;

class MainLayout extends React.Component {
    constructor(props) {
        super(props);
    }
    componentWillReceiveProps (nextProps) {
        const currentUserInfo = localStorage.getItem('USER_INFO');
        let _operatorId = '', _operatorName = '';
        if (currentUserInfo) {
            let info = JSON.parse(currentUserInfo);
            _operatorId = info?.employeeNumber;
            _operatorName = `${info?.chineseName}（${info?.firstName} ${info?.lastName}）`;
        }
        if (nextProps?.location?.pathname) {
            let filterUrl = routeMenuList.find(it => {
                return it.routeUrl === nextProps.location.pathname && it.isMenuShow;
            })
            if (filterUrl) {
                let menu_code = filterUrl.menuCode;
                menu_code = typeof menu_code == 'number' ? menu_code: 0;
                const obj = {
                    menu: menu_code, // filterUrl.routeName,
                    // operatorId: _operatorId,
                    // operatorName: _operatorName,
                }
                visitRouterForEveryPage(obj).then(res => {
                }).catch(() => {
                })
            }

        }
    }
    componentDidMount () {
        const currentUserInfo = localStorage.getItem('USER_INFO');
        let _operatorId = '', _operatorName = '';
        if (currentUserInfo) {
            let info = JSON.parse(currentUserInfo);
            _operatorId = info?.employeeNumber;
            _operatorName = `${info?.chineseName}（${info?.firstName} ${info?.lastName}）`;
        }
        if (this.props?.location?.pathname) {
            let filterUrl = routeMenuList.find(it => {
                return it.routeUrl === this.props.location.pathname && it.isMenuShow;
            })
            if (filterUrl) {
                let menu_code = filterUrl.menuCode;
                menu_code = typeof menu_code == 'number' ? menu_code: 0;
                const obj = {
                    menu: menu_code, // filterUrl.routeName,
                    // operatorId: _operatorId,
                    // operatorName: _operatorName,
                }
                visitRouterForEveryPage(obj).then(res => {
                }).catch(() => {
                })
            }

        }
    }

    render () {
        return (
            <CacheSwitch>
                <CacheRoute when="always" path={`${path}/home`} exact component={Home} />
                <CacheRoute when="always" path={`${path}/sql`} exact component={Sql} />
                <CacheRoute when="always" path={`${path}/jupyter`} exact component={Jupyter} />
                <Route path={`${path}/index`} exact component={Index} />
                <CacheRoute when="always" path={`${path}/sheetDirectory`} exact component={SheetDirectory} />
                <CacheRoute when="always" path={`${path}/indexDirectory`} exact component={IndexDirectory} />
                <CacheRoute when="always" path={`${path}/dimensionDirectory`} exact component={DimensionDirectory} />
                <CacheRoute when="always" path={`${path}/customRules`} exact component={CustomRules} />
                <Route path={`${path}/customRules/form`} exact component={CustomRulesForm} />
                <CacheRoute when="always" path={`${path}/mdx`} exact component={MDX} />
                <CacheRoute when="always" path={`${path}/ticketAnalysis`} exact component={TicketAnalysis} />
                <Route path={`${path}/sheet-directory/form`} exact component={SheetDirectoryForm} />
                <Route path={`${path}/sheet-directory/create`} exact component={SheetDirectoryForm} />
                <Route path={`${path}/apply-auth`} exact component={ApplyAuth} />
                <Route path={`${path}/index/apply`} exact component={IndexApplyList} />
                <Route path={`${path}/index/apply/create`} exact component={CommonApplyForm} />
                <Route path={`${path}/index/apply/form`} exact component={CommonApplyForm} />
                <CacheRoute when="always" path={`${path}/report-board`} exact component={reportBoard} />
                <CacheRoute when="always" path={`${path}/generate-report`} exact component={GenerateReport} />{/* 观远 */}
                {/* <Route path={`${path}/individual-report`} exact component={IndividualReport} /> */}
                <CacheRoute when="always" path={`${path}/business-time`} exact component={BusinessTime} />
                <CacheRoute when="always" path={`${path}/registration-report`} exact component={RgistrationReport} />
                {/* 无权限列表页 */}
                <Route path={`${path}/without-board-report`} exact component={withoutReportBoard} />
                <Route path={`${path}/without-business-time`} exact component={WithoutBusinessTime} />
                {/* 权限申请页 */}
                <Route path={`${path}/apply-business-time`} exact component={ApplyBusinessTime} />
                {/* 报告数据详情-观远 */}
                <CacheRoute when="always" path={`${path}/report-data-details`} exact component={ReportDataDetails} />
                {/* 流程 */}
                {/* 测试注册流程 */}
                <Route path={`${path}/registration-approval-process`} exact component={RegistrationApprovalProcess} />
                <CacheRoute when="always" path={`${path}/create-report`} exact component={RegistrationApprovalProcess} />
                {/* <Route path={`${path}/process-details/create`} exact component={ProcessDetails} />
                <Route path={`${path}/process-details/form`} exact component={ProcessDetails} /> */}
                {/* 为供应商申请页面 */}
                <Route path={`${path}/supplier-application`} exact component={SupplierApplication} />
                <CacheRoute when="always" path={`${path}/master-data`} exact component={MasterData} />
                <CacheRoute when="always" path={`${path}/schedule`} exact component={Schedule} />
                <CacheRoute when="always" path={`${path}/upload-data-warehouse`} exact component={UploadData} />
                <CacheRoute when="always" path={`${path}/forecast`} exact component={Forecast} />
                <CacheRoute when="always" path={`${path}/finance`} exact component={Forecast} />
                <CacheRoute when="always" path={`${path}/cbi`} exact component={Forecast} />
                <CacheRoute when="always" path={`${path}/ccc`} exact component={Forecast} />
                <CacheRoute when="always" path={`${path}/hr-analytics`} exact component={Forecast} />
                <CacheRoute when="always" path={`${path}/hr-dashboard`} exact component={Forecast} />
                <CacheRoute when="always" path={`${path}/people-dashboard`} exact component={Forecast} />
                <CacheRoute when="always" path={`${path}/upload-main-data`} exact component={UploadMainData} />
                <CacheRoute when="always" path={`${path}/report-upload`} exact component={ReportUpload} />
                <CacheRoute when="always" path={`${path}/demand-dashboard`} exact component={DemandBoard} />
                <CacheRoute when="always" path={`${path}/public-monitor-board`} exact component={MonitorBorad} />
                <CacheRoute when="always" path={`${path}/database`} exact component={Database} />
                <Route path={`${path}/datasheet`} exact component={Datasheet} />
                <Route path={`${path}/datafield`} exact component={Datafield} />
                <Route path={`${path}/database/apply-create`} exact component={DataApplyForm} />
                <Route path={`${path}/database/apply-form`} exact component={DataApplyForm} />
                <Route path={`${path}/demand/apply-form`} exact component={DemandApplyForm} />
                <Route path={`${path}/data_query`} exact component={DataQuery} />
                <Route path={`${path}/data_query_detail`} exact component={DataQueryDetail} />
                <CacheRoute when='always' path={`${path}/dataasset/applied-business-domain`} exact component={DataAssetForBusinessDomainList} />
                <CacheRoute when='always' path={`${path}/dataasset/applied-analysis-scene`} exact component={DataAssetForAnalysisSceneList} />
                {/* <CacheRoute when='always' path={`${path}/email-notice-result`} exact component={EmailResult}/> */}
                <CacheRoute when='always' path={`${path}/operation-notice`} exact component={EmailResult} />
                <Route when='always' path={`${path}/fast-entrance`} exact component={FastEntrance} />
                <Route when='always' path={`${path}/scene-description`} exact component={SceneDesc} />

                {/*404 页面 一定要放到最后*/}
                <Route component={() => <h1>404</h1>} />
            </CacheSwitch>
        );
    }
}


const mapDispatchToProps = (dispatch) => ({});

const mapStateToProps = (state, ownProps) => {
    return {
        pageLoadingVal: state.app.pageLoadingVal,
        systemHost: state.system.systemHost,
    };
};

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(MainLayout)
);
