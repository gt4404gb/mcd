import React from 'react';
import { Spin, Form, Row, Col, Button, Input, Table, message, Select, Modal, Space, Tree } from '@aurum/pfe-ui';
import { queryIndexesTree, queryIndexesTagList, queryIndexesList, queryIndexDetail, queryIndexDecorationTypesInfo, queryIndexDecorationsInfo } from '@/api/oap/data_map.js';
import { optionFilterProp } from "@/utils/store/func";
import moment from 'moment';
import BlockTitle from '@/components/blockTitle/index';

export default class IndexDirectory extends React.Component {
    constructor(props) {
        super(props);
        this.formIndexesRef = React.createRef();
        this.querySheetKeywords = React.createRef();
        this.formQualifierRef = React.createRef();
        this.state = {
            isLoading: false,
            treeData: [],
            selectTreeKeys: [],//选中的tree
            IndexTypeList: [
                {
                    value: 'all',
                    label: '全部'
                },
                {
                    value: '1',
                    label: '原子指标'
                },
                {
                    value: '2',
                    label: '派生指标'
                },
                {
                    value: '3',
                    label: '复合指标'
                }
            ],
            IndexTagList: [],
            checkedValue: ['tableIndex', 'name', 'type', 'identifier', 'subjectList', 'tagInfoList', 'bizCaliber', 'lastModifyAt', 'operation'],
            columns: [
                { title: '序号', dataIndex: 'tableIndex', width: 80 },
                { title: "指标名称", dataIndex: 'name', ellipsis: true, width: 180 },
                { title: '指标类型', dataIndex: 'type', ellipsis: true, width: 180 },
                { title: '英文标识', dataIndex: 'identifier', ellipsis: true, width: 180 },
                { title: "主题域", dataIndex: 'subjectList', ellipsis: true, width: 180 },
                { title: '所属标签', dataIndex: 'tagInfoList', ellipsis: true, width: 180 },
                { title: '业务口径', dataIndex: 'bizCaliber', ellipsis: true, width: 180 },
                { title: "更新时间", dataIndex: 'lastModifyAt', ellipsis: true, width: 180 },
                {
                    title: '操作',
                    dataIndex: 'operation',
                    fixed: 'right',
                    width: 120,
                    render: (text, record) => (<Space key={record.id}>
                        <a onClick={() => this.handleDetail(record)}>详情</a>
                        <a onClick={() => this.handleQualifier(record)}>修饰词</a>
                    </Space>)
                }
            ],
            dataList: [],
            pageSize: 10,
            pageNo: 1,
            total: null,
            detailInfoVisible: false,//modal数据详情
            detailInfo: {},
            detailInfoLoading: false,
            qualifier: {
                visible: false,
                info: {},
                isLoading: false,
                columns: [
                    { title: '序号', dataIndex: 'tableIndex', width: 50 },
                    { title: "修饰词名称", dataIndex: 'name', ellipsis: true, width: 100 },
                    { title: "修饰词根", dataIndex: 'abbr', ellipsis: true, width: 80 },
                    { title: "描述", dataIndex: 'description', ellipsis: true, width: 140 },
                    { title: "口径", dataIndex: 'caliber', ellipsis: true, width: 140 }
                ],
                pageSize: 10,
                pageNo: 1,
                total: null,
            }
        }
    }

    async componentDidMount () {
        await this.initData();
        await this.fetchDataList();
    }

    onReset = () => {
        this.formIndexesRef.current.resetFields();
    }

    onPageChange = (pageNo, pageSize, flag) => {
        if (flag == 'qualifier') {
            const { qualifier } = this.state;
            this.setState({
                qualifier: {
                    ...qualifier,
                    pageNo: pageNo,
                    pageSize: pageSize
                }
            }, () => {
                this.handleSearch();
            });
            return
        }
        this.setState({
            pageNo: pageNo,
            pageSize: pageSize
        }, () => {
            this.formIndexesRef.current.submit();
        });
    }

