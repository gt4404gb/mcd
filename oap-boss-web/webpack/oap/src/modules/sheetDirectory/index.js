import React from 'react';
import { Spin, Form, Row, Col, Button, Table, message, Input, Select, Space, Modal, Popconfirm, Tree, Tooltip } from '@aurum/pfe-ui';
import { IconInfoCircle } from '@aurum/icons';
import { getTableHeight } from '@mcd/portal-components/dist/utils/table';
import { querySubjectTree, querySheetLayerList, querySheetList, querySheetFieldList, syncAuthStatus } from '@/api/oap/data_map.js';
import { querySubjectModelByLevel } from '@/api/oap/self_analysis.js';
import { optionFilterProp } from "@/utils/store/func";
import { SHEET_FREQUENCY_LIST, SHEET_TYPE_LIST, AUTH_STATUS_LIST, APPLY_STATUS_LIST, AUTH_STATUS, APPLY_STATUS } from '@/constants';
import querystring from "query-string";
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { judgeIsStaff } from '@/utils/store/func';
import SvgIcon from '@/components/SvgIcon';
import moment from 'moment';
import SearchInput from '@/components/SearchInput';
import BlockTitle from '@/components/blockTitle/index';

export default class sheetDirectory extends React.Component {
    constructor(props) {
        super(props);
        this.formSheetRef = React.createRef();
        this.formApplyPermissionRef = React.createRef();
        this.queryKeyWords = React.createRef();
        this.userInfoLocal = {};
        const userInfo = localStorage.getItem('USER_INFO');
        if (userInfo) {
            this.userInfoLocal = JSON.parse(userInfo);
        }
        this.state = {
            isLoading: false,
            treeData: [],
            selectTreeKeys: [],//选中的tree
            sheetLayerList: [],//表分层
            checkedValue: ['tableIndex', 'tableName', 'description', 'layerName', 'businessCategoryName', 'subjectName', 'tableType', 'dataFrequency', 'updateFrequency', 'authStatusName', 'applyStatusName', 'operation'],
            columns: [
                { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
                {
                    title: '表名',
                    dataIndex: 'tableName',
                    ellipsis: true,
                    fixed: 'left',
                    width: 180,
                    render: (text, record) => {
                        let element =
                            record.isNew > 0 ? <span key={record.id} style={{ color: '#0093ff', cursor: 'pointer' }} onClick={() => this.showTableNewInfo(record)}>
                                <SvgIcon icon='is_new' className='normal_is_new_icon'></SvgIcon>
                                <Tooltip placement="topLeft" title={text}><span>{text}</span></Tooltip>
                            </span> : <Tooltip key={record.id} placement="topLeft" title={text}><span>{text}</span></Tooltip>;
                        return element;
                    }
                },
                { title: '中文名', dataIndex: 'description', ellipsis: true, width: 180 },
                { title: '表分层', dataIndex: 'layerName', ellipsis: true, width: 180 },
                { title: '业务域', dataIndex: 'businessCategoryName', ellipsis: true, width: 120 },
                { title: '主题域归属', dataIndex: 'subjectName', ellipsis: true, width: 120 },
                { title: '表类型', dataIndex: 'tableType', ellipsis: true, width: 120 },
                { title: '数据频率', dataIndex: 'dataFrequency', ellipsis: true, width: 120 },
                { title: '更新频率', dataIndex: 'updateFrequency', ellipsis: true, width: 120 },
                {
                    title: "权限状态",
                    dataIndex: 'authStatusName',
                    ellipsis: true,
                    width: 120,
                    render: (text, record) => {
                        return <span key={record.id} style={{ color: record.authStatus == AUTH_STATUS.havePermission ? '#32cd32' : '' }}>{text}</span>
                    }
                },
                {
                    title: "审批状态",
                    dataIndex: 'applyStatusName',
                    ellipsis: true,
                    width: 120,
                    render: (text, record) => {
                        if (record.applyStatus === APPLY_STATUS.stateless && (record?.mainId ?? '') === '') {
                            return <a key={record.id} style={{ fontSize: '12px' }}>{text}</a>
                        }
                        return <a key={record.id} style={{ fontSize: '12px' }} onClick={() => this.gotoApply(record.id, this.userInfoLocal?.adid, 'process')}>{text}</a>
                    }
                },
                {
                    title: '操作',
                    dataIndex: 'operation',
                    fixed: 'right',
                    width: 200,
                    render: (text, record) => this.renderOperation(text, record)
                }
            ],
            dataList: [],
            pageSize: 10,
            pageNo: 1,
            total: null,
            detailInfoVisible: false,//modal数据详情
            detailInfo: {},
            fieldInfoVisible: false,//modal查看字段
            fieldInfo: {},
            fieldInfoColumns: [
                { title: '序号', dataIndex: 'tableIndex', width: 80 },
                { title: '字段名', dataIndex: 'fieldName', ellipsis: true, width: 140 },
                { title: '字段类型', dataIndex: 'fieldType', ellipsis: true, width: 100 },
                { title: '字段含义', dataIndex: 'description', ellipsis: true, width: 180 },
            ],
            fieldInfoDataList: [],
            fieldInfoLoading: false,
            tableHeight: '',
            applyPermissionVisible: false,
            applyLoading: false,
            fieldName: '',
            formData: {
                tableType: 'all',
                businessCategoryId: 'all',
                dataFrequency: 'all',
                layerId: 'all',
                authStatus: 'all',
                applyStatus: 'all',
                newOnline: 'all'
            },
            subjectModelList: [],
            applyAble: false,
            tableNewVisible: false,
            currentTableItem: {},
            newOnlineList: [
                { value: 'all', label: '全部' },
                { value: '1', label: '新上线' },
            ]
        }

        props.cacheLifecycles.didRecover(this.componentDidRecover)
    }

    async componentDidMount () {
        await this.initData();
        await this.fetchDataList();
        try {
            const res = await judgeIsStaff();
            this.setState({ applyAble: res.data })
        } catch (error) {
            console.log('judgeIsStaff 400', error)
        }
    }

    componentDidRecover = async () => {
        await this.fetchDataList();
    }

    onReset = () => {
        this.formSheetRef.current.resetFields();
    }

    onPageChange = (pageNo, pageSize) => {
        this.setState({
            pageNo: pageNo,
            pageSize: pageSize
        }, () => {
            this.formSheetRef.current.submit();
        });
    }

    //初始化，获取treeData主题域 和 表分层
    initData = async () => {
        this.setState({ isLoading: true });
        try {
            const resData = await Promise.all([
                querySubjectTree({ type: 0 }),
                querySheetLayerList(),
                querySubjectModelByLevel()
            ]);
            let treeData = resData[0].data || [],
                sheetLayerList = resData[1].data || [],
                subjectModelList = resData[2]?.data || [];
            treeData.unshift({ id: 'all', name: '全部' });
            sheetLayerList.unshift({ id: 'all', name: '全部' });
            subjectModelList.unshift({ id: 'all', name: '全部' });
            this.setState({
                treeData,
                sheetLayerList,
                selectTreeKeys: resData[0].data.length ? [resData[0].data[0].id] : [],
                subjectModelList
            })
        } catch (errInfo) {
            errInfo.msg && message.error(errInfo.msg);
            this.setState({
                isLoading: false
            })
        }
    }

    //点击树节点触发
    handleSelectTree = (selectTreeKeys) => {
        this.setState({
            selectTreeKeys,
            pageSize: 10,
            pageNo: 1,
        }, async () => {
            await this.fetchDataList();
        })
    }

    //获取查询列表
    fetchDataList = () => {
        let params = this.formSheetRef.current.getFieldsValue();
        //去除‘全部’的id
        let arr = ['layerId', 'businessCategoryId', 'tableType', 'dataFrequency', 'authStatus', 'applyStatus', 'newOnline'], tempObj = { ...params };
        arr.forEach(key => {
            if (tempObj[key] == 'all') delete tempObj[key];
        })
        let commitParams = Object.assign({
            size: this.state.pageSize,
            page: this.state.pageNo - 1,
            subjectId: this.state.selectTreeKeys.length && this.state.selectTreeKeys[0] != 'all' ? this.state.selectTreeKeys[0] : ''
        }, tempObj);
        this.setState({
            isLoading: true,
            dataList: [],
        }, () => {
            querySheetList(commitParams).then(res => {
                let dataList = res.data.items || [];
                dataList.forEach((item, index) => {
                    if (item.tableType) {
                        item.tableType = optionFilterProp(SHEET_TYPE_LIST, 'value', item.tableType)?.label || '';
                    }
                    if (item.dataFrequency) {
                        item.dataFrequency = optionFilterProp(SHEET_FREQUENCY_LIST, 'value', item.dataFrequency)?.label || '';
                    }
                    if (item.subjectName) {
                        item.subjectName = item.subjectName.join(' — ');
                    }
                    if ((item?.authStatus ?? '') !== '') {
                        item.authStatusName = optionFilterProp(AUTH_STATUS_LIST, 'value', item.authStatus)?.label || '';
                    }
                    if ((item?.applyStatus ?? '') !== '') {
                        if (item.applyStatus == 9 && (item?.mainId ?? '') !== '') {
                            item.applyStatusName = optionFilterProp(APPLY_STATUS_LIST, 'value', 10)?.label || '';
                        } else {
                            item.applyStatusName = optionFilterProp(APPLY_STATUS_LIST, 'value', item.applyStatus)?.label || '';
                        }
                    }
                    item.tableName = `${item?.databaseName}.${item.name}`
                    item.tableIndex = (this.state.pageNo - 1) * this.state.pageSize + index + 1;
                })
                this.setState({
                    dataList,
                    total: res.data?.total,
                });
            }).catch(err => {
                err.msg && message.error(err.msg);
            }).finally(() => {
                this.setState({
                    isLoading: false
                })
            })
        })
    }

    renderOperation = (text, record) => {
        const detail = {
            key: "detail",
            text: "详情",
            clickFn: () => this.handleDetail(record)
        };
        const view = {
            key: "view",
            text: "查看字段",
            clickFn: () => this.handleView(record)
        };
        const sync = {
            key: "sync",
            text: "重新同步",
            title: "申请表权限",
            content: <>
                <span>当前表权限开通失败，可重新同步开通</span>
                <div>如仍失败，请联系产品负责人</div>
            </>,
            clickFn: () => this.confirmSync(record.id, this.userInfoLocal?.adid)
        };
        const apply = {
            key: "apply",
            text: "申请",
            clickFn: () => {
                if (record.applyStatus == APPLY_STATUS.stateless) {
                    this.gotoApply(record.id, this.userInfoLocal?.adid, 'apply')
                } else {
                    this.gotoApply(record.id, this.userInfoLocal?.adid, 'form')
                }
            }
        };
        const withdraw = {
            key: "withdraw",
            text: "查看审批",
            clickFn: () => {
                this.gotoApply(record.id, this.userInfoLocal?.adid, 'withdraw')
            }
        };

        let btnsArr = [detail, view];
        switch (record.authStatus) {
            case AUTH_STATUS.noPermission:
                if (checkMyPermission('oap:table:init')) {
                    if (record.applyStatus == APPLY_STATUS.stateless) {
                        btnsArr.push(apply)
                    } else if (record.applyStatus == APPLY_STATUS.applying) {
                        btnsArr = [detail, view, withdraw]
                    } else if (record.applyStatus == APPLY_STATUS.back) {
                        btnsArr.push(apply)
                    } else if (record.applyStatus == APPLY_STATUS.withdrawn) {
                        btnsArr.push(apply)
                    }
                }
                break;
            case AUTH_STATUS.havePermission:
                btnsArr = [detail, view];
                break;
            case AUTH_STATUS.syncFailed:
                if (record.applyStatus == APPLY_STATUS.passed) {
                    btnsArr.push(sync)
                }
                break;
        }

        return <Space size="middle" className="oap-index-action" key={record.id}>
            {btnsArr.map(btn => {
                return (["sync"].includes(btn.key) ? <Popconfirm
                    key={btn.key}
                    title={<div>{btn.title}<div>{btn.content}</div></div>}
                    okText="重新同步"
                    cancelText="取消"
                    onConfirm={btn.clickFn}>
                    <a href="#" style={{ fontSize: '12px' }}>{btn.text}</a>
                </Popconfirm> : <a key={btn.key} onClick={btn.clickFn} style={{ fontSize: '12px' }}>{btn.text}</a>)
            })}
        </Space>
    }

    gotoApply = (tableId, adid, type) => {
        if (type == 'apply') {
            this.props.history.push({
                pathname: "/oap/sheet-directory/create",
                search: querystring.stringify({ tableId, adid })
            });
        } else {
            this.props.history.push({
                pathname: "/oap/sheet-directory/form",
                search: querystring.stringify({ tableId, adid })
            });
        }
    }

    //详情
    handleDetail = (record) => {
        this.setState({
            detailInfoVisible: true,
            detailInfo: record
        })
    }

    //查看字段
    handleView = (record) => {
        this.setState({
            fieldInfoVisible: true,
            fieldInfo: {
                name: record.name,
                tableId: record.id
            }
        }, () => {
            this.handleSearchField();
        })
    }

    formValueFormat = (value) => {
        this.setState({ fieldName: value })
    }

    //查看字段的搜索
    handleSearchField = (str = '') => {
        this.setState({ fieldInfoLoading: true, fieldInfoDataList: [] });
        const { fieldInfo } = this.state;
        querySheetFieldList({
            tableId: fieldInfo.tableId,
            name: str
        }).then(resList => {
            let fieldInfoDataList = resList.data || [];
            fieldInfoDataList.forEach((item, index) => {
                item.tableIndex = index + 1;
            })
            this.setState({
                fieldInfoDataList,
                fieldInfoLoading: false,
                tableHeight: getTableHeight('oap-sheet-detailInfo', 140)
            })
        }).catch(errInfo => {
            errInfo.msg && message.error(errInfo.msg);
            this.setState({
                fieldInfoLoading: false
            })
        })
    }

    //同步
    confirmSync = (tableId, adid) => {
        this.setState({
            isLoading: true
        }, () => {
            syncAuthStatus({ tableId, adid }).then(res => {
                res.msg == 'success' && message.success('同步成功');
                this.fetchDataList();
            }).catch(errInfo => {
                errInfo.msg && message.error(errInfo.msg);
                this.setState({
                    isLoading: false
                })
            })
        })
    }

    linkToApply = () => {
        this.props.history.push({
            pathname: '/oap/index/apply/create',
            search: querystring.stringify({ isOthers: true, from: 'data' })
        });
    }

    //问题反馈
    feedback = () => {
        window.open('https://pmo.mcd.com.cn/jira/projects/DQIT/issues/DQIT-7?filter=allopenissues')
    }
    showTableNewInfo = (record) => {
        this.setState({
            tableNewVisible: true,
            currentTableItem: { ...record }
        })
    }
    render () {
        const { isLoading, subjectModelList, sheetLayerList, detailInfoVisible, detailInfo, fieldInfoVisible, fieldInfo, applyAble, tableNewVisible } = this.state;
        return <Spin spinning={isLoading}>
            <div className="oap-container">
                <Row className="oap-row oap-sql-row">
                    <Col className="oap-analysis-col-flex" style={{ marginRight: '12px', width: '182px' }}>
                        <div className="oap-card padnone" style={{ padding: '6px 0 6px 10px', border: 'none' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>数据</h4>
                            <Tree
                                treeData={this.state.treeData}
                                fieldNames={{
                                    title: 'name',
                                    key: 'id',
                                    children: 'sonSubjectList'
                                }}
                                blockNode
                                selectedKeys={this.state.selectTreeKeys}
                                className='oap-tree'
                                onSelect={this.handleSelectTree} />
                        </div>
                    </Col>
                    <Col className="table-container oap-sql-right">
                        <Form
                            className="search-form"
                            ref={this.formSheetRef}
                            layout="vertical"
                            size="middle"
                            initialValues={this.state.formData}
                            onFinish={this.fetchDataList}>
                            <div className="search-area">
                                <Row gutter={32}>
                                    <Col span={3}>
                                        <Form.Item name="name" label="关键词">
                                            <Input
                                                placeholder="查询表名或中文名"
                                                allowClear />
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item name="businessCategoryId" label="业务域">
                                            <Select placeholder='请选择' allowClear>
                                                {subjectModelList.map(model => {
                                                    return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
                                                })}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item name="layerId" label='表分层'>
                                            <Select placeholder='请选择' allowClear>
                                                {sheetLayerList.map(model => {
                                                    return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
                                                })}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item name="tableType" label='表类型'>
                                            <Select placeholder='请选择' allowClear>
                                                {SHEET_TYPE_LIST.map(model => {
                                                    return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
                                                })}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item name="dataFrequency" label='数据频率'>
                                            <Select placeholder='请选择' allowClear>
                                                {SHEET_FREQUENCY_LIST.map(model => {
                                                    return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
                                                })}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item name="authStatus" label="权限状态">
                                            <Select placeholder='请选择' allowClear>
                                                {AUTH_STATUS_LIST.map(model => {
                                                    return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
                                                })}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item name="applyStatus" label="审批状态">
                                            <Select placeholder='请选择' allowClear>
                                                {APPLY_STATUS_LIST.map(model => {
                                                    return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
                                                })}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item name="newOnline" label="新上线">
                                            <Select placeholder='请选择' allowClear>
                                                {this.state.newOnlineList.map(model => {
                                                    return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
                                                })}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col flex="1">
                                        <Space>
                                            <Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询</Button>
                                            <Button onClick={this.onReset}>重置</Button>
                                        </Space>
                                    </Col>
                                    <Col flex="80px">
                                        {applyAble && checkMyPermission('oap:apply:save') ? <Button type="primary" onClick={this.linkToApply}>为供应商申请</Button> : null}
                                    </Col>
                                </Row>
                            </div>
                        </Form>
                        <div className="table-top-wrap" style={{ flex: 1, paddingTop: '32px' }}>
                            <div className="table-top-btn" style={{ top: '16px' }}>
                                <Space>
                                    <Button type="primary" onClick={this.feedback}>问题反馈</Button>
                                    <Tooltip title="若无反馈页面权限， 请发送邮件至data.science@cn.mcd.com申请" overlayInnerStyle={{ width: '200px' }}>
                                        <IconInfoCircle style={{ color: 'rgb(34,34,34)' }} />
                                    </Tooltip>
                                </Space>
                            </div>
                            <Table
                                rowKey="id"
                                columns={this.state.columns}
                                dataSource={this.state.dataList}
                                allFilterColumns={this.state.checkedValue}
                                tableKey="oapSheet"
                                pagination={{
                                    showQuickJumper: true,
                                    showSizeChanger: true,
                                    pageSize: this.state.pageSize,
                                    current: this.state.pageNo,
                                    total: this.state.total,
                                    onChange: (pageNo, pageSize) => this.onPageChange(pageNo, pageSize)
                                }}
                                scroll={{ x: '100%' }} />
                        </div>
                    </Col>
                </Row>
            </div>
            <Modal
                width={600}
                title={this.state.currentTableItem.tableName}
                visible={tableNewVisible}
                footer={[
                    <Button type="primary" key="close" onClick={() => this.setState({ tableNewVisible: false, currentTableItem: {} })}>关闭</Button>
                ]}
                onCancel={() => this.setState({ tableNewVisible: false, currentTableItem: {} })}>
                <div className="oap-descriptions">
                    <div className="title">{detailInfo.tableName}</div>
                    <div className="item-container">
                        <div className="item-label">最新上线时间</div>
                        <div className="item-content">{moment(this.state.currentTableItem.onlineTime).format('YYYY-MM-DD')}</div>
                    </div>
                    <div className="item-container">
                        <div className="item-label">上线说明</div>
                        <div className="item-content">{this.state.currentTableItem.onlineInstructions}</div>
                    </div>
                </div>
            </Modal>
            <Modal
                width={600}
                title="数据详情"
                visible={detailInfoVisible}
                footer={[
                    <Button type="primary" key="close" onClick={() => this.setState({ detailInfoVisible: false, detailInfo: {} })}>关闭</Button>
                ]}
                onCancel={() => this.setState({ detailInfoVisible: false, detailInfo: {} })}>
                <div className="oap-descriptions">
                    <BlockTitle fontSize="14px" text="基本信息" />
                    <div className="item-container">
                        <div className="item-label">表名</div>
                        <div className="item-content">{detailInfo.tableName}</div>
                    </div>
                    <div className="item-container-flex">
                        <div className="item-container">
                            <div className="item-label">中文表名</div>
                            <div className="item-content">{detailInfo.description}</div>
                        </div>
                        <div className="item-container">
                            <div className="item-label">表类型</div>
                            <div className="item-content">{detailInfo.tableType}</div>
                        </div>
                    </div>
                    <div className="item-container">
                        <div className="item-label">主题域</div>
                        <div className="item-content">{detailInfo.subjectName}</div>
                    </div>
                    <div className="item-container">
                        <div className="item-label">表分层</div>
                        <div className="item-content">{detailInfo.layerName}</div>
                    </div>
                    <div className="item-container-flex">
                        <div className="item-container">
                            <div className="item-label">数据频率</div>
                            <div className="item-content">{detailInfo.dataFrequency}</div>
                        </div>
                        <div className="item-container">
                            <div className="item-label">更新频率</div>
                            <div className="item-content">{detailInfo.updateFrequency}</div>
                        </div>
                    </div>
                </div>
            </Modal>
            <Modal
                width={600}
                centered
                title={`查看${fieldInfo.name}`}
                visible={fieldInfoVisible}
                footer={[
                    <Button type="primary" key="close" onClick={() => this.setState({ fieldInfoVisible: false, fieldInfo: {} })}>关闭</Button>
                ]}
                onCancel={() => this.setState({ fieldInfoVisible: false, fieldInfo: {} })}
                bodyStyle={{ maxHeight: '60vh' }}
                className="oap-sheet-detailInfo">
                <SearchInput ref={this.queryKeyWords} onSearch={(str) => this.handleSearchField(str)} />
                <div style={{ fontSize: '14px', margin: '6px 0' }}>总共<b style={{ color: '#ffbc0d', margin: '0 4px' }}>{this.state.fieldInfoDataList.length}</b>条记录</div>
                <Table
                    rowKey="id"
                    columns={this.state.fieldInfoColumns}
                    dataSource={this.state.fieldInfoDataList}
                    loading={this.state.fieldInfoLoading}
                    pagination={{ position: ['none'], pageSize: 100000 }}
                    scroll={{ x: '100%', y: `calc(60vh - ${this.state.tableHeight}px)` }} />
            </Modal>
        </Spin>
    }
}