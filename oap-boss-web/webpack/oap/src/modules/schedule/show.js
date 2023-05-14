import React from 'react';
import { Spin, Descriptions, Divider, message, Table, Button, Modal, Form, Input } from '@aurum/pfe-ui';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { getScheduleDetail, getScheduleDetailList, downloadSchedule } from '@/api/oap/schedule.js';
import moment from 'moment';
import { optionFilterProp } from "@/utils/store/func";
import { TASK_TYPE_LIST, PERIOD_TYPE_LIST, PERIOD_WEEK_LIST, PERIOD_MONTH_LIST, PERIOD_DATE_LIST, SCHEDULE_STATUS_LIST } from '@/constants';
import { decode } from 'js-base64';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ExploreEmailModal from '@/components/ExploreEmailModal';
import { judgeIsStaff } from '@/utils/store/func';

export default class Show extends React.Component {
    constructor(props) {
        super(props);
        this.formScheduleRef = React.createRef();
        this.state = {
            isLoading: false,
            editId: null,
            detailInfo: {},
            columns: [
                { title: '序号', dataIndex: 'tableIndex', width: 80 },
                { title: '任务开始时间', dataIndex: 'startTime', width: 120 },
                { title: '任务结束时间', dataIndex: 'endTime', width: 120 },
                { title: '任务结果', dataIndex: 'taskDetailStatusName', width: 100 },
                {
                    title: '操作',
                    dataIndex: 'operation',
                    width: 80,
                    render: (text, record) => {
                        return (checkMyPermission('oap:dispatch:download') && record.taskDetailStatusName == 'Finish') ? <a key={record.id} onClick={() => this.handleDown(record.id)}>下载</a> : null
                    }
                },
            ],
            dataList: [],
            pageSize: 10,
            pageNo: 1,
            total: null,
            tableLoading: false,
            visibleSql: false,
            emailModalData: {
                isStaff: false,
                mcdEmail: '',
                visibleEmailInfo: false,
                isLoading: false,
            },
        }
    }

    async componentDidMount () {
        const { id } = this.props;
        if (id) {
            this.setState({
                editId: id
            });
            await this.initShow(id);
        }
        try {
            const res = await judgeIsStaff();
            this.setState(state => ({
                ...state,
                emailModalData: {
                    ...state.emailModalData,
                    isStaff: res.data ?? false,
                }
            }))
        } catch (error) {
            console.log('judgeIsStaff 400', error)
        }
    }

    initShow = async (id) => {
        const { pageNo, pageSize } = this.state;
        this.setState({ isLoading: true })
        try {
            const res = await Promise.all([
                getScheduleDetail({ id }),
                getScheduleDetailList({
                    taskId: id,
                    page: pageNo - 1,
                    size: pageSize
                })
            ]);
            let refreshType = '', refreshDayOfMonth = '', refreshDayOfWeek = '', refreshDate = '', refershC = '';
            if (res[0].data?.refreshControl) {
                let obj = res[0].data?.refreshControl;
                refreshType = optionFilterProp(PERIOD_TYPE_LIST, 'value', obj?.type)?.label || '';
                refreshDayOfMonth = optionFilterProp(PERIOD_MONTH_LIST, 'value', obj?.dayOfMonth)?.label || '';
                refreshDayOfWeek = optionFilterProp(PERIOD_WEEK_LIST, 'value', obj?.dayOfWeek)?.label || '';
                refreshDate = optionFilterProp(PERIOD_DATE_LIST, 'value', obj?.date)?.label || '';
                if (obj?.type == PERIOD_TYPE_LIST[1].value || obj?.type === PERIOD_TYPE_LIST[2].value) {
                    refershC = '-' + refreshDayOfWeek
                } else if (obj?.type == PERIOD_TYPE_LIST[3].value) {
                    refershC = '-' + refreshDayOfMonth
                }
            }
            let refreshControlName = `${refreshType}${refershC}-${refreshDate}`;
            this.setState({
                isLoading: false,
                detailInfo: {
                    ...res[0].data,
                    taskTypeName: optionFilterProp(TASK_TYPE_LIST, 'value', res[0].data?.taskType)?.label || '',
                    refreshControlName,
                    expiryDate: moment(res[0].data?.expiryDate).format('YYYY-MM-DD'),
                    sqlStr: res[0].data?.sqlStr ? decode(res[0].data?.sqlStr) : ''
                },
                dataList: res[1].data.items.length ? res[1].data.items.map((itm, idx) => {
                    return {
                        ...itm,
                        tableIndex: (pageNo - 1) * pageSize + idx + 1,
                        startTime: moment(itm.startTime).format('YYYY-MM-DD HH:mm:ss'),
                        endTime: (itm.endTime ?? '') != '' ? moment(itm.endTime).format('YYYY-MM-DD HH:mm:ss') : '',
                        taskDetailStatusName: optionFilterProp(SCHEDULE_STATUS_LIST, 'value', itm?.taskDetailStatus)?.label || ''
                    }
                }) : [],
                total: res[1].data?.total,
            })
        } catch (errInfo) {
            errInfo.msg && message.error(errInfo.msg);
            this.setState({ isLoading: false })
        }
    };

    onPageChange = (pageNo, pageSize) => {
        this.setState({
            pageNo: pageNo,
            pageSize: pageSize,
            dataList: []
        }, async () => {
            const res = await getScheduleDetailList({
                taskId: this.state.editId,
                page: pageNo - 1,
                size: pageSize
            })
            this.setState({
                isLoading: false,
                dataList: res.data.items.length ? res.data.items.map((itm, idx) => {
                    return {
                        ...itm,
                        tableIndex: (pageNo - 1) * pageSize + idx + 1,
                        startTime: moment(itm.startTime).format('YYYY-MM-DD HH:mm:ss'),
                        endTime: moment(itm.endTime).format('YYYY-MM-DD HH:mm:ss'),
                        taskDetailStatusName: optionFilterProp(SCHEDULE_STATUS_LIST, 'value', itm?.taskDetailStatus)?.label || ''
                    }
                }) : [],
                total: res.data?.total,
                tableLoading: false
            })
        });
    }

