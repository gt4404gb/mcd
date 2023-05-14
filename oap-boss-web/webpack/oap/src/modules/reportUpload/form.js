import React from 'react';
import { Spin, Form, Row, Col, message, Button, Table, Select, Input, Space } from '@aurum/pfe-ui';
import { IconUpload } from '@aurum/icons';
import { getReportTemplateDetail, reportUploadRun } from '@/api/oap/report_upload.js';
import { uploadDataFile, downloadFile } from '@/api/oap/commonApi.js';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { saveAs } from 'file-saver';
import BlockTitle from '@/components/blockTitle/index';
import { FIELD_INPUT_TYPE } from '@/constants';

export default class Editform extends React.Component {
  constructor(props) {
    super(props);
    this.formScheduleRef = React.createRef();
    this.fileInput = React.createRef();
    this.state = {
      isLoading: false,
      detailInfo: {},
      editId: null,
      fileInfo: {
        fileName: '',
        fileId: '', // 18364410575331328
      },
      columns: [
        { title: '序号', dataIndex: 'tableIndex', width: 80 },
        { title: '错误列', dataIndex: 'colName', width: 120, align: 'center' },
        { title: '错误内容', dataIndex: 'err', width: 200, align: 'center' },
      ],
      dataList: [],
      runResult: ''
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
  }

  initShow = async (id) => {
    this.setState({ isLoading: true })
    try {
      const res = await getReportTemplateDetail({ id });
      this.setState({
        detailInfo: res.data || {},
        isLoading: false
      })
    } catch (errInfo) {
      errInfo.msg && message.error(errInfo.msg);
      this.setState({ isLoading: false })
    }
  }

  //下载
  handleDown = () => {
    this.setState({
      isLoading: true,
    }, () => {
      downloadFile(this.state.detailInfo.fileId).then(res => {
        const blob = new Blob([res.data.fileBlob], { type: 'application/octet-stream' })
        let downName = res.data.fileName.replace(/"/g, '');
        saveAs(blob, downName);
        message.success("文件下载成功！")
        this.setState({
          isLoading: false
        })
      }).catch(err => {
        message.error('下载失败');
        this.setState({
          isLoading: false
        })
      })
    })
  }

  handleSelectFile = () => {
    this.fileInput.current.value = null;
    this.fileInput.current.click();
  }

  //上传
  handleFileChange = (ev) => {
    const files = ev.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const fileTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!fileTypes.includes(file.type)) {
      message.warning('暂不支持解析' + file.type + '类型的文件');
      return false;
    }
    this.setState({
      isLoading: true,
    })
    uploadDataFile('OAP_TMP', file).then(res => {
      this.setState({
        isLoading: false,
        fileInfo: {
          fileName: res.data?.fileName,
          fileId: res.data?.id,
        }
      })
    }).catch((err) => {
      err && message.error(err.msg || err);
      this.setState({
        isLoading: false,
      })
    })
  }

  handleRun = () => {
    if (this.state.fileInfo.fileId == '') {
      message.error('请先完成上传');
      return;
    }
    console.log(this.formScheduleRef)
    this.formScheduleRef.current.validateFields().then(values => {
      this.setState({
        isLoading: true
      }, () => {
        let fieldValuesTypeOfArray = Object.prototype.toString.call(values.fieldValues) === '[object Array]'
        let arr = fieldValuesTypeOfArray ? values?.fieldValues : [values?.fieldValues];
        const params = {
          fileId: this.state.fileInfo.fileId,
          templateId: this.state.detailInfo.id,
          fieldName: this.state.detailInfo?.majorKeyName || '',
          fieldOperate: values?.fieldOperate || '',
          fieldValues: arr.map(item => {
            return item
          }),
          insertType: this.state.detailInfo?.insertType || '',
        }
        console.log('save', params)
        reportUploadRun(params).then(res => {
          let dataList = res.data?.tips || [];
          dataList.forEach((itm, index) => {
            itm.tableIndex = index + 1;
          });
          this.setState({
            runResult: res.data.status == 0 ? '运行完成，上传成功' : '解析失败',
            dataList,
            isLoading: false
          })
        }).catch(errInfo => {
          errInfo.msg && message.error(errInfo.msg);
          this.setState({ isLoading: false })
        })
      })
    }).catch(err => {
      console.log('表单校验错误')
    })
  }

  render () {
    const { isLoading, detailInfo, columns, dataList, runResult } = this.state;
    return <Spin spinning={isLoading}>
      <div style={{ padding: '0 16px' }}>
        <Form
          ref={this.formScheduleRef}
          labelCol={{ style: { width: '80px' } }}>
          <Row>
            <Col span={12}>
              <BlockTitle fontSize="14px" text="上传报告" />
            </Col>
          </Row>
          <Row style={{ marginTop: '4px' }}>
            <Col flex="400px">
              <Form.Item label="报告名称：" className='oap-form-labelBold oap-formlabel-show'>
                <span>{detailInfo?.reportName}</span>
                <span className='oap-btn-blue' onClick={this.handleDown}>下载模板</span>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col flex="600px">
              <Form.Item label="说明：" className='oap-form-labelBold oap-formlabel-show oap-formlabel-showdesc'>
                <span style={{ lineHeight: '24px' }}>{detailInfo?.reportDesc}</span>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col flex="600px">
              <Form.Item label="上传说明：" className='oap-form-labelBold oap-formlabel-show oap-formlabel-showdesc'>
                <span style={{ lineHeight: '24px' }}>{detailInfo?.uploadDesc}</span>
              </Form.Item>
            </Col>
          </Row>
          {detailInfo?.insertType == 3 ? <Row>
            <Col flex="600px">
              <Form.Item label="上传范围：" required className='oap-form-labelBold oap-formlabel-show oap-formlabel-showdesc'>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ lineHeight: '36px' }}>{detailInfo?.aliasName}</span>
                  <Form.Item noStyle name="fieldOperate" rules={[{ required: true, message: '请选择操作符' }]}>
                    <Select placeholder="请选择" style={{ width: '100px', marginLeft: '10px' }}>
                      {detailInfo?.fieldOperates.map(model => {
                        return <Select.Option value={model} key={model}>{model}</Select.Option>
                      })}
                    </Select>
                  </Form.Item>
                  {detailInfo?.inputType == 3 ? <Form.Item noStyle name="fieldValues" rules={[{ required: true, message: '请输入' }]}>
                    <Input.TextArea rows={4} placeholder="请输入" maxLength={500} showCount style={{ flex: '1', marginLeft: '10px' }} />
                  </Form.Item> : <Form.Item noStyle name="fieldValues" rules={[{ required: true, message: '请选择枚举值' }]}>
                    <Select
                      mode={detailInfo?.inputType == 1 ? 'multiple' : '-'}
                      placeholder="请选择"
                      style={{ flex: '1', marginLeft: '10px' }}>
                      {detailInfo?.fieldValues.map(model => {
                        return <Select.Option value={model.value} key={model.value}>{model.name}</Select.Option>
                      })}
                    </Select>
                  </Form.Item>}
                </div>
              </Form.Item>
            </Col>
          </Row> : null}
          <Row>
            <Col flex="1">
              <Form.Item label="上传文件：" className='oap-form-labelBold'>
                <Button type="primary" icon={<IconUpload />} onClick={() => this.handleSelectFile()}>上传文件</Button>
                <input type="file" style={{ display: 'none' }} ref={this.fileInput} onChange={(ev) => this.handleFileChange(ev)} />
                <span style={{
                  flex: 1,
                  color: '#1890ff',
                  height: '40px',
                  lineHeight: '40px',
                  marginLeft: '10px',
                }}>{this.state.fileInfo.fileName}</span>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        {checkMyPermission('oap:report:template:import') && <Button type="primary" loading={isLoading} onClick={this.handleRun}>运行</Button>}
        {runResult != '' && <>
          <BlockTitle fontSize="14px" text="运行结果" top="16px" bottom="16px" />
          <div style={{ marginBottom: '16px' }}>{runResult}</div>
          {runResult == '解析失败' && <div className="table-container" style={{ width: '500px' }}>
            <Table
              rowKey="tableIndex"
              columns={columns}
              dataSource={dataList}
              loading={isLoading}
              pagination={{ position: ['none'], pageSize: 100000 }}
              scroll={{ x: '100%' }} />
          </div>}
        </>}
      </div>
    </Spin >
  }
}