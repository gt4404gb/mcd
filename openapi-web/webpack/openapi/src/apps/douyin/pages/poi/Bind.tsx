import React, { useState, useRef } from 'react';
import { Form, Input, Select, Button, Row, Col, message, InputNumber, Space } from '@aurum/pfe-ui';
import { SaveOutlined } from "@ant-design/icons";
import * as apis from '@/apps/douyin/common/apis'
import './styles/Bind.less'

const JSONPretty = require('react-json-pretty');

const { Option } = Select;
const { TextArea } = Input;

export default ({ }: any) => {
  const [bindForm]: any = Form.useForm();
  const [searchForm]: any = Form.useForm();

  const [loading, setLoading]: any = useState(false);
  const [shopBindResault, setShopResult]: any = useState(); //存放返回的店铺信息

  const fetchShopInfo: any = async (shopId: any) => {
    setLoading(true);
    const resp: any = await apis.getDouyinModule().fetchShopInfo(shopId);
    setShopResult(resp.data?.data || '');
    setLoading(false);
  }

  const fetchMatchStatus: any = async (shopId: any) => {
    setLoading(true);
    const resp: any = await apis.getDouyinModule().fetchShopMatchInfo(shopId);
    setShopResult(resp.data.data);
    setLoading(false);
  }


  const layout: any = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 }
  }

  const queryLayout: any = {
    labelCol: { span: 4 },
    wrapperCol: { span: 10 }
  }


  return (
    <div className='bind-search-wrap'>
      <div className='query-container module-wrap'>
        <div className='header'>查询门店POI信息</div>
        <div className='query-body '>按麦当劳门店编号查询抖音POI信息，如查无结果则未做关联</div>
        <div className='query-footer'>
          <Form
            layout="vertical"
            labelAlign="left"
            onFinish={(value: any) => {
              if (value.option === 1) {
                fetchShopInfo(value.supplier_ext_id)
              } else {
                fetchMatchStatus(value.supplier_ext_id)
              }
            }}
            autoComplete="off"
            initialValues={{
              option: 1
            }}
          >
            <div className="form-wrap">
              <Row align='middle' gutter={16}>
                <Col span={3}>
                  <Form.Item label="查询选项" name="option">
                    <Select>
                      <Option value={1}>查询店铺信息</Option>
                      <Option value={2}>查询店铺匹配状态</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item name='supplier_ext_id' label='门店编号'
                    rules={[{
                      required: true,
                      message: '请输入门店编号，最多输入10位数字',
                      pattern: new RegExp(/^[1-9]\d*$/, "g"),
                    }]}>
                    <Input></Input>
                  </Form.Item>
                </Col>
              </Row>
              <Row align='middle' gutter={24}>
                <Col span={12}>
                  <Button loading={loading} type="primary" htmlType="submit" >查询</Button>
                </Col>
              </Row>
            </div>
          </Form>
          <div className='search-result'>
            <JSONPretty themeClassName='monikai' id='json-pretty' data={shopBindResault} space='4'></JSONPretty>
          </div>
        </div>
      </div>
      <div className="module-wrap">
        <div className="header">店铺关联<span style={{fontSize:'12px', color:'#999', marginLeft:'8px'}}>必须信息</span></div>
        <Form
          layout="vertical"
          labelAlign="left"
          name="bindForm"
          form={bindForm}
          onFinish={
            (value: any) => {
              const params: any = {
                ...value,
                type: 2,
                attributes: {}
              }
              const resp: any = apis.getDouyinModule().bindShop(params)
              resp.then((resp: any) => {
                const data: any = resp.data.data;
                message.destroy();
                if (data.error_code) {
                  message.error(data.description)
                } else {
                  message.success('绑定成功')
                }
              })
            }
          }
          autoComplete="off"
          initialValues={{
            status: 1
          }}
        >
          <div className="form-wrap">
            <Row align='middle' gutter={16}>
              <Col span={3}>
                <Form.Item label="门店编号" name="supplier_ext_id"
                  rules={[{
                    required: true,
                    message: '请输入门店编号，最多输入10位数字',
                    pattern: new RegExp(/^[1-9]\d*$/, "g"),
                  }]}>
                  <Input maxLength={10} />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="抖音POI" name="poi_id"
                  rules={[{
                    required: true,
                    message: '请输入抖音POI，最多输入20位数字',
                    pattern: new RegExp(/^[1-9]\d*$/, "g"),
                  }]}>
                  <Input maxLength={20} />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="门店名称" name="name"
                  rules={[{
                    required: true,
                    message: '请输入门店名称，最多输入100位字符',
                  }]}>
                  <Input maxLength={100} />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="状态" name="status">
                  <Select>
                    <Option value={1}>在线</Option>
                    <Option value={2}>下线</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row align='middle' gutter={16}>
              <Col span={12}>
                <Space size='xs'>
                  <Button type="primary" htmlType="submit">保存</Button>
                  <Button htmlType="reset" onClick={() => bindForm.resetFields()}>重置</Button>
                </Space>
              </Col>
            </Row>
          </div>
        </Form>
      </div>
      <div className='module-wrap'>
        <div className="header">店铺匹配POI</div>
        <div className="title">（必须信息）</div>
        <Form
          layout="vertical"
          labelAlign="left"
          name='searchForm'
          form={searchForm}
          onFinish={
            (value: any) => {
              const params: any = {
                match_data_list: [value]
              }
              const resp: any = apis.getDouyinModule().shopMatch(params)
              resp.then((resp: any) => {
                const data: any = resp.data.data;
                message.destroy();
                if (data.error_code) {
                  message.error(data.description)
                } else {
                  message.destroy()
                  if (data.is_success === 1) message.success('上传成功')
                  else message.error('上传失败')
                }
              })
            }
          }
          autoComplete="off"
        >
          <div className="form-wrap">
            <Row align='middle' gutter={16}>
              <Col span={3}>
                <Form.Item label="POIID" name="poi_id"
                  rules={[{
                    required: true,
                    message: '请输入POIID',
                  }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="店铺名称" name="poi_name"
                  rules={[{
                    required: true,
                    message: '请输入店铺名称',
                  }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="店铺所在省份" name="province"
                  rules={[{
                    required: true,
                    message: '请输入店铺所在省份',
                  }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="店铺所在城市" name="city"
                  rules={[{
                    required: true,
                    message: '请输入店铺所在城市',
                  }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="店铺地址" name="address"
                  rules={[{
                    required: true,
                    message: '请输入店铺地址',
                  }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="店铺ID" name="supplier_ext_id"
                  rules={[{
                    required: true,
                    message: '请输入店铺ID',
                    pattern: new RegExp(/^[1-9]\d*$/, "g"),
                  }]}>
                  <Input maxLength={10} />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="经度" name="longitude"
                  rules={[{
                    required: true,
                    message: '请输入经度',
                  }]}>
                  <InputNumber controls={false} precision={3} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="纬度" name="latitude"
                  rules={[{
                    required: true,
                    message: '请输入纬度',
                  }]}>
                  <InputNumber precision={3} controls={false} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item label="其他信息" name="extra"
                  rules={[{
                    required: true,
                    message: '其他信息不能为空',
                  }]}>
                  <TextArea />
                </Form.Item>
              </Col>
            </Row>
            <Row align='middle' gutter={16}>
              <Col span={12}>
                <Space size="xs">
                  <Button type="primary" htmlType="submit">保存</Button>
                  <Button htmlType="reset" onClick={() => searchForm.resetFields()}>重置</Button>
                </Space>
              </Col>
            </Row>
          </div>
        </Form>
      </div>
    </div>
  )
}