import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Spin, Form, Row, Col, Button, Input, Table, Tooltip, message, Select, Space } from '@aurum/pfe-ui';
import moment from 'moment';
import { queryApplyAuthList } from '@/api/oap/apply_auth';
import { APPLICANT_TYPE_LIST, APPLY_STATUS_LIST, APPLY_TYPE_List, APPLY_STATUS, APPLICANT_TYPE } from '@/constants';
import { optionFilterProp } from "@/utils/store/func";
import querystring from "query-string";
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';

const applyAuthList = forwardRef((props, ref) => {
    const userInfo = JSON.parse(localStorage.getItem("USER_INFO"))
    const [editAbleArr, setEditAble] = useState([APPLY_STATUS.stateless, APPLY_STATUS.back, APPLY_STATUS.withdrawn]);
    const tableCol = [
        { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80, },
        {
            title: "流程编号",
            dataIndex: 'id',
            fixed: 'left',
            width: 160,
            align: 'left',
            ellipsis: true,
            render: (text, record) => (
                <Tooltip placement="topLeft" title={record.id} key={record.id}>
                    <a>{record.id}</a>
                </Tooltip>
            )
        },
        { title: "名称", dataIndex: 'applyName', ellipsis: true, width: 160, align: 'left' },
        { title: "申请类型", dataIndex: "applyTypeName", ellipsis: true, width: 120 },
        { title: "申请人类型", dataIndex: 'applyEmployeeTypeName', ellipsis: true, width: 120, align: 'left' },
        { title: "状态", dataIndex: 'applyStatusName', ellipsis: true, width: 120, align: 'left' },
        { title: "创建时间", dataIndex: 'createAt', ellipsis: true, width: 160, align: 'left' },
        { title: "更新时间", dataIndex: 'lastModifyAt', ellipsis: true, width: 160, align: 'left' },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 100,
            render: (text, record) => {
                if (!checkMyPermission('oap:apply:save')) return '';
                // 如果是管理员查看别人报告则置灰 禁止点击
                if (record.applyEmployeeNumber === userInfo.employeeNumber) {
                    if (editAbleArr.includes(record.applyStatus)) {
                        return <a key={record.id} style={{ fontSize: '12px' }} onClick={() => linkToApplyForm(record)}>申请</a>
                    }
                    return <a key={record.id} style={{ fontSize: '12px' }} onClick={() => linkToApplyForm(record)}>查看</a>
                } else {
                    return <span key={record.id} style={{ color: '#f6f6f6' }}> 查看 </span>
                }

            }
        }
    ]
    const [isLoading, setLoading] = useState(false);
    const [checkedValue, setCheckedValue] = useState(['tableIndex', 'id', 'applyName', 'applyTypeName', 'applyEmployeeTypeName', 'applyStatusName', 'createAt', 'lastModifyAt', 'operation']);
    const [columns, setColumns] = useState(tableCol);
    const [dataList, setDataList] = useState([]);
    const [tablePagenation, setTablePagenation] = useState({
        pageSize: 20,
        pageNo: 1,
        total: null,
    })

    const formApplyAuthRef = useRef();

    const onReset = () => {
        formApplyAuthRef.current.resetFields();
    }

    const onPageChange = (pageNo, pageSize) => {
        setTablePagenation((preState) => ({
            ...preState,
            pageNo: pageNo,
            pageSize: pageSize,
        }))
        formApplyAuthRef.current.submit();
    }

    const fetchDataList = () => {
        let params = formApplyAuthRef.current.getFieldsValue();
        //去除‘全部’的id
        let arr = ['applyType', 'applyEmployeeType', 'applyStatus'], tempObj = { ...params };
        arr.forEach(key => {
            if (tempObj[key] == 'all') delete tempObj[key];
        })
        let commitParams = Object.assign({
            size: tablePagenation.pageSize,
            page: tablePagenation.pageNo - 1
        }, tempObj);
        setLoading(true);
        setDataList([]);
        queryApplyAuthList(commitParams).then(res => {
            let dataList = res.data.items || [];
            dataList.forEach((item, index) => {
                if (item.applyType) {
                    item.applyTypeName = optionFilterProp(APPLY_TYPE_List, 'value', item.applyType)?.label || '';
                }
                if (item.applyEmployeeType) {
                    item.applyEmployeeTypeName = optionFilterProp(APPLICANT_TYPE_LIST, 'value', item.applyEmployeeType)?.label || '';
                }
                if ((item?.applyStatus ?? '') !== '') {
                    if (item.applyStatus == 9 && (item?.requestId ?? '') === '') {
                        item.applyStatusName = optionFilterProp(APPLY_STATUS_LIST, 'value', 10)?.label || '';
                    } else {
                        item.applyStatusName = optionFilterProp(APPLY_STATUS_LIST, 'value', item.applyStatus)?.label || '';
                    }
                }
                if (item.createAt) {
                    item.createAt = moment(item.createAt).format('YYYY-MM-DD HH:mm:ss');
                }
                if (item.lastModifyAt) {
                    item.lastModifyAt = moment(item.lastModifyAt).format('YYYY-MM-DD HH:mm:ss');
                }
                item.tableIndex = (tablePagenation.pageNo - 1) * tablePagenation.pageSize + index + 1;
            })
            setDataList([...dataList]);
            setTablePagenation({
                ...tablePagenation,
                total: res.data?.total
            })
        }).catch((err) => {
            err.msg && message.error(err.msg);
        }).finally(() => {
            setLoading(false);
        })
    }

    const linkToApplyForm = (record) => {
        if (!checkMyPermission('oap:apply:save')) return '';
        let fromPage;
        if (record.applyType) {
            fromPage = optionFilterProp(APPLY_TYPE_List, 'value', record.applyType)?.key || '';
        }
        if (fromPage == 'data') {
            if (record.applyEmployeeType == APPLICANT_TYPE.self) {
                props.history.push({
                    pathname: '/oap/sheet-directory/form',
                    search: querystring.stringify({ tableId: record.applyInfo[0].id, adid: record.applyAdid })
                });
            } else {
                props.history.push({
                    pathname: '/oap/index/apply/form',
                    search: querystring.stringify({ id: record?.id, from: fromPage })
                });
            }
        }
        if (fromPage == 'analysis') {
            props.history.push({
                pathname: '/oap/index/apply/form',
                search: querystring.stringify({ id: record?.id, from: fromPage })
            });
        }
        console.log(record, fromPage);
        if (['reportBoard', 'businessTime'].includes(fromPage)) {
            if ((record.applyReason ?? '') === '') {
                props.history.push({
                    pathname: `/oap/registration-approval-process?id=${record.id}&type=approver`,
                });
            } else {
                if (record.applyEmployeeType === 1) {
                    props.history.push({
                        pathname: `/oap/apply-business-time?mainId=${record.id}`,
                    });
                } else if (record.applyEmployeeType === 2) {
                    props.history.push({
                        pathname: `/oap/supplier-application?id=${record.id}`,
                    });
                }
            }
        }

        if (fromPage == 'database') {
            console.log(record.applyEmployeeType, APPLICANT_TYPE.self)
            props.history.push({
                pathname: '/oap/database/apply-form',
                search: querystring.stringify({ id: record?.id })
            });
        }
        if (fromPage == 'demandCommit') {
            console.log(record.applyEmployeeType, APPLICANT_TYPE.self)
            props.history.push({
                pathname: '/oap/demand/apply-form',
                search: querystring.stringify({ id: record?.id })
            });
        }
    }

    useEffect(() => {
        let record = JSON.parse(decodeURIComponent(sessionStorage.getItem('setDefaultApplyType'))) || {};
        if (record.applyType) {
            let formData = formApplyAuthRef.current.getFieldsValue();
            formData.applyType = record.applyType;
            formApplyAuthRef.current.setFieldsValue(formData);
        }
        fetchDataList();
    }, []);

    return <Spin spinning={isLoading}>
        <div className="table-container">
            <Form
                className="search-form"
                ref={formApplyAuthRef}
                layout="vertical"
                size="middle"
                initialValues={{
                    applyType: 'all',
                    applyEmployeeType: 'all',
                    applyStatus: 'all'
                }}
                onFinish={fetchDataList}>
                <div className="search-area">
                    <Row gutter={32}>
                        <Col span={3}>
                            <Form.Item name="keyword" label="关键词">
                                <Input
                                    placeholder="搜索编号或名称关键字"
                                    allowClear />
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Form.Item name="applyType" label="申请类型">
                                <Select
                                    placeholder='请选择'
                                    allowClear
                                    options={APPLY_TYPE_List}></Select>
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Form.Item name="applyEmployeeType" label="申请人类型">
                                <Select
                                    placeholder='请选择'
                                    allowClear
                                    options={APPLICANT_TYPE_LIST}></Select>
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Form.Item name="applyStatus" label="状态">
                                <Select
                                    placeholder='请选择'
                                    allowClear
                                    options={APPLY_STATUS_LIST}></Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={12}>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { setTablePagenation({ ...tablePagenation, pageNo: 1 }); }}>查询</Button>
                                <Button onClick={onReset}>重置</Button>
                            </Space>
                        </Col>
                    </Row>
                </div>
            </Form>
            <div className="table-top-wrap">
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={dataList}
                    allFilterColumns={checkedValue}
                    tableKey="oapApplyAuth"
                    pagination={{
                        showQuickJumper: true,
                        showSizeChanger: true,
                        pageSize: tablePagenation.pageSize,
                        current: tablePagenation.pageNo,
                        total: tablePagenation.total,
                        onChange: (pageNo, pageSize) => onPageChange(pageNo, pageSize)
                    }}
                    scroll={{ x: '100%' }} />
            </div>
        </div>
    </Spin>
})

export default applyAuthList;