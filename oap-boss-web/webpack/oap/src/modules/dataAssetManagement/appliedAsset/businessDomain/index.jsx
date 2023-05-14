import React from "react";
import { Spin, Form, Row, Col, Input, Button, Space, Table, message } from '@aurum/pfe-ui';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import NoticePop from "../../components/NoticePop";
import {
    getBusinessDomainList,
    getBusinessDetail,
    reportOwnerConfig,
    businessOwnerConfig,
    getBusinessOwnerAgain,
} from '@/api/dam/businessDomain';

const analysisOwnerStr = 'analysis',
    reportOwnerStr = 'report',
    reportOwnerStatus = 'reportOwnerStatus',
    businessOwnerStatus = 'businessOwnerStatus';
class BusinessDomainList extends React.Component {
    constructor(props) {
        super(props);
        this.appBusinessDomain = React.createRef();
        this.state = {
            isLoading: false,
            checkedValue: ['tableIndex', 'name', 'description', 'reportOwnerName', 'businessOwnerName', 'operation'],
            columns: [
                { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
                {
                    title: '业务域名称',
                    dataIndex: 'name',
                    ellipsis: true,
                    fixed: 'left',
                    width: 280,
                },
                { title: '说明', dataIndex: 'description', ellipsis: true, width: 160 },
                { title: '报告Owner', dataIndex: 'reportOwnerName', ellipsis: true, width: 120 },
                { title: '分析Owner', dataIndex: 'businessOwnerName', ellipsis: true, width: 120 },
                {
                    title: '操作',
                    dataIndex: 'operation',
                    fixed: 'right',
                    width: 100,
                    render: (text, record) => {
                        return <Space size="middle" key={record.id}>
                            {checkMyPermission('oap:assets:businessCategory:owner:report') ? <a onClick={() => this.openOwnerPop(record, reportOwnerStr, false)}>报告Owner</a> : null}
                            {checkMyPermission('oap:assets:businessCategory:owner:business') ? <a onClick={() => this.openOwnerPop(record, analysisOwnerStr, false)}>分析Owner</a> : null}
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
                columnsForSon: [],
                dataListForSon: [],
                idList: [],
                isBusiness: true,
                needConfirm: true,
            }
        }

    }
    componentDidMount () {
        this.fetchDataList();
    }
    init = () => {
        try {

        } catch (errInfo) {
            errInfo.msg && message.error(errInfo.msg);
            this.setState({
                isLoading: false
            })
        }
    }
    linkToDetail = () => {
        console.log('查看详情！')
    }
    fetchDataList = () => {
        let params = this.appBusinessDomain.current.getFieldsValue();
        let commitParams = Object.assign({
            size: this.state.pageSize,
            page: this.state.pageNo - 1,
        }, params);
        this.setState({
            isLoading: true,
            dataList: [],
            total: null
        }, () => {
            getBusinessDomainList(commitParams).then(res => {
                let records = res.data.items || [], dataList = [];
                dataList = records.map((item, index) => {
                    return {
                        ...item,
                        children: null,
                        tableIndex: (this.state.pageNo - 1) * this.state.pageSize + index + 1,
                    }
                })
                this.setState({
                    dataList,
                    total: res.data.total
                });
            }).catch((err) => {
                message.error(err?.msg || err?.message || '网络异常，请稍后重试');
            }).finally(() => {
                this.setState({
                    isLoading: false
                })
            })
        })
    }
    // 重置查询条件
    onReset = () => {
        this.appBusinessDomain.current.resetFields();
    }
    onPageChange = (pageNo, pageSize) => {
        this.setState({
            pageNo: pageNo,
            pageSize: pageSize
        }, () => {
            this.appBusinessDomain.current.submit();
        });
    }

    openOwnerPop = (record, type, isBatch) => {
        if (record && record.id) {
            getBusinessDetail(record.id).then(res => {
                if (type == reportOwnerStr) {
                    // expirationTimeReport --截止时间
                    let couldOperate = true;
                    if (res.data.reportOwnerStatus == 3) {
                        let nowTimestamp = Date.now();
                        if (nowTimestamp < res.data.expirationTimeReport) {
                            couldOperate = false;
                        }
                    }
                    let curCategory = {
                        id: res.data.id,
                        name: res.data.name,
                        type: type,
                        typeKey: '',
                        statusName: reportOwnerStatus,
                        status: res.data.reportOwnerStatus, // 0初始化，1已确认，2已拒绝，3待确认+时间
                        applyInfo: res.data.reportApplyInfo || null,
                        couldOperate: couldOperate,
                        againId: res.data.flowIdReport,
                    }
                    this.setState(state => ({
                        ...state,
                        noticeProps: {
                            isShow: true,
                            title: '报告Owner',
                            isBatch: isBatch,
                            columnsForSon: [],
                            dataListForSon: [],
                            idList: [curCategory],
                            isBusiness: true,
                            needConfirm: true,
                        }
                    }))
                } else if (type == analysisOwnerStr) {
                    // expirationTimeBusiness --截止时间
                    let couldOperate = true;
                    if (res.data.businessOwnerStatus == 3) {
                        let nowTimestamp = Date.now();
                        if (nowTimestamp < res.data.expirationTimeBusiness) {
                            couldOperate = false;
                        }
                    }
                    let curCategory = {
                        id: res.data.id,
                        name: res.data.name,
                        type: type,
                        typeKey: '',
                        statusName: businessOwnerStatus,
                        status: res.data.businessOwnerStatus,
                        applyInfo: res.data.businessApplyInfo || null,
                        couldOperate: couldOperate,
                        againId: res.data.flowIdBusiness,
                    }
                    this.setState(state => ({
                        ...state,
                        noticeProps: {
                            isShow: true,
                            title: '分析Owner',
                            isBatch: isBatch,
                            columnsForSon: [],
                            dataListForSon: [],
                            idList: [curCategory],
                            isBusiness: true,
                            needConfirm: true,
                        }
                    }))
                }
            }).catch(err => {
                message.error(err?.msg || err?.message || '网络异常，请稍后重试');
            })
        }
    }
    informSomeone = (params) => {
        console.log('params = ', params);
        return new Promise((resolve, reject) => {
            if (params.id && params.id.length > 0) {
                let item = params.id[0];
                let options = {
                    id: item.id,
                    employeeNumber: params.employeeNumber,
                }
                if (item.type == reportOwnerStr) {
                    reportOwnerConfig(options).then(res => {
                        message.success('操作成功！');
                        resolve('success');
                    }).catch(err => {
                        message.error(err?.msg || err?.message || '网络异常，请稍后重试');
                        reject('err');
                    }).finally(() => {
                        this.fetchDataList();
                    })
                } else if (item.type == analysisOwnerStr) {
                    businessOwnerConfig(options).then(res => {
                        message.success('操作成功！')
                        resolve('success');
                    }).catch(err => {
                        message.error(err?.msg || err?.message || '网络异常，请稍后重试');
                        reject('err');
                    }).finally(() => {
                        this.fetchDataList();
                    })
                }
            } else {
                reject('err');
            }
        })
    }
    informSomeoneAgain = (againId) => {
        console.log('againId = ', againId);
        return new Promise((resolve, reject) => {
            getBusinessOwnerAgain(againId).then(res => {
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
    hideNotice = () => {
        this.setState({
            noticeProps: {
                isShow: false,
            }
        })
    }
    render () {
        const { isLoading } = this.state;
        return <Spin spinning={isLoading}>
            <div className="table-container">
                <Form
                    className="search-form"
                    ref={this.appBusinessDomain}
                    layout="vertical"
                    size="middle"
                    onFinish={this.fetchDataList}>
                    <div className="search-area">
                        <Row gutter={32}>
                            <Col span={4}>
                                <Form.Item name="name" label="关键词">
                                    <Input
                                        placeholder="查询编号或名称"
                                        allowClear />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={8}>
                                <Space>
                                    <Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询</Button>
                                    <Button onClick={this.onReset}>重置</Button>
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
                        tableKey="DAM_business_domain"
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
                {this.state.noticeProps.isShow ? <NoticePop {...this.state.noticeProps} informAgainChild={this.informSomeoneAgain} informSomeoneByChild={(params) => this.informSomeone(params)} onHide={this.hideNotice} /> : null}
            </div>
        </Spin>
    }
}
export default BusinessDomainList;