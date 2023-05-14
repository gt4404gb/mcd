import React from "react";
import { Spin, Form, Row, Col, Input, Select, Button, Space, Table, Tree, Tabs, message } from '@aurum/pfe-ui';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import NoticePop from "../../components/NoticePop";
import { uuid, optionFilterProp } from '@/utils/store/func';
import CustomTab from '@/components/CustomTab';
import {
    getAnalysisSceneList,
    getBusinessDetailByIdType,
    postDataOwnerConfig,
    postBusinessOwnerConfig,
    getThemeList,
    getDomainList,
    confirmEmail,
    getReportOwnerAgain,
} from '@/api/dam/analysisScene';
import { FIELD_NAMES_DEFAULT, GUILDE_TYPE_LIST, APPLYINFO_TYPE } from '@/constants';
import { reject } from "lodash";

const businessOwnerStr = 'business',
    dataOwnerStr = 'data',
    dataOwnerStatus = 'dataOwnerStatus',
    businessOwnerStatus = 'businessOwnerStatus',
    expirationTimeBusiness = 'expirationTimeBusiness',
    expirationTimeData = 'expirationTimeData';
const columnsForSonComDef = [
    { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
    { title: '分析名称', dataIndex: 'name', ellipsis: true, fixed: 'left', width: 160 },
    { title: '分析类型', dataIndex: 'category', ellipsis: true, width: 120 },
    { title: '说明', dataIndex: 'description', ellipsis: true, width: 200, align: 'left' },
]
class AnalysisSceneList extends React.Component {
    constructor(props) {
        super(props);
        this.appBusinessDomainRef = React.createRef();
        this.state = {
            isLoading: false,
            checkedValue: ['tableIndex', 'name', 'subjectNames', 'categoryNames', 'typeName', 'description', 'businessOwnerName', 'dataOwnerName', 'operation'],
            columns: [
                { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
                {
                    title: '分析名称',
                    dataIndex: 'name',
                    ellipsis: true,
                    fixed: 'left',
                    width: 180,
                    // align: 'left',
                    // render: (text, record) => (
                    // 	<Tooltip placement="topLeft" title={text} key={record.id}>
                    // 		{record.type == APPLYINFO_TYPE.selfhelp ? (checkMyPermission('oap:home:saveChart') ? <a onClick={() => this.gotoPage(record)}>{text}</a> : <a>{text}</a>) : (
                    // 			checkMyPermission('oap:sql:sqlQuery') ? <a onClick={() => this.gotoPage(record)}>{text}</a> : <a>{text}</a>)}
                    // 	</Tooltip>
                    // )
                },
                { title: '主题', dataIndex: 'subjectNames', ellipsis: true, width: 180 },
                { title: '业务域', dataIndex: 'categoryNames', ellipsis: true, width: 120 },
                { title: '分析类型', dataIndex: 'typeName', ellipsis: true, width: 120 },
                { title: '说明', dataIndex: 'description', ellipsis: true, width: 120 },
                { title: '业务Owner', dataIndex: 'businessOwnerName', ellipsis: true, width: 120 },
                { title: '数据Owner', dataIndex: 'dataOwnerName', ellipsis: true, width: 120 },
                {
                    title: '操作',
                    dataIndex: 'operation',
                    fixed: 'right',
                    width: 100,
                    render: (text, record) => {
                        return <Space size="middle" key={record.id}>
                            {checkMyPermission('oap:assets:business:owner:business') ? <a onClick={() => this.openOwnerPop(record, businessOwnerStr, false)}>业务Owner</a> : null}
                            {checkMyPermission('oap:assets:business:owner:data') ? <a onClick={() => this.openOwnerPop(record, dataOwnerStr, false)}>数据Owner</a> : null}
                        </Space>
                    }
                }
            ],
            dataList: [],
            pageSize: 10,
            pageNo: 1,
            total: null,
            noticeProps: {
                isShow: false,
                title: 'Title',
                isBatch: false,
                columnsForSon: columnsForSonComDef,
                dataListForSon: [],
                idList: [],
                isBusiness: false,
                needConfirm: true,
            },
            analysisCateoryList: GUILDE_TYPE_LIST.filter(it => it.value != '2_2'),
            rowSelectionForOwner: {
                type: 'checkbox',
                selectedRowKeys: [],
                onChange: this.rowSelectionFun,
            },
            rowSelectMultipie: [],
            fieldNames: [
                {
                    title: 'name',
                    key: 'id',
                    children: 'sonSubjectList'
                },
                { ...FIELD_NAMES_DEFAULT }
            ],
            treeData: [],
            treeLoading: false,
            recordSelectedForTreeData: {}
        }

    }
    rowSelectionFun = (selectedRowsKeys, selectedRows) => {
        console.log('selectedRows = ', selectedRows);
        let ids = selectedRows.map(row => {
            if (row && row.id) {
                return row.id;
            }
        }) || [];
        this.setState(state => ({
            ...state,
            rowSelectMultipie: [...selectedRows],
            rowSelectionForOwner: {
                ...state.rowSelectionForOwner,
                selectedRowKeys: ids, // [...selectedRows],
            }
        }))
    }

    componentDidMount () {
        this.fetchDataList();
        this.init();
    }
    init () {
        this.setState({
            treeData: [],
            treeLoading: true,
        }, async () => {
            const res = await Promise.all([getThemeList(), getDomainList()]);
            let tree_data = [[
                {
                    name: '全部',
                    id: 'all',
                    sonSubjectList: []
                },
                ...res[0]?.data
            ], [
                {
                    name: '全部',
                    id: 'all',
                    children: []
                },
                ...res[1]?.data
            ]];
            this.setState({
                treeData: [...tree_data],
                treeLoading: false,
            })
        })
    }
    //重置查询条件
    onReset = () => {
        this.appBusinessDomainRef.current.resetFields();
    }
    onPageChange = (pageNo, pageSize) => {
        this.setState({
            pageNo: pageNo,
            pageSize: pageSize
        }, () => {
            this.appBusinessDomainRef.current.submit();
        });
    }
    // linkToDetail = () => {
    //     console.log('查看详情！')
    // }
    fetchDataList = () => {
        let formData = this.appBusinessDomainRef.current.getFieldsValue(), commitParams = {};
        const params = { ...this.state.recordSelectedForTreeData, ...formData };
        const keyArr = Object.keys(params);
        keyArr.forEach(key => {
            if (params[key] !== 'all' && (params[key] ?? '') !== '') {
                commitParams[key] = params[key];
            }
        })
        commitParams = { ...commitParams, size: this.state.pageSize, page: this.state.pageNo - 1 };
        this.setState(state => ({
            isLoading: true,
            dataList: [],
            rowSelectMultipie: [],
            rowSelectionForOwner: {
                ...state.rowSelectionForOwner,
                selectedRowKeys: [],
            }
        }), () => {
            getAnalysisSceneList(commitParams).then(res => {
                let records = res.data.items || [], dataList = [];
                dataList = records.map((item, index) => {
                    return {
                        ...item,
                        tableIndex: (this.state.pageNo - 1) * this.state.pageSize + index + 1,
                        subjectNames: item.subjectNames.join('-'),
                        categoryNames: item.categoryNames.join('-'),
                        typeName: optionFilterProp(GUILDE_TYPE_LIST, 'value', item.type)?.label,
                    }
                });
                this.setState({
                    dataList,
                    total: res.data.total
                });
            }).catch(err => {
                message.error(err?.msg || err?.message || '网络异常，请稍后重试');
            }).finally(() => {
                this.setState({
                    isLoading: false
                })
            })
        })
    }
    // 单个可以查看详情
    openOwnerPop = (record, type, isBatch) => {
        if (record && record.id) {
            let params = {
                id: record.id,
                type: record.type,
            }
            getBusinessDetailByIdType(params).then(res => {
                if (type == businessOwnerStr) {
                    let couldOperate = true;
                    if (res.data.businessOwnerStatus == 3) {
                        let nowTimestamp = Date.now();
                        if (nowTimestamp < res.data.expirationTimeBusiness) {
                            couldOperate = false;
                        }
                    }
                    let curCategory = {
                        id: res.data.id,
                        name: record.name, // res.data.businessName,
                        type: type,
                        typeKey: params.type, // res.data.type,
                        status: res.data.businessOwnerStatus, // 0初始化，1已确认，2已拒绝，3待确认+时间
                        statusName: businessOwnerStatus,
                        time: res.data.expirationTimeBusiness,
                        timeName: expirationTimeBusiness,
                        applyInfo: res.data.businessApplyInfo || null,
                        couldOperate: couldOperate,
                        againId: res.data.flowIdBusiness,
                    }
                    this.setState(state => ({
                        ...state,
                        noticeProps: {
                            isShow: true,
                            title: '业务Owner',
                            isBatch: isBatch,
                            columnsForSon: [],
                            dataListForSon: [],
                            idList: [curCategory],
                            isBusiness: false,
                            needConfirm: true,
                        }
                    }))
                } else if (type == dataOwnerStr) {
                    let couldOperate = true;
                    if (res.data.dataOwnerStatus == 3) {
                        let nowTimestamp = Date.now();
                        if (nowTimestamp < res.data.expirationTimeData) {
                            couldOperate = false;
                        }
                    }
                    let curCategory = {
                        id: res.data.id,
                        name: record.name, // res.data.businessName,
                        type: type,
                        typeKey: params.type, // res.data.type,
                        status: res.data.dataOwnerStatus,
                        statusName: dataOwnerStatus,
                        time: res.data.expirationTimeData,
                        timeName: expirationTimeData,
                        applyInfo: res.data.dataApplyInfo || null,
                        couldOperate: couldOperate,
                        againId: '',
                    }
                    this.setState(state => ({
                        ...state,
                        noticeProps: {
                            isShow: true,
                            title: '数据Owner',
                            isBatch: isBatch,
                            columnsForSon: [],
                            dataListForSon: [],
                            idList: [curCategory],
                            isBusiness: false,
                            needConfirm: false,
                        }
                    }))
                }
            }).catch(err => {
                message.error(err?.msg || err?.message || '网络异常，请稍后重试');
            })
        }
    }
    //
    openOwnerPopBatch = (list, type, isBatch) => {
        if (list instanceof Array && list.length > 0) {
            let nowTimestamp = Date.now();
            if (type == businessOwnerStr) {
                let dataL = [];
                let newL = list.map((res, index) => {
                    let couldOperate = true;
                    if (res.businessOwnerStatus == 3) {
                        if (nowTimestamp < res.expirationTimeBusiness) {
                            couldOperate = false;
                        }
                    }
                    dataL.push({
                        tableIndex: index + 1,
                        id: res.id,
                        name: res.name,
                        category: type,
                        description: `${couldOperate ? '可配置' : '用户待确认，配置无效'}`
                    })
                    return {
                        id: res.id,
                        name: res.name,
                        type: type,
                        typeKey: res.type,
                        status: res.businessOwnerStatus,
                        statusName: businessOwnerStatus,
                        time: res.expirationTimeBusiness,
                        timeName: expirationTimeBusiness,
                        applyInfo: {},
                        couldOperate: couldOperate,
                        againId: '',
                    }
                })
                this.setState(state => ({
                    ...state,
                    noticeProps: {
                        isShow: true,
                        title: '业务Owner',
                        isBatch: isBatch,
                        columnsForSon: columnsForSonComDef,
                        dataListForSon: dataL,
                        idList: newL,
                        isBusiness: false,
                        needConfirm: true,
                    }
                }))
            } else if (type == dataOwnerStr) {
                let dataL = [];
                let newL = list.map((res, index) => {
                    let couldOperate = true;
                    if (res.dataOwnerStatus == 3) {
                        if (nowTimestamp < res.expirationTimeData) {
                            couldOperate = false;
                        }
                    }
                    dataL.push({
                        tableIndex: index + 1,
                        id: res.id,
                        name: res.name,
                        category: type,
                        description: `${couldOperate ? '可配置' : '用户待确认，配置无效'}`
                    })
                    return {
                        id: res.id,
                        name: res.name,
                        type: type,
                        typeKey: res.type,
                        status: res.dataOwnerStatus,
                        statusName: dataOwnerStatus,
                        time: res.expirationTimeData,
                        timeName: expirationTimeData,
                        applyInfo: {},
                        couldOperate: couldOperate,
                        againId: '',
                    }
                })
                this.setState(state => ({
                    ...state,
                    noticeProps: {
                        isShow: true,
                        title: '数据Owner',
                        isBatch: isBatch,
                        columnsForSon: columnsForSonComDef,
                        dataListForSon: dataL,
                        idList: newL,
                        isBusiness: false,
                        needConfirm: false,
                    }
                }))
            }
        }
    }
    topTabsCallback = () => {

    }
    businessOwnerBatch = () => {
        if (this.state.rowSelectionForOwner.selectedRowKeys.length > 0) {
            this.openOwnerPopBatch(this.state.rowSelectMultipie, businessOwnerStr, true);
        } else {
            message.warning('请勾选需要配置Owner的选项！')
        }
    }
    dataOwnerBatch = () => {
        if (this.state.rowSelectionForOwner.selectedRowKeys.length > 0) {
            this.openOwnerPopBatch(this.state.rowSelectMultipie, dataOwnerStr, true);
        } else {
            message.warning('请勾选需要配置Owner的选项！')
        }
    }
    informSomeone = (params) => {
        console.log('params = ', params);
        return new Promise((resolve, reject) => {
            if (params.id && params.id.length > 0 && params.employeeNumber) {
                let item = params.id[0];
                let data = params.id.map((it) => {
                    return {
                        id: it.id,
                        name: it.name,
                        type: it.typeKey,
                        [it.statusName]: it.status,
                        [it.timeName]: it.time,
                    }
                });
                console.log('data = ', data);
                if (item.type == businessOwnerStr) {
                    postBusinessOwnerConfig(params.employeeNumber, data).then(res => {
                        message.success('操作成功！');
                        resolve('success', res);
                    }).catch(err => {
                        message.error(err?.msg || err?.message || '网络异常，请稍后重试');
                        reject('err');
                    }).finally(() => {
                        this.fetchDataList();
                    })
                } else if (item.type == dataOwnerStr) {
                    postDataOwnerConfig(params.employeeNumber, data).then(res => {
                        message.success('操作成功！');
                        resolve('success', res);
                    }).catch(err => {
                        message.error(err?.msg || err?.message || '网络异常，请稍后重试');
                        reject('err');
                    }).finally(() => {
                        this.fetchDataList();
                    })
                }
            } else {
                reject('err', '未勾选数据');
            }
        })
    }
    informSomeoneAgain = (againId) => {
        console.log('againId = ', againId);
        return new Promise((resolve, reject) => {
            getReportOwnerAgain(againId).then(res => {
                message.success('操作成功！');
                resolve('success');
            }).catch(err => {
                message.error(err?.msg || err?.message || '网络异常，请稍后重试');
                reject('err');
            }).finally(() => {
                this.fetchDataList();
            })
        })
    }
    handleSelectedForTreeData = (data) => {
        let params = {}, key = data.curTab == 0 ? 'subjectId' : 'categoryId';
        if (data['selectedKeys'] == 'mine') {
            params['care'] = 1;
        } else {
            params[key] = data['selectedKeys'];
        }
        this.setState({
            recordSelectedForTreeData: params,
            pageSize: 10,
            pageNo: 1
        }, () => {
            this.fetchDataList();
        })
    }
    gotoPage = (record) => {
        if (record.type == APPLYINFO_TYPE.selfhelp) {
            this.gotoHomePage(record)
        } else if (record.type == APPLYINFO_TYPE.sql) {
            this.gotoSQLPage(record)
        }
    }
    //去自助取数页面
    gotoHomePage = (record) => {
        let pathname = "/oap/home", tabNameZh = '自助取数';
        sessionStorage.setItem('oapHomeModelInfo', encodeURIComponent(JSON.stringify({
            modelId: record.id,
            tableType: record.tableType
        })))
        const params = {
            tabNameZh: tabNameZh,
            tabNameEn: tabNameZh,
            path: pathname,
        };
        window.EventBus && window.EventBus.emit("setAppTab", null, params);
    }
    //去SQL页面
    gotoSQLPage = (record) => {
        let pathname = "/oap/sql", tabNameZh = 'SQL查询';
        sessionStorage.setItem('oapSqlTemplateId', encodeURIComponent(JSON.stringify({
            sqlTemplateId: record.id,
            id: record.id
        })))
        const params = {
            tabNameZh: tabNameZh,
            tabNameEn: tabNameZh,
            path: pathname,
        };
        window.EventBus && window.EventBus.emit("setAppTab", null, params);
    }
    hideNotice = () => {
        this.setState({
            noticeProps: {
                isShow: false,
            }
        })
    }
    render () {
        const { isLoading, analysisCateoryList, treeData, fieldNames, treeLoading } = this.state;
        return <Spin spinning={isLoading}>
            <div className="oap-container">
                <Row className="oap-row oap-sql-row">
                    <Col className="oap-analysis-col-flex" style={{ marginRight: '12px', width: '182px', top: 9 }}>
                        <div className="analysisSceneLeft" style={{ height: '100%', overflowY: 'auto' }}>
                            <CustomTab
                                treeLoading={treeLoading}
                                treeData={treeData}
                                fieldNames={fieldNames}
                                onSelected={this.handleSelectedForTreeData}
                            />
                        </div>
                    </Col>
                    <Col className="table-container oap-sql-right">
                        <div className="analysisSceneRight">
                            <Form
                                className="search-form"
                                ref={this.appBusinessDomainRef}
                                layout="vertical"
                                size="middle"
                                initialValues={{ type: 'all' }}
                                onFinish={this.fetchDataList}>
                                <div className="search-area">
                                    <Row gutter={32}>
                                        <Col span={4}>
                                            <Form.Item name="name" label="分析名称">
                                                <Input
                                                    placeholder="查询分析名称"
                                                    allowClear />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item name="businessOwnerName" label="业务Owner">
                                                <Input
                                                    placeholder="查询业务Owner名称"
                                                    allowClear />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item name="dataOwnerName" label="数据Owner">
                                                <Input
                                                    placeholder="查询Owner名称"
                                                    allowClear />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item name="type" label="分析类型">
                                                <Select placeholder='请选择类型' allowClear>
                                                    {analysisCateoryList.map(model => {
                                                        return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
                                                    })}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={12}>
                                            <Space>
                                                <Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询</Button>
                                                <Button onClick={this.onReset}>重置</Button>
                                                <Button onClick={this.businessOwnerBatch}>业务Owner批量</Button>
                                                <Button onClick={this.dataOwnerBatch}>数据Owner批量</Button>
                                            </Space>
                                        </Col>
                                    </Row>
                                </div>
                            </Form>
                            <div className="table-top-wrap">
                                <Table
                                    rowKey="id"
                                    columns={this.state.columns}
                                    dataSource={this.state.dataList}
                                    allFilterColumns={this.state.checkedValue}
                                    tableKey="DAM_analysis_domain"
                                    rowSelection={this.state.rowSelectionForOwner}
                                    pagination={{
                                        showQuickJumper: true,
                                        showSizeChanger: true,
                                        pageSize: this.state.pageSize,
                                        current: this.state.pageNo,
                                        total: this.state.total,
                                        onChange: (pageNo, pageSize) => this.onPageChange(pageNo, pageSize)
                                    }}
                                    scroll={{ x: '100%' }}
                                />
                            </div>
                        </div>
                    </Col>
                </Row>
                {this.state.noticeProps.isShow ? <NoticePop {...this.state.noticeProps} informAgainChild={this.informSomeoneAgain} informSomeoneByChild={(params) => this.informSomeone(params)} onHide={this.hideNotice} /> : null}
            </div>
        </Spin>
    }
}
export default AnalysisSceneList;

const LikeTab = () => {
    return (<div>

    </div>)
}