    handleDown = (id) => {
        this.setState((state) => ({
            ...state,
            emailModalData: {
                ...state.emailModalData,
                visibleEmailInfo: true,
                downLoadApi: downloadSchedule,
                downLoadParams: {
                    id,
                    taskType: state.detailInfo.taskType
                }
            }
        }))
    }

    handleExploreForDownloadData = (data) => {
        const { emailModalData } = this.state;
        console.log('handleExploreForDownloadData', data)
        if (data.operation === 'ok') {
            const res = data.downResponse;
            const url = window.URL.createObjectURL(new Blob([res.fileBlob], { type: 'application/octet-stream' }))
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            let downName = res.fileName.replace(/"|'/g, '');
            link.setAttribute('download', downName);
            document.body.appendChild(link)
            link.click();
            document.body.removeChild(link);
            this.setState({
                emailModalData: {
                    ...emailModalData,
                    visibleEmailInfo: false,
                    isLoading: false,
                }
            })
        } else if (data.operation === 'cancel') {
            this.setState({
                emailModalData: {
                    ...emailModalData,
                    visibleEmailInfo: false,
                    isLoading: false,
                }
            })
        }
    }

    handleExploreForDownloadData2 = (data) => {
        const { emailModalData, detailInfo } = this.state;
        if (data.operation === 'ok') {
            if (emailModalData.isStaff) {
                console.log('雇员取当前用户的邮箱，非雇员才取输入的邮箱')
            }
            this.setState({
                isLoading: true,
                emailModalData: {
                    ...emailModalData,
                    isLoading: true,
                }
            }, () => {
                const downObj = {
                    id: emailModalData.id,
                    email: data.emailStr ?? '',
                    taskType: detailInfo.taskType
                }

                downloadSchedule(downObj).then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data.fileBlob], { type: 'application/octet-stream' }))
                    const link = document.createElement('a');
                    link.style.display = 'none';
                    link.href = url;
                    let downName = res.data.fileName.replace(/"|'/g, '');
                    link.setAttribute('download', downName);
                    document.body.appendChild(link)
                    link.click();
                    document.body.removeChild(link);
                    this.setState({
                        isLoading: false,
                        emailModalData: {
                            ...emailModalData,
                            visibleEmailInfo: false,
                            isLoading: false,
                        }
                    })
                }).catch(err => {
                    message.error('下载失败');
                    this.setState({ isLoading: false })
                })
            })
        } else if (data.operation === 'cancel') {
            this.setState({
                emailModalData: {
                    ...emailModalData,
                    visibleEmailInfo: false,
                    isLoading: false,
                }
            })
        }
    }

    render () {
        const { isLoading, detailInfo, columns, dataList, pageSize, pageNo, total, tableLoading, visibleSql } = this.state;
        return <Spin spinning={isLoading}>
            <div style={{ padding: '0 16px' }}>
                <Divider orientation="left" style={{ borderColor: '#bbb' }}>任务信息</Divider>
                <Descriptions>
                    <Descriptions.Item label="任务名称">{detailInfo?.taskName}</Descriptions.Item>
                    <Descriptions.Item label="任务类型">{detailInfo?.taskTypeName}</Descriptions.Item>
                    {detailInfo?.taskType == TASK_TYPE_LIST[1].value && <Descriptions.Item label="任务名称">{detailInfo?.businessCategoryName}-{detailInfo?.sliceName}</Descriptions.Item>}
                    {detailInfo?.taskType == TASK_TYPE_LIST[0].value && <Descriptions.Item label="SQL代码">
                        <a onClick={() => this.setState({ visibleSql: true })}>查看代码</a>
                    </Descriptions.Item>}
                    <Descriptions.Item label="任务频率">{detailInfo?.refreshControlName}</Descriptions.Item>
                    <Descriptions.Item label="失效日期" span={2}>{detailInfo?.expiryDate}</Descriptions.Item>
                    <Descriptions.Item label="说明">{detailInfo?.instruction}</Descriptions.Item>
                </Descriptions>
                <Divider orientation="left" style={{ borderColor: '#bbb' }}>任务结果</Divider>
                <div className="table-container">
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={dataList}
                        loading={tableLoading}
                        pagination={{
                            showQuickJumper: true,
                            showSizeChanger: true,
                            pageSize: pageSize,
                            current: pageNo,
                            total: total,
                            onChange: (pageNo, pageSize) => this.onPageChange(pageNo, pageSize)
                        }}
                        scroll={{ x: '100%' }} />
                </div>
            </div>
            <Modal
                title="SQL"
                visible={visibleSql}
                className="basicInfo"
                zIndex={1030}
                onCancel={() => this.setState({ visibleSql: false })}
                footer={[
                    <CopyToClipboard key="copy" text={detailInfo.sqlStr} onCopy={() => this.setState({ visibleSql: false })}><Button type="primary">复制SQL</Button></CopyToClipboard>
                ]}>
                <div className="table-container">
                    <Form
                        layout="vertical"
                        size="middle"
                        initialValues={{
                            sqlStr: detailInfo.sqlStr
                        }}>
                        <Form.Item name="sqlStr">
                            <Input.TextArea rows={8} disabled />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
            <ExploreEmailModal onExplored={this.handleExploreForDownloadData} {...this.state.emailModalData} />
        </Spin>
    }

}