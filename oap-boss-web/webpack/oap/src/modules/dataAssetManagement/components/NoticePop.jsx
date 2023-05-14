import React, { useState, useEffect } from 'react';
import { Modal, Spin, Form, Row, Col, Input, Button, Table, Divider, Space, message } from '@aurum/pfe-ui';
import { IconCheckGreenCircleColorFill, IconDeleteRedCircleColorFill } from '@aurum/icons';
import { queryUserInfo } from '@/api/oap/commonApi';

const NoticePop = (props, refs) => {
    const [pageStatus, setPageStatus] = useState(0);
    const [curVisible, setCurVisible] = useState(props.isShow);
    const [curTitle, setCurTitle] = useState(props.title);
    const [curName, setCurName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isBatch, setIsBatch] = useState(props.isBatch);
    const [columnsByFa, setColumnsByFa] = useState(props.columnsForSon || []);
    const [dataListByFa, setDataListByFa] = useState(props.dataListForSon || []);
    const [disableOperate, setDisableOperate] = useState(false);
    const [isBusiness, setIsBusiness] = useState(true);
    const [needConfirm, setNeedConfirm] = useState(true);

    const [ownerForm] = Form.useForm();
    const columns = [
        {
            title: '账号',
            dataIndex: 'adid',
            width: 160
        },
        {
            title: 'eid',
            dataIndex: 'eid',
            width: 120
        },
        {
            title: '姓名',
            dataIndex: 'chineseName',
            width: 120
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            width: 200,
            align: 'left'
        },
    ];
    const [dataList, setDataList] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedEmpId, setSelectedEmpId] = useState('');
    const onSelectChange = (selectedRowKeys, selectedRow) => {
        setSelectedRowKeys(selectedRowKeys);
        selectedRow[0] && setSelectedEmpId(selectedRow[0].employeeNumber);
    }
    // table的配置项
    const rowSelection = {
        type: 'radio',
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record) => ({
            disabled: record.isDisabled,
        }),
    };
    const handleOk = () => {

    }
    const handleCancel = () => {
        setCurVisible(false);
        ownerForm.resetFields();
        setDataList([]);
        props.onHide();
    }

    const fetchEmployee = () => {
        let employee = ownerForm.getFieldValue('employee') || {};
        if (Object.keys(employee).length) {
            setLoading(true);
            queryUserInfo({ ...employee }).then(res => {
                if (res.data) {
                    setDataList([...res.data]);
                }
            }).catch(err => {
                message.error(err?.msg || err?.message || '网络异常，请稍后重试');
            }).finally(() => {
                setLoading(false);
            });
        } else {
            message.warning('请输入需要查询的员工编号')
        }
    }

    const resetSearch = () => {
        ownerForm.resetFields();
    }

    const informYouAgain = () => {
        if (selectedRowKeys.length > 0) {
            // let params = {
            //     id: [...props.idList],
            //     employeeNumber: selectedEmpId, // selectedRowKeys.join(''),
            // }
            let id = props.idList[0].againId;
            setLoading(true);
            props.informAgainChild(id).then(res => {
                console.log('res = ', res);
                setLoading(false)
                if (res == 'success') {
                    handleCancel();
                }
            }).catch((err) => {
                console.log('err = ', err);
                setLoading(false);
            })
        }
    }
    const informYou = () => {
        if (selectedRowKeys.length > 0) {
            let params = {
                id: [...props.idList],
                employeeNumber: selectedEmpId, // selectedRowKeys.join(''),
            }
            setLoading(true);
            props.informSomeoneByChild(params).then((res) => {
                console.log('res = ', res);
                setLoading(false)
                if (res == 'success') {
                    handleCancel();
                }
            }).catch((err) => {
                console.log('err = ', err);
                setLoading(false);
            })
        } else {
            return message.warning('请勾选员工选项')
        }
    }
    const emailRes = () => {
        let eleDom = null;
        switch (pageStatus) {
            case 1: eleDom = <span><IconCheckGreenCircleColorFill />用户已确认</span>; break;
            case 2: eleDom = <span><IconDeleteRedCircleColorFill />用户已拒绝</span>; break;
            case 3: eleDom = <span><IconDeleteRedCircleColorFill />用户未确认 <Button type='link' onClick={informYouAgain}>再次通知</Button></span>; break;
            default: eleDom = null; break;
        }
        return (<div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>确认进展</div>
            <div style={{ marginTop: 20 }}>{eleDom}</div>
        </div>)
    }
    useEffect(() => {
        console.log('props = ', props);
        setCurVisible(props.isShow);
        setCurTitle(props.title);
        setIsBatch(props.isBatch);
        setColumnsByFa(props.columnsForSon);
        setDataListByFa(props.dataListForSon);
        setIsBusiness(props.isBusiness);
        setNeedConfirm(props.needConfirm);

        if (!props.isBatch && props.idList.length > 0) {
            let item = props.idList[0];
            setCurName(item.name);
            if (item.status > 0 && item.applyInfo) {
                setDataList([{ ...item.applyInfo, isDisabled: !item.couldOperate }]);
                setSelectedRowKeys([item.applyInfo?.employeeNumber]);
                setSelectedEmpId(item.applyInfo?.employeeNumber);
            }
            setDisableOperate(item.couldOperate);
            setPageStatus(item.status);
        } else if (props.isBatch && props.idList.length > 0) {
            // if (props.idList.length == 1) {
            //     let item = props.idList[0];
            //     setDisableOperate(item.couldOperate);
            //     setPageStatus(item.status);
            // }
            setDisableOperate(true);
        }
    }, [props]);
    // onOk={handleOk} 
    // onCancel={handleCancel}
    return (<Modal
        title={props.title}
        modalType='normalType'
        open={curVisible}
        onCancel={handleCancel}
        footer={[]}
        width={700}>
        <Spin spinning={loading}>
            <div>
                <Form
                    form={ownerForm}
                    size="middle"
                    layout="vertical"
                    style={{ position: 'relative' }}
                >
                    <Form.Item
                        name='domainName'
                        label={<label style={{ fontWeight: 600 }}>{isBusiness ? '业务域名称' : '分析名称'}</label>}
                        style={{ marginBottom: 10 }}
                    >
                        {
                            isBatch ? <Table
                                rowKey="id"
                                columns={columnsByFa}
                                dataSource={dataListByFa}
                                pagination={{ position: ['none'], pageSize: 100000 }}
                                style={{ marginBottom: 20 }}
                                scroll={{
                                    y: 200,
                                }} /> : <span>{curName}</span>
                        }
                    </Form.Item>
                    <Row gutter={8}>
                        <Col>
                            <Form.Item label={<label style={{ fontWeight: 600 }}>{`${curTitle}`}</label>} className='oap-applied-business-domain'>
                                <Row gutter={8}>
                                    <Col span={3}>
                                        <Form.Item label="账号" name={['employee', 'adid']}>
                                            <Input
                                                placeholder='请输入'
                                                allowClear
                                                size="middle"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item label="eid" name={['employee', 'eidCode']}>
                                            <Input
                                                placeholder='请输入'
                                                allowClear
                                                size="middle"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item label="姓名" name={['employee', 'cnName']}>
                                            <Input
                                                placeholder='请输入'
                                                allowClear
                                                size="middle"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                        <Form.Item label="邮箱" name={['employee', 'email']}>
                                            <Input
                                                placeholder='请输入'
                                                allowClear
                                                size="middle"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={8}>
                        <Col flex="80px">
                            <Button disabled={!disableOperate} type='primary' onClick={fetchEmployee}>查询</Button>
                        </Col>
                        <Col flex="80px">
                            <Button onClick={resetSearch}>重置</Button>
                        </Col>
                    </Row>
                </Form>
                <Table
                    rowKey="employeeNumber"
                    columns={columns}
                    dataSource={dataList}
                    rowSelection={rowSelection}
                    pagination={{ position: ['none'], pageSize: 100000 }}
                    style={{ marginBottom: 20, marginTop: 20 }}
                    scroll={{ y: 240 }}
                />
                {curTitle !== '数据Owner' ? <div style={{ marginBottom: 20, height: '24px', lineHeight: '24px' }}>确认后，将向该用户发送邮件通知，需用户在邮件内确认接受后，当前配置结果才会生效。</div> : null}
                <Row justify="center">
                    <Col>
                        <Space>
                            {disableOperate ? <Button type='primary' onClick={informYou}>{needConfirm ? '确认并通知' : '保存'}</Button> : null}
                            <Button onClick={handleCancel}>取消</Button>
                        </Space>
                    </Col>
                </Row>
                {
                    pageStatus == 0 || !needConfirm ? null : <Divider />
                }
                {
                    pageStatus == 0 || !needConfirm ? null : emailRes()
                }
            </div>

        </Spin>
    </Modal>)
}

export default NoticePop;