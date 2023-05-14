import React from 'react';
import { Spin, Form, Row, Col, Button, Input, Table, message, Modal, Space, Tree } from '@aurum/pfe-ui';
import { queryDimensionTree, queryDimensionList } from '@/api/oap/data_map.js';
import moment from 'moment';
import BlockTitle from '@/components/blockTitle/index';

export default class DimensionDirectory extends React.Component {
    constructor(props) {
        super(props);
        this.formDimensionRef = React.createRef();
        this.querySheetKeywords = React.createRef();
        this.state = {
            isLoading: false,
            treeData: [],
            selectTreeKeys: [],//选中的tree
            checkedValue: ['tableIndex', 'name', 'abbr', 'subjectList', 'description', 'lastModifyAt', 'operation'],
            columns: [
                { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
                { title: "维度名称", dataIndex: 'name', ellipsis: true, fixed: 'left', width: 180 },
                { title: '英文标识', dataIndex: 'abbr', ellipsis: true, width: 180 },
                { title: "主题域", dataIndex: 'subjectList', ellipsis: true, width: 180 },
                { title: "描述", dataIndex: 'description', ellipsis: true, width: 180 },
                { title: "更新时间", dataIndex: 'lastModifyAt', ellipsis: true, width: 180 },
                {
                    title: '操作',
                    dataIndex: 'operation',
                    fixed: 'right',
                    width: 100,
                    render: (text, record) => (
                        <a onClick={() => this.handleDetail(record)} key={record.id}>详情</a>
                    )
                }
            ],
            dataList: [],
            pageSize: 10,
            pageNo: 1,
            total: null,
            detailInfoVisible: false,//modal数据详情
            detailInfo: {},
        }
    }

    async componentDidMount () {
        await this.initData();
        await this.fetchDataList();
    }

    onReset = () => {
        this.formDimensionRef.current.resetFields();
    }

    onPageChange = (pageNo, pageSize) => {
        this.setState({
            pageNo: pageNo,
            pageSize: pageSize
        }, () => {
            this.formDimensionRef.current.submit();
        });
    }

    //初始化，获取treeData主题域 和 表分层
    initData = async () => {
        this.setState({ isLoading: true });
        try {
            const resData = await queryDimensionTree({ type: 2 });
            let treeData = resData.data || [];
            treeData.unshift({ id: 'all', name: '全部' });
            this.setState({
                treeData,
                selectTreeKeys: resData.data.length ? [resData.data[0].id] : [],
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
        let params = this.formDimensionRef.current.getFieldsValue();
        let commitParams = Object.assign({
            size: this.state.pageSize,
            page: this.state.pageNo - 1,
            subjectId: this.state.selectTreeKeys.length && this.state.selectTreeKeys[0] != 'all' ? this.state.selectTreeKeys[0] : ''
        }, params);
        this.setState({
            isLoading: true,
            dataList: [],
        }, () => {
            queryDimensionList(commitParams).then(res => {
                let dataList = res.data.items || [];
                dataList.forEach((item, index) => {
                    if (item.subjectList) {
                        item.subjectList = item.subjectList.map(itm => itm.name).join(' — ');
                    }
                    if (item.lastModifyAt) {
                        item.lastModifyAt = moment(item?.lastModifyAt).format('YYYY-MM-DD HH:mm:ss');
                    }
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

    //详情
    handleDetail = (record) => {
        console.log(record)
        this.setState({
            detailInfoVisible: true,
            detailInfo: {
                ...record,
                dimensionProperties: record.dimensionProperties && record.dimensionProperties.map((it, idx) => ({ tableIndex: idx + 1, name: it })),
                columns: [
                    { title: '序号', dataIndex: 'tableIndex', width: 80 },
                    { title: "枚举值名称", dataIndex: 'name', ellipsis: true, align: 'left' },
                ]
            }
        })
    }

    render () {
        const { isLoading, detailInfoVisible, detailInfo } = this.state;
        return <Spin spinning={isLoading}>
            <div className="oap-container">
                <Row className="oap-row oap-sql-row">
                    <Col className="oap-analysis-col-flex" style={{ marginRight: '16px', width: '182px' }}>
                        <div className="oap-card padnone" style={{ padding: '6px 0 6px 10px', border: 'none' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>维度</h4>
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
                            ref={this.formDimensionRef}
                            layout="vertical"
                            size="middle"
                            onFinish={this.fetchDataList}>
                            <div className="search-area">
                                <Row gutter={32}>
                                    <Col span={3}>
                                        <Form.Item name="name" label="关键词">
                                            <Input
                                                placeholder="查询维度名称或标识"
                                                allowClear />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col span={12}>
                                        <Space>
                                            <Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询</Button>
                                            <Button onClick={this.onReset}>重置</Button>
                                        </Space>
                                    </Col>
                                </Row>
                            </div>
                        </Form>
                        <div className="table-top-wrap" style={{ flex: 1 }}>
                            <Table
                                rowKey="id"
                                columns={this.state.columns}
                                dataSource={this.state.dataList}
                                allFilterColumns={this.state.checkedValue}
                                tableKey="oapDimension"
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
                title={`${detailInfo.name}维度`}
                visible={detailInfoVisible}
                footer={[
                    <Button key="close" type="primary" onClick={() => this.setState({ detailInfoVisible: false, detailInfo: {} })}>关闭</Button>
                ]}
                onCancel={() => this.setState({ detailInfoVisible: false, detailInfo: {} })}>
                <div className="oap-descriptions">
                    <BlockTitle fontSize="14px" text="基本信息" />
                    <div className="item-container-flex">
                        <div className="item-container">
                            <div className="item-label">维度名称</div>
                            <div className="item-content">{detailInfo.name}</div>
                        </div>
                        <div className="item-container">
                            <div className="item-label">英文标识</div>
                            <div className="item-content">{detailInfo.abbr}</div>
                        </div>
                    </div>
                    <div className="item-container">
                        <div className="item-label">所属主题域</div>
                        <div className="item-content">{detailInfo.subjectList}</div>
                    </div>
                    <div className="item-container">
                        <div className="item-label">描述</div>
                        <div className="item-content">{detailInfo.description}</div>
                    </div>
                    <BlockTitle fontSize="14px" text="维度属性" top="10px" />
                    <div className="item-container">
                        <div className="item-label">枚举值</div>
                        <div className="item-content">
                            <Table
                                rowKey="tableIndex"
                                columns={detailInfo.columns}
                                dataSource={detailInfo.dimensionProperties}
                                pagination={{ position: ['none'], pageSize: 100000 }}
                                scroll={{ x: '100%' }} />
                        </div>
                    </div>
                </div>
            </Modal>
        </Spin>
    }
}