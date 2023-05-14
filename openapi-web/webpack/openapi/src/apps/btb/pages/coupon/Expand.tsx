import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Upload, message,IconFont } from '@aurum/pfe-ui';
import { format } from 'date-fns';
import * as apis from '@/apps/btb/common/apis';
import utils from '@/apps/btb/common/utils';
import './styles/Expand.less';

const defaultExpandData: any = {
  file: [],
}

export default ({ }: any) => {
  const [formObj, setFormObj]: any = useState(defaultExpandData);
  const [file, setFile]: any = useState(null);
  const [fileError, setFileError]: any = useState(null);

  const [form] = Form.useForm();

  function updateFile(file: any) {
    setFile(file);
    setFileError(file ? null : '请上传Excel模板文件');
  }

  useEffect(() => {
    form.resetFields();
  }, [formObj]);

  return (
    <div className="btb-coupon-expand">
      <Form
        form={form}
        labelCol={{ span: 1 }}
        className="expand-form"
        initialValues={formObj}
        labelAlign="right"
        onFinish={(values: any) => {
          if (!file) {
            setFileError('请上传文件模板');
            return;
          }
          setFileError(null);

          (async () => {
            const query: any = {};
            Object.entries(values).forEach(([key, value]: any) => {
              if (key !== 'file' && key !== 'tradeTime' && key !== 'tmplType') {
                query[key] = value;
              }
            });

            const formData = new FormData();
            formData.append('file', file);
            const buffResp: any = await apis.getBOSModule().couponExpand(query, formData);
            utils.ab2str(buffResp, (resp: any) => {
              if (!resp.success && resp.message) {
                message.error(resp.message);
              } else {
                const reader: any = new FileReader();
                reader.readAsDataURL(new Blob([buffResp])); // 转换为base64，可以直接放入a的href
                reader.onload = function (e: any) {
                  const aElement: any = document.getElementById('coupon-expand-download'); //获取a标签元素
                  aElement.download = `延期结果_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`;
                  aElement.href = e.target.result;
                  const event = new MouseEvent('click');
                  aElement.dispatchEvent(event);
                };
              }
            });
          })();
        }}
      >
        <div className="block-upload">
          <a id="coupon-expand-download"></a>
          <Row>
            <Col offset={3} span={12}>
              <Form.Item label={$t('上传模板')} >
                <Upload
                  accept={'.xlsx'}
                  maxCount={1}
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
                  <div className="templates">
                    <a href="https://cdn.mcd.cn/lego/openapi/template-v2.xlsx" onClick={(e: any) => { e.stopPropagation(); }}>券码延期模板</a>
                  </div>
                </Upload>
                {fileError && <div className="error">{fileError}</div>}
              </Form.Item>

              <Form.Item colon={false} label=" ">
                <Button disabled={file === null} type="primary" htmlType="submit">延期</Button>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col offset={3} span={12}>
              <Form.Item colon={false} label=" ">
                <div>常用商户编号</div>
                <div>M08149235 天猫</div>
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </div>
  )
}