    //初始化，获取treeData主题域 和 标签列表
    initData = async () => {
        this.setState({ isLoading: true });
        try {
            const resData = await Promise.all([
                queryIndexesTree({ type: 1 }),
                queryIndexesTagList()
            ]);
            let treeData = resData[0].data || [];
            treeData.unshift({ id: 'all', name: '全部' });
            this.setState({
                treeData,
                IndexTagList: resData[1].data || [],
                selectTreeKeys: resData[0].data.length ? [resData[0].data[0].id] : [],
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
        let params = this.formIndexesRef.current.getFieldsValue();
        //去除‘全部’的id
        let arr = ['type'], tempObj = { ...params };
        arr.forEach(key => {
            if (tempObj[key] == 'all') delete tempObj[key];
        })
        let commitParams = Object.assign({
            size: this.state.pageSize,
            page: this.state.pageNo - 1,
            indexDomainId: this.state.selectTreeKeys.length && this.state.selectTreeKeys[0] != 'all' ? this.state.selectTreeKeys[0] : ''
        }, tempObj);
        this.setState({
            isLoading: true,
            dataList: [],
        }, () => {
            queryIndexesList(commitParams).then(res => {
                let dataList = res.data.items || [];
                dataList.forEach((item, index) => {
                    if (item.type) {
                        item.type = optionFilterProp(this.state.IndexTypeList, 'value', item.type)?.label || '';
                    }
                    if (item.subjectList) {
                        item.subjectList = item.subjectList.map(itm => itm.name).join(' — ');
                    }
                    if (item.tagInfoList) {
                        item.tagInfoList = item.tagInfoList.map(itm => itm.name).join('，');
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
    handleDetail = async (record) => {
        this.setState({ detailInfoVisible: true, detailInfoLoading: true, detailInfo: {} })
        try {
            let resDetail = await queryIndexDetail({ id: record.id });
            this.setState({
                detailInfo: {
                    ...resDetail.data,
                    type: optionFilterProp(this.state.IndexTypeList, 'value', resDetail.data.type)?.label || '',
                    subjectList: resDetail.data.subjectList && resDetail.data.subjectList.length ? resDetail.data.subjectList.map(i => i.name).join(' — ') : '',
                    isCoreIndex: resDetail.data.isCoreIndex ? '是' : '否',
                    dimensionList: resDetail.data.dimensionList && resDetail.data.dimensionList.length ? resDetail.data.dimensionList.map(k => k.name).join('，') : '',
                    tagInfoList: resDetail.data.tagInfoList && resDetail.data.tagInfoList.length ? resDetail.data.tagInfoList.map(j => j.name).join('，') : '',
                    createAt: moment(resDetail.data?.lastModifyAt).format('YYYY-MM-DD HH:mm:ss'),
                    lastModifyAt: moment(resDetail.data?.lastModifyAt).format('YYYY-MM-DD HH:mm:ss'),
                    indexAlias: resDetail.data.indexAlias && resDetail.data.indexAlias.length ? resDetail.data.indexAlias.join('，') : ''
                },
                detailInfoLoading: false
            })
        } catch (errInfo) {
            errInfo.msg && message.error(errInfo.msg);
            this.setState({
                detailInfoLoading: false
            })
        }
    }

    handleQualifier = async (record) => {
        const { qualifier } = this.state;
        this.setState({ qualifier: { ...qualifier, visible: true, info: {}, isLoading: true } })
        try {
            let resDetail = await queryIndexDecorationTypesInfo({ id: record.id });
            this.setState({
                qualifier: {
                    ...qualifier,
                    visible: true,
                    info: {
                        name: record.name,
                        typesList: resDetail.data || [],
                        selectTreeKeys: resDetail.data?.length ? [resDetail.data[0].id] : [],
                    }
                }
            })
            if (resDetail.data && resDetail.data.length) this.handleSearch()
        } catch (errInfo) {
            errInfo.msg && message.error(errInfo.msg);
            this.setState({
                qualifier: {
                    ...qualifier,
                    isLoading: false
                }
            })
        }
    }

    handleSearch = () => {
        const { qualifier } = this.state;
        const keyWords = this.formQualifierRef.current.getFieldsValue();
        if (!qualifier.info?.selectTreeKeys.length) return;
        let params = {
            id: qualifier.info?.selectTreeKeys[0],
            name: keyWords.name,
            size: qualifier.pageSize,
            page: qualifier.pageNo - 1,
        }
        this.setState({ qualifier: { ...qualifier, dataList: [], isLoading: true } })
        queryIndexDecorationsInfo(params).then(res => {
            let dataList = res.data.items || [];
            dataList.forEach((item, index) => {
                item.tableIndex = (qualifier.pageNo - 1) * qualifier.pageSize + index + 1;
            })
            this.setState({
                qualifier: {
                    ...qualifier,
                    info: {
                        ...qualifier.info,
                        dataList
                    },
                    total: res.data?.total,
                    isLoading: false
                }
            }, () => {
                console.log(343434, qualifier.columns)
            })
        }).catch(err => {
            err.msg && message.error(err.msg);
            this.setState({
                qualifier: {
                    ...qualifier,
                    isLoading: false
                }
            })
        })
    }

    closequalifier = () => {
        const { qualifier } = this.state;
        this.formQualifierRef.current.resetFields();
        this.setState({
            qualifier: {
                ...qualifier,
                visible: false,
                info: {}
            }
        })
    }

    handleQualifierTree = (selectTreeKeys) => {
        const { qualifier } = this.state;
        this.setState({
            qualifier: {
                ...qualifier,
                info: {
                    ...qualifier.info,
                    selectTreeKeys
                },
                pageSize: 10,
                pageNo: 1,
            }
        }, async () => {
            await this.handleSearch();
        })
    }

    render () {
        const { isLoading, IndexTypeList, IndexTagList, detailInfoVisible, detailInfo, qualifier } = this.state;
        return <Spin spinning={isLoading}>
            <div className="oap-container">
                <Row className="oap-row oap-sql-row">
                    <Col className="oap-analysis-col-flex" style={{ marginRight: '16px', width: '182px' }}>
                        <div className="oap-card padnone" style={{ padding: '6px 0 6px 10px', border: 'none' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>指标</h4>
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
                            ref={this.formIndexesRef}
                            layout="vertical"
                            size="middle"
                            initialValues={{
                                type: 'all'
                            }}
                            onFinish={this.fetchDataList}>
                            <div className="search-area">
                                <Row gutter={32}>
                                    <Col span={3}>
                                        <Form.Item name="name" label="关键词">
                                            <Input placeholder="查询指标名称或标识" allowClear />
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item name="type" label='指标类型'>
                                            <Select placeholder='请选择' allowClear>
                                                {IndexTypeList.map(model => {
                                                    return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
                                                })}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item name="tagIdList" label='所属标签'>
                                            <Select mode="multiple" placeholder='请选择' allowClear>
                                                {IndexTagList.map(model => {
                                                    return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
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
                                tableKey="oapIndexes"
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
                centered
                title={`${detailInfo.name}指标`}
                visible={detailInfoVisible}
                footer={[
                    <Button type="primary" key="close" onClick={() => this.setState({ detailInfoVisible: false, detailInfo: {} })}>关闭</Button>
                ]}
                onCancel={() => this.setState({ detailInfoVisible: false, detailInfo: {} })}
                bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <Spin spinning={this.state.detailInfoLoading}>
                    <div className="oap-descriptions">
                        <BlockTitle fontSize="14px" text="基本信息" />
                        <div className="item-container">
                            <div className="item-label">指标类型</div>
                            <div className="item-content">{detailInfo.type}</div>
                        </div>
                        <div className="item-container-flex">
                            <div className="item-container">
                                <div className="item-label">指标名称</div>
                                <div className="item-content">{detailInfo.name}</div>
                            </div>
                            <div className="item-container">
                                <div className="item-label">英文标识</div>
                                <div className="item-content">{detailInfo.identifier}</div>
                            </div>
                        </div>
                        <div className="item-container">
                            <div className="item-label">指标域</div>
                            <div className="item-content">{detailInfo.subjectList}</div>
                        </div>
                        <div className="item-container">
                            <div className="item-label">指标别名</div>
                            <div className="item-content">{detailInfo.indexAlias}</div>
                        </div>
                        <div className="item-container">
                            <div className="item-label">是否核心指标</div>
                            <div className="item-content">{detailInfo.isCoreIndex}</div>
                        </div>
                        <div className="item-container">
                            <div className="item-label">可分析维度</div>
                            <div className="item-content">{detailInfo.dimensionList}</div>
                        </div>
                        <div className="item-container">
                            <div className="item-label">指标标签</div>
                            <div className="item-content">{detailInfo.tagInfoList}</div>
                        </div>
                        <div className="item-container-flex">
                            <div className="item-container">
                                <div className="item-label">上线日期</div>
                                <div className="item-content">{detailInfo.createAt}</div>
                            </div>
                            <div className="item-container">
                                <div className="item-label">更新日期</div>
                                <div className="item-content">{detailInfo.lastModifyAt}</div>
                            </div>
                        </div>
                    </div>
                    <div className="oap-descriptions">
                        <BlockTitle top="32px" fontSize="14px" text="口径定义" />
                        <div className="item-container">
                            <div className="item-label">业务口径</div>
                            <div className="item-content">{detailInfo.bizCaliber}</div>
                        </div>
                        <div className="item-container">
                            <div className="item-label">业务负责人</div>
                            <div className="item-content">{detailInfo.bizCaliberReporter}</div>
                        </div>
                        <div className="item-container">
                            <div className="item-label">技术口径</div>
                            <div className="item-content">{detailInfo.techCaliber}</div>
                        </div>
                        <div className="item-container">
                            <div className="item-label">技术负责人</div>
                            <div className="item-content">{detailInfo.techCaliberReporter}</div>
                        </div>
                    </div>
                </Spin>
            </Modal>
            <Modal
                width={800}
                centered
                title={`${qualifier.info.name}指标`}
                visible={qualifier.visible}
                footer={[
                    <Button type="primary" key="close" onClick={this.closequalifier}>关闭</Button>
                ]}
                onCancel={this.closequalifier}
                bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <Spin spinning={qualifier.isLoading}>
                    <Row gutter={18}>
                        <Col flex="182px" style={{ borderRight: '1px solid #ccc' }}>
                            <div className="oap-card padnone" style={{ padding: '0 0 6px 10px', border: 'none' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>修饰词类型</h4>
                                <Tree
                                    treeData={qualifier.info.typesList}
                                    fieldNames={{
                                        title: 'typeName',
                                        key: 'id',
                                        children: 'sonSubjectList'
                                    }}
                                    blockNode
                                    selectedKeys={qualifier.info.selectTreeKeys}
                                    className='oap-tree'
                                    onSelect={this.handleQualifierTree} />
                            </div>
                        </Col>
                        <Col flex="1">
                            <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>修饰词</h4>
                            <Form
                                className="search-form"
                                ref={this.formQualifierRef}
                                layout="vertical"
                                onFinish={this.handleSearch}>
                                <Row gutter={18}>
                                    <Col flex="200px">
                                        <Form.Item name="name">
                                            <Input placeholder="查询修饰词名称" allowClear />
                                        </Form.Item>
                                    </Col>
                                    <Col flex="120px">
                                        <Button type="primary" htmlType="submit" loading={qualifier.isLoading} onClick={() => this.setState((state) => ({ qualifier: { ...state.qualifier, pageNo: 1 } }))}>查询</Button>
                                    </Col>
                                </Row>
                            </Form>
                            <div className="table-top-wrap" style={{ flex: 1 }}>
                                <Table
                                    rowKey="id"
                                    columns={qualifier.columns}
                                    dataSource={qualifier.info.dataList}
                                    pagination={{
                                        showQuickJumper: true,
                                        showSizeChanger: true,
                                        pageSize: qualifier.pageSize,
                                        current: qualifier.pageNo,
                                        total: qualifier.total,
                                        onChange: (pageNo, pageSize) => this.onPageChange(pageNo, pageSize, 'qualifier')
                                    }} />
                            </div>
                        </Col>
                    </Row>
                </Spin>
            </Modal>
        </Spin>
    }
}