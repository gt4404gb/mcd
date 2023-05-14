import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Form, Table, Space, Row, Col, Input, Button, Upload, Popconfirm, DatePicker, message, IconFont, Checkbox } from '@aurum/pfe-ui';
import { format } from 'date-fns';
import moment from 'moment';
import * as api from '../common/apis.js';
import ExportTask from '../components/ExportTask';
import '@/assets/styles/common.less';
import './styles/exportOrder.less';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';
const { RangePicker }: any = DatePicker;
// @ts-ignore
import { timeSlot, ab2str } from '@/common/helper';
const initSearchObj: any = {
  spuId: '',
  orderStatus: 12,
  setDelivery: false,
}

export default ((props: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [exportName, setExportName] = useState('导出');
  const [file, setFile]: any = useState(null);
  const [tabVisible, setTabVisible]: any = useState(false);
  const [checked, setChecked] = useState(true);
  const [form] = Form.useForm();

  const exportExcel = async (params: any) => {
    setExportName('导出中 ...')
    try {
      const buffResp: any = await api.getMerchantModule().export(params);
      ab2str(buffResp, (resp: any) => {
        if (!resp.success && resp.message) {
          message.error(resp.message);
        } else {
          const reader: any = new FileReader();
          reader.readAsDataURL(new Blob([buffResp])); // 转换为base64，可以直接放入a的href
          reader.onload = function (e: any) {
            const aElement: any = document.getElementById('orders-export'); //获取a标签元素
            aElement.download = `待发货订单列表_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`;
            aElement.href = e.target.result;
            const event = new MouseEvent('click');
            aElement.dispatchEvent(event);
          };
        }
        setExportName('导出')
      });
    } catch {
      setExportName('导出')
    }
  }


  //20220829
  function updateFile(file: any) {
    setFile(file);
  }

  const onChange =(e:any) => {
    console.log(`checked = ${e.target.checked}`);
    setChecked(e.target.checked);
  }

  const inExcel = async () => {
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    const buffResp: any = await api.getMerchantModule().exportExpresses(formData);
    ab2str(buffResp, (resp: any) => {
      if (!resp.success && resp.message) {
        message.error(resp.message);
      } else {
        message.success('文件导入成功,请稍后查看结果')
      }
    });
  }

  return (
    <div className="order-list ecs-page-tools">
      <a id="orders-export"></a>
      <div className="tool-panel">
        <Form
          layout="vertical"
          initialValues={searchObj}
          onFinish={(values) => {
            let params: any = {};
            console.log('values', values)
            if (!values.spuId) {
              message.error('请输入商品id')
              return;
            }
            if (exportName !== '导出') {
              return
            } else {
              params.spuId = values.spuId;
              params.setDelivery = checked;
              if (values.dateRange) {
                if (values.dateRange[0]) params.startTime = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss');
                if (values.dateRange[1]) params.endTime = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss');
              }
              console.log('params', params)
              exportExcel(params);
            }
          }}
        >
          <Row><Col span={12}><div className="section-header">导出待发货订单</div></Col></Row>
          <Row gutter={32}>
            <Col span={4}>
              <Form.Item label={$t('商品编号(spuid)')} name='spuId'>
                <Input placeholder='请填写spuid' />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label={$t('下单时间')} name='dateRange'>
                <RangePicker
                  style={{ width: '100%' }}
                  picker="date"
                  showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                  suffixIcon={<IconFont type="icon-rili" />}
                  disabledDate={(current: any) => {
                    return current && current > moment().endOf('day');
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="关联操作">
              <Checkbox checked={checked} onChange={onChange}>导出并修改订单为发货处理中(<span className='export-no-cancel'>不可取消退款</span>)</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={32}>
            <Col span={12}>
              <Button type="primary" disabled={!checkMyPermission('ecs:ecsLego:export')} htmlType="submit" >{exportName}</Button>
            </Col>
          </Row>
        </Form>
      </div>
      <div className='tool-panel'>
        <Row><Col span={12}><div className="section-header">导入批量发货</div></Col></Row>
        <Row><Col span={12}><div className="section-sub-title">导入即修改订单为已发货，不可撤销，请谨慎操作</div></Col></Row>
        <Row gutter={32}>
          <Col span={3}>
            <Form.Item>
              <Upload
                accept={'.xlsx'}
                maxCount={1}
                className='export-btn'
                onChange={(info: any) => {
                  if (info.fileList.length === 0) {
                    updateFile(null);
                  } else {
                    updateFile(info.file);
                  }
                }}
                beforeUpload={(file: any) => {
                  return false;
                }}>
                <Button><IconFont type="icon-shangchuan" />上传文件</Button>
              </Upload>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Space>
              <Popconfirm
                placement="topLeft"
                title="确认导入进行发货？"
                onConfirm={() => { inExcel() }}
                okText="确定"
                cancelText="取消"
                icon=""
              >
                <Button disabled={file === null} type="primary">导入</Button>
              </Popconfirm>
              <a href="https://cdn.mcd.cn/ecs/template_delivery.xlsx" onClick={(e: any) => { e.stopPropagation(); }}>下载模板</a>
              <a type='link' onClick={() => { setTabVisible(true) }}>查看导入结果</a>
            </Space>
          </Col>
        </Row>
      </div>
      <ExportTask visible={tabVisible} onClose={() => { setTabVisible(false) }} />
    </div >
  )
});
