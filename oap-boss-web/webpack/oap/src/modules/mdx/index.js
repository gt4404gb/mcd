import React from 'react';
import { Spin, Form, Row, Col, Button, Input, Table, message, Select, Space } from '@aurum/pfe-ui';
import { queryGuideCategoryList } from '@/api/oap/guide_analysis.js';
import { downloadFile } from '@/api/oap/commonApi.js';
import { getMDXList } from '@/api/oap/mdx_analysis.js';
import moment from 'moment';
import { saveAs } from 'file-saver';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
export default class MDX extends React.Component {
    constructor(props) {
        super(props);
        this.formMDXRef = React.createRef();
        this.state = {
            isLoading: false,
            modelList: [],
            checkedValue: ['tableIndex', 'businessName', 'businessCategoryName', 'fileName', 'lastModifyAt', 'operation'],
            defcolumns: [],
            columns: [
                { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
                { title: "分析名称", dataIndex: 'businessName', ellipsis: true, fixed: 'left', width: 280 },
                { title: "业务域", dataIndex: 'businessCategoryName', ellipsis: true, width: 160 },
                { title: "文件名称", dataIndex: 'fileName', ellipsis: true, width: 200 },
                { title: "更新时间", dataIndex: 'lastModifyAt', ellipsis: true, width: 130 },
                {
                    title: '操作',
                    dataIndex: 'operation',
                    fixed: 'right',
                    width: 100,
                    render: (text, record) => checkMyPermission('oap:index:files') ? (
                        <a key={record.id} onClick={() => this.downLoadAnyFiles(record)}>下载</a>
                    ) : null
                }
            ],
            dataList: [],
            pageSize: 10,
            pageNo: 1,
            total: null,
        }
    }

    async componentDidMount () {
        await this.initData();
        await this.fetchDataList();
    }

    onReset = () => {
        this.formMDXRef.current.resetFields();
    }

    onPageChange = (pageNo, pageSize) => {
        this.setState({
            pageNo: pageNo,
            pageSize: pageSize
        }, () => {
            this.formMDXRef.current.submit();
        });
    }

    //初始化
    initData = async () => {
        this.setState({ isLoading: true });
        try {
            const resData = await queryGuideCategoryList();
            this.setState({
                modelList: resData.data ? resData.data.map(itm => {
                    return { name: itm.name, id: itm.id }
                }) : []
            })
        } catch (errInfo) {
            errInfo.msg && message.error(errInfo.msg);
            this.setState({
                isLoading: false
            })
        }
    }

    //获取查询列表
    fetchDataList = () => {
        let params = this.formMDXRef.current.getFieldsValue();
        let commitParams = Object.assign({
            size: this.state.pageSize,
            page: this.state.pageNo - 1,
        }, params);
        this.setState({
            isLoading: true,
            dataList: [],
        }, () => {
            getMDXList(commitParams).then(res => {
                let dataList = res.data.items || [];
                dataList.forEach((item, index) => {
                    if (item.lastModifyAt) {
                        item.lastModifyAt = moment(item?.lastModifyAt).format('YYYY-MM-DD HH:mm:ss');
                    }
                    if (item.fileInfo) {
                        item.fileName = item.fileInfo.fileName;
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

    // 下载
    downLoadAnyFiles = (record) => {
        if (record.mdxFileId) {
            downloadFile(record.mdxFileId).then(res => {
                const blob = new Blob([res.data.fileBlob], { type: 'application/octet-stream' })
                let downName = res.data.fileName.replace(/"/g, '');
                saveAs(blob, downName);
                message.success("文件下载成功！")
                this.setState({
                    isLoading: false
                })
            })
        } else {
            message.warning("文件名不存在！")
        }
    }

    render () {
        const { isLoading, modelList } = this.state;
        return <Spin spinning={isLoading}>
            <div className="table-container">
                <Form
                    className="search-form"
                    ref={this.formMDXRef}
                    layout="vertical"
                    size="middle"
                    onFinish={this.fetchDataList}>
                    <div className="search-area">
                        <Row gutter={32}>
                            <Col span={3}>
                                <Form.Item name="guideCategoryId" label="业务域名称">
                                    <Select placeholder="全部" allowClear>
                                        {modelList.map(model => {
                                            return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
                                        })}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={3}>
                                <Form.Item name="name" label="关键词">
                                    <Input
                                        placeholder="查询分析名称"
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
                <div className="table-top-wrap">
                    <Table
                        rowKey="id"
                        columns={this.state.columns}
                        dataSource={this.state.dataList}
                        allFilterColumns={this.state.checkedValue}
                        tableKey="oapMDX"
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
            </div>
        </Spin>
    }
}