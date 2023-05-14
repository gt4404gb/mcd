import React from 'react';
import { Spin, Form, Row, Col, Button, Select, Input, Table, Tooltip, Space, Popconfirm, message } from '@aurum/pfe-ui';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { getScheduleList, deleteSchedule, refreshSchedule } from '@/api/oap/schedule.js';
import moment from 'moment';
import { TASK_TYPE_LIST, RUNNING_STATUS_LIST, SCHEDULE_STATUS_LIST } from '@/constants';
import { optionFilterProp } from "@/utils/store/func";

class List extends React.Component {
    constructor(props) {
        super(props);
        this.formScheduleRef = React.createRef();
        this.state = {
            isLoading: false,
            checkedValue: ['tableIndex', 'taskName', 'taskTypeName', 'latestTaskDetailStatusName', 'createName', 'createAt', 'lastModifyAt', 'taskStatusName', 'operation'],
            columns: [
                { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
                {
                    title: "任务名称",
                    dataIndex: 'taskName',
                    fixed: 'left',
                    width: 280,
                    align: 'left',
                    ellipsis: true,
                    render: (text, record) => (
                        <Tooltip placement="topLeft" title={record.taskName} key={record.id}>
                            <a onClick={() => this.linkToDetail(record)}>{record.taskName}</a>
                        </Tooltip>
                    )
                },
                { title: "任务类型", dataIndex: 'taskTypeName', ellipsis: true, width: 160 },
                { title: "最新任务状态", dataIndex: 'latestTaskDetailStatusName', ellipsis: true, width: 120 },
                { title: "创建人", dataIndex: 'createName', ellipsis: true, width: 120 },
                { title: "创建时间", dataIndex: 'createAt', ellipsis: true, width: 160 },
                { title: "更新时间", dataIndex: 'lastModifyAt', ellipsis: true, width: 160 },
                { title: "运行状态", dataIndex: 'taskStatusName', ellipsis: true, width: 100 },
                {
                    title: '操作',
                    dataIndex: 'operation',
                    fixed: 'right',
                    width: 160,
                    render: (text, record) => {
                        return <Space size="middle" key={record.id}>
                            {checkMyPermission('oap:dispatch:update') && <a onClick={() => this.linkToForm(record)}>编辑</a>}
                            {(checkMyPermission('oap:dispatch:refresh') && record.taskStatus == RUNNING_STATUS_LIST[0].value) && <Popconfirm
                                title={<>
                                    <span>是否刷新分析调度任务？</span><br />
                                    <span>刷新后，任务将重新计算</span>
                                </>}
                                okText="确定"
                                cancelText="取消"
                                onConfirm={() => this.confirmRefresh(record.id)}>
                                <a href="#">刷新</a>
                            </Popconfirm>}
                            {checkMyPermission('oap:dispatch:delete') && <Popconfirm
                                title="确认要删除吗？"
                                okText="确定"
                                cancelText="取消"
                                onConfirm={() => this.confirmDelete([record.id])}>
                                <a href="#">删除</a>
                            </Popconfirm>}
                        </Space>
                    }
                }
            ],
            dataList: [],
            pageSize: 20,
            pageNo: 1,
            total: null,
            selectedRowKeys: [],
            rowSelectList: {
                type: 'checkbox',
                onChange: this.onSelectChange,
            },
            taskTypeList: [
                { value: 'all', label: '全部' },
                TASK_TYPE_LIST[0],
                TASK_TYPE_LIST[1]
            ],
            taskStatusList: [
                { value: 'all', label: '全部' },
                ...RUNNING_STATUS_LIST
            ],
            latestTaskDetailStatusList: [
                { value: 'all', label: '全部' },
                ...SCHEDULE_STATUS_LIST
            ],
            formData: {
                taskType: 'all',
                taskStatus: 'all',
                latestTaskDetailStatus: 'all'
            }
        }
    }

    onSelectChange = selectedRowKeys => {
        this.setState({ selectedRowKeys });
    }

    async componentDidMount () {
        await this.fetchDataList();
    }

    //获取查询列表
    fetchDataList = () => {
        let params = this.formScheduleRef.current.getFieldsValue();
        //去除‘全部’的id
        let arr = ['taskType', 'taskStatus', 'latestTaskDetailStatus'], tempObj = { ...params };
        arr.forEach(key => {
            if (tempObj[key] == 'all') delete tempObj[key];
        })
        let commitParams = Object.assign({
            size: this.state.pageSize,
            page: this.state.pageNo - 1,
        }, tempObj);
        this.setState({
            isLoading: true,
            dataList: [],
        }, () => {
            getScheduleList(commitParams).then(res => {
                let dataList = res.data.items || [];
                dataList.forEach((item, index) => {
                    item.tableIndex = (this.state.pageNo - 1) * this.state.pageSize + index + 1;
                    if (item.taskType) {
                        item.taskTypeName = optionFilterProp(TASK_TYPE_LIST, 'value', item.taskType)?.label || '';
                    }
                    if (item.latestTaskDetailStatus) {
                        item.latestTaskDetailStatusName = optionFilterProp(SCHEDULE_STATUS_LIST, 'value', item.latestTaskDetailStatus)?.label || '';
                    }
                    if (item.taskStatus) {
                        item.taskStatusName = optionFilterProp(RUNNING_STATUS_LIST, 'value', item.taskStatus)?.label || '';
                    }
                    if (item.createAt) {
                        item.createAt = moment(item.createAt).format('YYYY-MM-DD HH:mm:ss');
                    }
                    if (item.lastModifyAt) {
                        item.lastModifyAt = moment(item.lastModifyAt).format('YYYY-MM-DD HH:mm:ss');
                    }
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

    confirmRefresh = (id) => {
        refreshSchedule({ id }).then(res => {
            res.msg == 'success' && message.success('刷新成功');
            this.fetchDataList();
        }).catch((err) => {
            message.error(err.msg);
        })
    }

    confirmCancel = (id) => {
        handleCancelCkAnalysisTask(id).then(res => {
            res.msg == 'success' && message.success('取消成功');
            this.fetchDataList();
        }).catch((err) => {
            message.error(err.msg);
        })
    }

    // 批量删除
    confirmDelete = (list) => {
        if (list.length > 0) {
            deleteSchedule(list).then(res => {
                res.msg == 'success' && message.success('删除成功');
                this.fetchDataList();
            })
        } else {
            message.warning('请勾选需要删除的选项！')
        }
    }

    //重置查询条件
    onReset = () => {
        this.formScheduleRef.current.resetFields();
    }

    onPageChange = (pageNo, pageSize) => {
        this.setState({
            pageNo: pageNo,
            pageSize: pageSize
        }, () => {
            this.formScheduleRef.current.submit();
        });
    }

    linkToDetail = (record) => {
        this.props.onCreate('show', record)
    }

    linkToForm = (record) => {
        this.props.onCreate('edit', record)
    }

    render () {
        const { isLoading, formData, taskTypeList, taskStatusList, latestTaskDetailStatusList, columns, dataList, rowSelectList } = this.state;
        return <Spin spinning={isLoading}>
            <div className="table-container">
                <Form
                    className="search-form"
                    ref={this.formScheduleRef}
                    layout="vertical"
                    size="middle"
                    initialValues={formData}
                    onFinish={this.fetchDataList}>
                    <div className="search-area">
                        <Row gutter={32}>
                            <Col span={3}>
                                <Form.Item name="taskName" label="名称">
                                    <Input placeholder="查询任务名称" allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={3}>
                                <Form.Item name="taskType" label="任务类型">
                                    <Select placeholder="全部" allowClear options={taskTypeList}></Select>
                                </Form.Item>
                            </Col>
                            <Col span={3}>
                                <Form.Item name="latestTaskDetailStatus" label="最新任务状态">
                                    <Select placeholder="全部" allowClear options={latestTaskDetailStatusList}></Select>
                                </Form.Item>
                            </Col>
                            <Col span={3}>
                                <Form.Item name="taskStatus" label="运行状态">
                                    <Select placeholder="全部" allowClear options={taskStatusList}></Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <Space>
                                    <Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询/刷新</Button>
                                    <Button onClick={this.onReset}>重置</Button>
                                    {checkMyPermission('oap:dispatch:delete') && <Popconfirm
                                        placement="top"
                                        title={<>
                                            <span>是否批量删除所选内容？</span><br />
                                            <span>删除后不可恢复</span>
                                        </>}
                                        okText="确定"
                                        cancelText="取消"
                                        onConfirm={() => this.confirmDelete([...this.state.selectedRowKeys])}>
                                        <Button>批量删除</Button>
                                    </Popconfirm>}
                                </Space>
                            </Col>
                        </Row>
                    </div>
                </Form>
                <div style={{ height: '12px', background: '#f6f6f6', position: 'relative' }}></div>
                <div className="table-top-wrap">
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={dataList}
                        allFilterColumns={this.state.checkedValue}
                        tableKey="oapSchedule"
                        rowSelection={rowSelectList}
                        footer={() => '注意：为避免资源占用，每个人的调度任务上限为3条'}
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

export default List;