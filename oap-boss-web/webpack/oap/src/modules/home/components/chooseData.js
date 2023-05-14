import React from 'react';
import { Modal, Form, Row, Col, Button, Select, Input, Table, message, Space, Empty, ConfigProvider } from '@aurum/pfe-ui';
import { queryModelBySubjectIdAndTableName } from '@/api/oap/self_analysis.js';
import moment from 'moment';
import { optionFilterProp, judgeIsStaff } from "@/utils/store/func";

export default class ChooseData extends React.Component {
    constructor(props) {
        super(props);
        this.dataFormRef = React.createRef();
        this.state = {
            rowSelectListForModal: {
                type: 'radio',
                selectedRowKeys: [],
                onSelect: (record, selected, selectedRows, nativeEvent) => this.rowSelection(record, selectedRows)
            },
            visibleChooseData: false,
            checkedValue: [],
            columns: [
                { title: "查询名称", dataIndex: 'businessName', fixed: 'left', width: 200, align: 'left', ellipsis: true },
                { title: "业务域", dataIndex: 'modelNameByCode', ellipsis: true, width: 160, align: 'left' },
                { title: "类型", dataIndex: 'tableType', render: (text, record) => (<>{text === 1 ? '汇总' : '明细'}</>), ellipsis: true, width: 140, align: 'left' },
                { title: "更新时间", dataIndex: 'lastModifyAtFormat', ellipsis: true, width: 160, align: 'left' },
            ],
            dataList: [],
            loading: false,
            initValues: {},
            isStaff: false
        }
    }

    componentWillReceiveProps (nextProps, prevProps) {
        if (nextProps.visible && !this.props.visible) this.fetchChooseDataList('auto')
        this.setState({
            checkedValue: this.state.columns.map(it => it.dataIndex)
        })
        if (nextProps.visible && nextProps.visible !== prevProps.visible) {
            judgeIsStaff().then(res => {
                this.setState({ isStaff: res.data ?? false })
            }).catch(error => {
                error.msg && message.error(error.msg);
            })
        }
    }

    onReset = () => {
        this.dataFormRef.current.resetFields();
    }

    handleChooseData = (btnType) => {
        if (btnType === 'ok') {
            if (!this.state.selectedRows.length) {
                message.info("请先选择一条数据，再点击确认");
                return;
            }
        }
        this.onReset();
        if (btnType === 'ok') this.props.completeChoose({ ...this.state.selectedRows[0] });
        this.props.changeVisible(false);
    }

    fetchChooseDataList = (action = '') => {
        let params = this.dataFormRef.current?.getFieldValue() || {
            subjectId: null,
            queryName: '',
        };
        const { rowSelectListForModal, columns } = this.state;
        this.setState({
            dataList: [],
            loading: true,
            selectedRows: [],
            rowSelectListForModal: {
                ...rowSelectListForModal,
                selectedRowKeys: [],
            }
        }, () => {
            queryModelBySubjectIdAndTableName({ ...params }).then(res => {
                let dataList = [...res.data || []];
                dataList.forEach(item => {
                    if (item.businessCategoryId) {
                        const optionFilter = optionFilterProp(this.props?.subjectModelList, 'id', item.businessCategoryId);
                        item.modelNameByCode = optionFilter?.name || '';
                    }
                    if (item.lastModifyAt) {
                        item.lastModifyAtFormat = moment(item.lastModifyAt).format('YYYY-MM-DD HH:mm:ss')
                    }
                })
                this.setState({
                    dataList,
                }, () => {
                    if (dataList.length == 0) return;
                    if (action === 'auto') {
                        let dataLocal = JSON.parse(decodeURIComponent(sessionStorage.getItem("chooseAnalysis"))) || {};
                        if (dataLocal.selectedRowKeysForModal && dataLocal.selectedRowKeysForModal.length > 0) {
                            let temp = this.state.dataList.find(it => it.id === dataLocal.selectedRowKeysForModal[0]);
                            if (temp) {
                                this.rowSelection(temp, [temp], action);
                            } else {
                                this.rowSelection(dataList[0], [dataList[0]], action)
                            }
                        } else {
                            this.rowSelection(dataList[0], [dataList[0]], action)
                        }
                    }
                })
            }).catch(err => {
                console.log(err)
            }).finally(() => {
                this.setState({
                    loading: false
                })
            })
        })
    }

    rowSelection = (record, selectedRows, action) => {
        const { rowSelectListForModal } = this.state;
        this.setState({
            selectedRows,
            rowSelectListForModal: {
                ...rowSelectListForModal,
                selectedRowKeys: [selectedRows[0].id],
            }
        }, () => {
            //本地存储
            sessionStorage.setItem("chooseAnalysis", encodeURIComponent(JSON.stringify({ selectedRows, selectedRowKeysForModal: [selectedRows[0].id] })));
        })
    };

    customizeRenderEmpty = () => {
        return <Empty imgName="person/empty-data">
            <div style={{ color: '#222' }}>
                {this.state.isStaff ? <>更多分析内容，请点击<span className='oap-btn-blue' style={{ margin: '0 4px' }} onClick={this.goLink}>此处</span>进行申请</> : <>更多分析内容，请联系MCD雇员协助申请</>}
            </div>
        </Empty>
    }

    goLink = () => {
        let pathname = "/oap/index/apply", tabNameZh = '分析目录';
        const params = {
            tabNameZh: tabNameZh,
            tabNameEn: tabNameZh,
            path: pathname,
        };
        this.props.changeVisible(false);
        window.EventBus && window.EventBus.emit("setAppTab", null, params);
    }

    render () {
        const { visible, subjectModelList } = this.props
        return <Modal
            title="选择数据"
            visible={visible}
            width={880}
            centered
            className="choose-data"
            cancelText="取消"
            okText="确定"
            onCancel={() => this.handleChooseData('cancel')}
            onOk={() => this.handleChooseData('ok')}
            bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="table-container">
                <Form
                    className="search-form"
                    ref={this.dataFormRef}
                    layout="vertical"
                    size="middle"
                    initialValues={this.state.initValues}
                    onFinish={this.fetchChooseDataList}>
                    <div className="choose-search-area">
                        <Row gutter={32} justify="space-between" align="bottom">
                            <Col span={4}>
                                <Form.Item name="subjectId" label="业务域名称">
                                    <Select placeholder="全部" allowClear>
                                        {subjectModelList.map(model => {
                                            return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
                                        })}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name="queryName" label="查询名称">
                                    <Input
                                        placeholder="请输入查询名称"
                                        allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={4} className="oap-flex-end">
                                <Space>
                                    <Button type="primary" htmlType="submit" loading={this.state.loading}>查询</Button>
                                    <Button onClick={this.onReset}>重置</Button>
                                </Space>
                            </Col>
                        </Row>
                    </div>
                </Form>
                <div className="table-top-wrap" style={{ marginTop: '16px' }}>
                    <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
                        <Table
                            rowSelection={this.state.rowSelectListForModal}
                            rowKey="id"
                            columns={this.state.columns}
                            dataSource={this.state.dataList}
                            allFilterColumns={this.state.checkedValue}
                            tableKey="chooseData"
                            loading={this.state.loading}
                            scroll={{ x: '100%' }} />
                    </ConfigProvider>
                </div>
            </div>
        </Modal>
    }
}