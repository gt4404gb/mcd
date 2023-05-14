import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import * as merchantAction from '@/redux/actions/merchantAction';
import { Form, Row, Col, Input, Button, message, Modal, Upload, Radio } from '@aurum/pfe-ui';
import { IconUpload } from '@aurum/icons';
import * as apisEdit from '@/common/net/apis_edit';
// @ts-ignore
import { Space } from '@aurum/pfe-ui';
import { ab2str } from '@/common/helper';

const initExportExcelObj: any = {
  spuId: '', // 活动编号（精准查询）
  type: 1
}

export default (({ visible, setRefreshData, onClose }: any) => {
  const [exportExcelObj, setExportExcelObj]: any = useState(initExportExcelObj);
  const [file, setFile]: any = useState(null);
  const [exportName, setExportName] = useState('提交');
  let AllRegion: any = useRef({});

  const [form] = Form.useForm();

  const exportExcel = async () => {
    if (!file) {
      return;
    }
    setExportName('提交中 ...')
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', exportExcelObj.type);
      formData.append('spuId', exportExcelObj.spuId);
      const buffResp: any = await apisEdit.getMerchantModule().exportCodes(formData);
      ab2str(buffResp, (resp: any) => {
        if (!resp.success && resp.message) {
          message.error(resp.message);
        } else {
          message.success('文件导入成功,请稍后查看结果')
          onClose();
          setRefreshData(Math.random());
        }
      });
      setExportName('提交')
    }
    catch {
      setExportName('提交')
    }
  }

  function updateFile(file: any) {
    setFile(file);
  }

  return (
    <div>
      <Modal width={460} className="invoice-dialog" visible={visible} onCancel={() => {
        onClose()
      }} footer={null}
        title={`批量操作`}
      >
        <Form
          form={form}
          layout="vertical"
          className="search-form"
          initialValues={exportExcelObj}
          onFinish={(values: any) => {

          }}
          onValuesChange={(chgValues: any, values: any) => {
            setExportExcelObj(values);
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={'spuId'} name="spuId" rules={[{ required: true, message: '请输入spuId' }]}>
                <Input placeholder="请输入商品编码spuId" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={'操作方式'} name="type" >
                <Radio.Group>
                  <Radio value={1}>增量导入</Radio>
                  <Radio value={3}>批量删除</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={'导入文件'}>
              
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
                  <Space align="center" size={'xs'}>
                <Button><IconUpload />上传文件</Button>
                <a href="https://cdn.mcd.cn/ecs/template_activity.xlsx " onClick={(e: any) => { e.stopPropagation(); }}>下载模板</a>
                </Space>
              </Upload>
              </Form.Item>
            </Col>
          </Row>
          <div className='export-main'>
            <a id="coupon-expand-download"></a>
          </div>
        </Form>
        <div style={{display:'flex', justifyContent:'center'}}>
        <Space align="center" size={'xs'}>
          <Button disabled={file === null || !exportExcelObj.spuId || exportName==='提交中 ...'} type="primary" onClick={exportExcel}>{exportName}</Button>
          <Button onClick={onClose}>取消</Button>
        </Space>
        </div>
      </Modal>
    </div>
  )
})
