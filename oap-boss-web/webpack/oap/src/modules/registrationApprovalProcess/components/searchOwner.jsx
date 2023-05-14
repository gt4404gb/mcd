import React, { useState, useEffect } from 'react';
import { Modal, Spin, Form, Row, Col, Input, Button, Table, message } from '@aurum/pfe-ui';
import { queryUserInfo } from '@/api/oap/commonApi';

const searchOwner = (props, refs) => {
  const [curVisible, setCurVisible] = useState(props.isShow);
  const [curTitle, setCurTitle] = useState(props.title);
  const [curKey, setCurKey] = useState(props.valueKey);
  const [curKeyName, setCurKeyName] = useState(props.valueKeyName);
  const [loading, setLoading] = useState(false);

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
  const [selectedRow, setSelectedRow] = useState([]);
  const onSelectChange = (selectedRowKeys, selectedRow) => {
    setSelectedRowKeys(selectedRowKeys);
    setSelectedRow(selectedRow);
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

  const handleCancel = () => {
    setCurVisible(false);
    ownerForm.resetFields();
    setSelectedRowKeys([]);
    setSelectedRow([]);
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

  const informYou = () => {
    if (selectedRow.length > 0) {
      props.handleOwner({
        curKey,
        curKeyName,
        selectedRow: selectedRow,
      })
      handleCancel()
    } else {
      return message.warning('请勾选员工选项')
    }
  }

  useEffect(() => {
    setCurVisible(props.isShow);
    setCurTitle(props.title);
    setCurKey(props.valueKey);
    setCurKeyName(props.valueKeyName);
  }, [props]);

  return <Modal
    title={props.title}
    modalType='normalType'
    open={curVisible}
    onOk={informYou}
    onCancel={handleCancel}
    width={700}>
    <Spin spinning={loading}>
      <Form
        form={ownerForm}
        size="middle"
        layout="vertical"
        style={{ position: 'relative' }}>
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
            <Button type='primary' onClick={fetchEmployee}>查询</Button>
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
        scroll={{ y: 240 }} />
    </Spin>
  </Modal>
}

export default searchOwner;