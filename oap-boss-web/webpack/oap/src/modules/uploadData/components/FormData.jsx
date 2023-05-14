import React, { useContext, useEffect, useRef, useState } from "react";
// import {
//   Spin, Steps, Divider, Form, Row, Col, Button,Modal,
//   Select, Radio, Descriptions,message, Table,Badge
// } from '@mcd/portal-components';
// import { Input } from "antd";
import { Space, Spin, Steppers, Divider, Form, Row, Col, Button, Modal, Input, Select, Radio, Descriptions, message, Table, Badge, Empty } from '@aurum/pfe-ui';
const { Stepper } = Steppers;
import { IconUpload, IconLoadingFill } from '@aurum/icons';
import {
  getTemplateDataBaseOptions,
  getTemplateTableOptions,
  firstStepCommit,
  secondStepCommit,
  getWarehouseDetail,
  downTableFieldsTemplate,
  updateFirstStepCommit,
  updateSecondStepCommit
} from '@/api/oap/upload_data.js';
import { uploadDataFile } from '@/api/oap/commonApi.js';
const EditableContext = React.createContext(null);
import { UPDATE_TYPE_LIST, TABLE_TYPE_LIST, UPLOAD_TABLE_TYPE } from '@/constants';
import { saveAs } from 'file-saver';

const FIELD_TYPE = [
  { value: 'string', label: 'string' },
  { value: 'date', label: 'date' },
  { value: 'double', label: 'double' }
]
class UploadForm extends React.Component {
  constructor(props) {
    super(props);
    this.formStepOneRef = React.createRef();
    this.fileInput = React.createRef();
    this.state = {
      isLoading: false,
      current: 1,
      steps: [
        { title: '上传文件' },
        { title: '解析文件' },
        { title: '完成' }
      ],
      fileInfo: {
        fileName: '',
        fileId: '', // 17740849968717824
      },
      formBasicInfo: {
        tableType: '1',
      },
      storeOptions: [],
      tableOptions: [],
      columns: [
        {
          title: '序号',
          dataIndex: 'tableIndex',
          fixed: 'left',
          width: 80,
        },
        {
          title: '字段名称',
          dataIndex: 'columnName',
          fixed: 'left',
          width: 280,
          align: 'left',
          ellipsis: true,
        },
        {
          title: '字段类型',
          dataIndex: 'columnType',
          fixed: 'left',
          width: 280,
          align: 'left',
          editable: true,
        }
      ],
      components: {
        body: {
          row: EditableRow,
          cell: EditableCell,
        }
      },
      dataSource: [],
      analyseStep: 0, // 0代表初始，1代表解析中，2代表解析成功，3代表解析失败----改成在列表中查看解析状态
      err_columns: [
        {
          title: '序号',
          dataIndex: 'tableIndex',
          fixed: 'left',
          width: 80,
        },
        {
          title: '错误列',
          dataIndex: 'columnName',
          fixed: 'left',
          width: 280,
          align: 'left',
        },
        {
          title: '错误内容',
          dataIndex: 'columnType',
          fixed: 'left',
          width: 280,
          align: 'left',
        }
      ],
      err_datasource: [],
      isLoadingTableName: false
    }
  }
  componentDidMount () {
    if (this.props.type === 'edit' && this.props.modelId) {
      this.initAsync(this.props?.modelId);
    }
    this._getTemplateDataBaseOptions();
  }
  _getTemplateDataBaseOptions = () => {
    getTemplateDataBaseOptions().then(res => {
      this.setState({
        storeOptions: res.data || []
      })
    })
  }
  initAsync = (id) => {
    this.setState({
      isLoading: true,
    })
    let formData = this.formStepOneRef.current.getFieldsValue();
    getWarehouseDetail(id).then(res => {
      let editInitData = {
        id: res.data.id,
        taskName: res.data.taskName || '',
        instruction: res.data.instruction || '',
        tableType: res.data.taskType + '',
        dbName: res.data.dbName,
        tableName: res.data.tableName,
        fileId: `${res.data.fileId}`,
        updateType: res.data.updateType,
      }
      formData = Object.assign({}, formData, editInitData);
      this.formStepOneRef.current.setFieldsValue({ ...formData });
      this.setState({
        isLoading: false,
        fileInfo: {
          fileName: res.data.fileInfo.fileName,
          fileId: res.data.fileInfo.fileId,
        },
        formBasicInfo: {
          ...editInitData
        }
      }, () => {
        console.log(11111, editInitData)
      })
    }).catch((err) => {
      err && message.error(err.msg || err);
    })
  }
  handleSelectFile = () => {
    this.fileInput.current.value = null;
    this.fileInput.current.click();
  }
  //上传
  handleFileChange = (ev) => {
    const formData = this.formStepOneRef.current.getFieldsValue();
    const files = ev.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const fileTypes = ['text/csv', 'application/vnd.ms-excel'];
    if (!fileTypes.includes(file.type)) {
      message.warning('暂不支持解析' + file.type + '类型的文件');
      return false;
    }
    this.setState({
      isLoading: true,
    })
    uploadDataFile('OAP_CSV', file).then(res => {
      console.log('res = ', res);
      formData.fileId = res.data?.id;
      this.formStepOneRef.current.setFieldsValue({ ...formData });
      this.setState({
        isLoading: false,
        fileInfo: {
          fileName: res.data?.fileName,
          fileId: res.data?.id,
        }
      })
      message.success('上传成功！')
    }).catch((err) => {
      console.log('err = ', err);
      err && message.error(err.msg || err);
      this.setState({
        isLoading: false,
      })
    })
  }
  //下一步
  handleStepsNext = () => {
    let { current, columns } = this.state;
    if (current == 1) {
      this.formStepOneRef.current.validateFields().then(values => {
        this.setState({
          isLoading: true,
        })
        let requestApi = firstStepCommit,
          params = {
            id: values.id,
            taskName: values.taskName,
            instruction: values.instruction,
            dbName: values.dbName,
            tableName: values.tableName,
            fileId: values.fileId,
            tableType: values.tableType
          };
        if (values.tableType == UPLOAD_TABLE_TYPE.update) {
          requestApi = updateFirstStepCommit;
          params = { ...params, updateType: values.updateType }
          columns = [
            {
              title: '序号',
              dataIndex: 'tableIndex',
              fixed: 'left',
              width: 80,
            },
            {
              title: '字段名称',
              dataIndex: 'columnName',
              fixed: 'left',
              width: 280,
              align: 'left',
              ellipsis: true,
            }
          ]
        }
        requestApi(params).then(res => {
          let dataList = res.data.columnInfos.map((item, index) => {
            return {
              ...item,
              tableIndex: `${index + 1}`,
            }
          })
          this.setState({
            isLoading: false,
            formBasicInfo: {
              ...params
            },
            current: current + 1,
            dataSource: [...dataList],
            columns
          })
        }).catch(err => {
          err && message.error(err.msg || err);
          this.setState({
            isLoading: false,
          })
        })
      }).catch(err => {
        console.log('表单校验失败', err)
      })
    }
  }
  // 上一步
  handleStepsPrev = () => {
    this.setState({
      current: 1,
    })
  }
  handleSaveAndParse = () => {
    const { formBasicInfo, dataSource } = this.state;
    let columnInfos_ = dataSource.map(item => {
      return {
        columnName: item.columnName,
        columnType: item.columnType,
      }
    })
    this.setState({
      isLoading: true,
      analyseStep: 1,
    })
    let requestApi = secondStepCommit,
      params = {
        id: formBasicInfo.id,
        taskName: formBasicInfo.taskName,
        instruction: formBasicInfo.instruction,
        dbName: formBasicInfo.dbName,
        tableName: formBasicInfo.tableName,
        fileId: formBasicInfo.fileId,
        columnInfos: [...columnInfos_],
      }
    if (formBasicInfo.tableType == UPLOAD_TABLE_TYPE.update) {
      requestApi = updateSecondStepCommit;
      params = {
        id: formBasicInfo.id,
        taskName: formBasicInfo.taskName,
        instruction: formBasicInfo.instruction,
        dbName: formBasicInfo.dbName,
        tableName: formBasicInfo.tableName,
        fileId: formBasicInfo.fileId,
        updateType: formBasicInfo.updateType,
        tableType: formBasicInfo.tableType
      }
    }
    requestApi(params).then(res => {
      console.log('res = ', res);
      this.setState({
        isLoading: false,
        analyseStep: 2,
      }, () => {
        this.props.onBack();
      })
    }).catch(err => {
      err && message.error(err.msg || err);
      this.setState({
        isLoading: false,
        analyseStep: 3,
      })
    })
  }
  //返回
  goBackList = () => {
    Modal.confirm({
      title: "离开此页面？",
      content: <span>离开将丢失已编辑内容，请确认是否离开？</span>,
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        this.props.onBack();
      }
    });
  }
  handleSave = (row) => {
    const newData = [...this.state.dataSource];
    const index = newData.findIndex((item) => row.columnName === item.columnName && row.tableIndex === item.tableIndex);
    const item = newData[index];
    newData.splice(index, 1, { ...item, ...row });
    this.setState({
      dataSource: newData,
    })
  };
  createAnalyseEle = () => {
    const { analyseStep, err_columns, err_datasource } = this.state;
    let ele = null;
    switch (analyseStep) {
      case 0: ele = null; break;
      case 1: ele = (<span><Badge status={'processing'} text='解析中...' /></span>); break;
      case 2: ele = (<span><Badge status={'success'} text='解析完成，数据已更新' /></span>); break;
      case 3: ele = (<Table
        rowKey="id"
        columns={err_columns}
        dataSource={err_datasource}
      ></Table>); break;
      default: ele = null; break;
    }
    return ele;
  }

  //切换表类型
  handleTableType = () => {
    let formData = this.formStepOneRef.current.getFieldsValue();
    this.setState({
      formBasicInfo: formData
    })
    if ((formData.dbName ?? '') != '') this.handleDbName(formData.dbName)
  }

  handleDbName = async (value) => {
    let formData = this.formStepOneRef.current.getFieldsValue();
    if (formData.tableType == UPLOAD_TABLE_TYPE.update) {
      this.setState({
        isLoadingTableName: true,
        tableOptions: []
      })
      try {
        const resInfo = await getTemplateTableOptions({ dbName: value });
        this.setState({
          tableOptions: resInfo.data || [],
          isLoadingTableName: false
        })
      } catch (errorInfo) {
        console.log(400, errorInfo)
        this.setState({
          isLoadingTableName: false
        })
      }
    }
  }

  handleTableName = () => {
    let formData = this.formStepOneRef.current.getFieldsValue();
    this.setState({
      formBasicInfo: formData
    })
  }

  //下载模板
  downLoad = () => {
    let formData = this.formStepOneRef.current.getFieldsValue();
    this.setState({
      isLoading: true,
    }, () => {
      downTableFieldsTemplate({ dbName: formData.dbName, tableName: formData.tableName }).then(res => {
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

  render () {
    const { columns, components, dataSource } = this.state;
    const columns_ = columns.map((col) => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: (record) => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave,
        })
      }
    })
    return (<Spin spinning={this.state.isLoading}>
      <div className="common-edit">
        <Steppers current={this.state.current}>
          {this.state.steps.map(item => (
            <Stepper key={item.title} title={item.title} />
          ))}
        </Steppers>
        {this.state.current === 1 && <Form
          ref={this.formStepOneRef}
          initialValues={this.state.formBasicInfo}
          labelCol={{ style: { width: '88px' } }}>
          <Row>
            <Col flex="580px">
              <Form.Item label="任务名称" name="taskName" rules={[{ required: true, message: '请填写任务名称' }]}>
                <Input placeholder="填写任务名称" maxLength={50} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col flex="580px">
              <Form.Item label="任务说明" name="instruction">
                <Input.TextArea rows={4} placeholder="请填写任务说明" maxLength={500} showCount />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col flex="580px">
              <Form.Item label="表类型" name="tableType" rules={[{ required: true, message: '请选择表类型' }]}>
                <Radio.Group
                  options={TABLE_TYPE_LIST}
                  optionType="button"
                  buttonStyle="solid"
                  onChange={this.handleTableType} />
              </Form.Item>
            </Col>
          </Row>
          {this.state.formBasicInfo.tableType == UPLOAD_TABLE_TYPE.update && <Row><Col flex="580px">
            <Form.Item label="更新方式" name="updateType" rules={[{ required: true, message: '请选择更新方式' }]}>
              <Radio.Group
                options={UPDATE_TYPE_LIST}
                optionType="button"
                buttonStyle="solid" />
            </Form.Item>
          </Col></Row>
          }
          <Row>
            <Col flex="680px">
              <Form.Item label="目标表">
                <Form.Item name="dbName" rules={[{ required: true, message: '请选择数据库' }]} style={{ display: 'inline-block', width: '180px', marginBottom: '0' }}>
                  <Select placeholder="选择数据库" onChange={this.handleDbName}>
                    {
                      this.state.storeOptions.map(name => (
                        <Select.Option key={name} value={name}>{name}</Select.Option>
                      ))
                    }
                  </Select>
                </Form.Item>
                <Form.Item
                  name="tableName"
                  rules={[{ required: true, message: `请${this.state.formBasicInfo.tableType == UPLOAD_TABLE_TYPE.create ? '填写' : '选择'}表名称` }]}
                  style={{ display: 'inline-block', width: '312px', paddingLeft: '10px', marginBottom: '0' }}>
                  {this.state.formBasicInfo.tableType == UPLOAD_TABLE_TYPE.create ?
                    <Input placeholder="填写表名" maxLength={64} /> : <Select
                      showSearch
                      placeholder="选择表名"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      onChange={this.handleTableName}
                      notFoundContent={this.state.isLoadingTableName ? <IconLoadingFill spin /> : (<Empty></Empty>)}>
                      {this.state.tableOptions.map(name => (
                        <Select.Option key={name.tableName} value={name.tableName}>{name.tableName}</Select.Option>
                      ))}
                    </Select>}
                </Form.Item>
                {this.state.formBasicInfo.tableType == UPLOAD_TABLE_TYPE.update && <Button type="link" disabled={!this.state.formBasicInfo.tableName} onClick={this.downLoad}>下载模板</Button>}
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col flex="474px">
              <Form.Item label="文件ID" name="fileId" rules={[{ required: true, message: '请上传文件' }]}>
                <Input disabled />
              </Form.Item>
            </Col>
            <Col flex="400px" style={{ paddingLeft: '10px' }}>
              <Form.Item>
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
          <Row>
            <Col>
              <Form.Item hidden name="id"><Input type="hidden" /></Form.Item>
            </Col>
          </Row>
          <Row>
            <Col>
              <Descriptions title="文件规则：" layout="horizontal" column={1} colon={false}>
                <Descriptions.Item label="1. ">限csv utf-8文件；</Descriptions.Item>
                <Descriptions.Item label="2. ">首行为列名/字段名，每一行为一条数据；</Descriptions.Item>
                <Descriptions.Item label="3. ">不能超过100列（100个字段）；</Descriptions.Item>
                <Descriptions.Item label="4. ">文件大小不能超过100M；</Descriptions.Item>
                <Descriptions.Item label="5. ">支持转换为数据库表的字段类型：string，date，double；</Descriptions.Item>
                <Descriptions.Item label="6. ">日期必须为yyyy-MM-dd格式。</Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Space>
                <Button type="primary" onClick={this.handleStepsNext}>下一步</Button>
                <Button onClick={this.goBackList}>返回</Button>
              </Space>
            </Col>
          </Row>
        </Form>
        }
        {
          this.state.current === 2 && <Row span={12}>
            <Col span={12}>
              <Table
                components={components}
                rowClassName={() => 'editable-row'}
                dataSource={dataSource}
                columns={columns_}
                rowKey="tableIndex"
                tableKey="firstUploadResList"
                pagination={{ position: ['none'], pageSize: 100000 }}
              ></Table>
            </Col>
            <Col span={12} style={{ marginTop: '20px' }}>
              <Space>
                <Button type="primary" onClick={this.handleStepsPrev}>上一步</Button>
                <Button type="primary" onClick={this.handleSaveAndParse}>保存并解析</Button>
                <Button onClick={this.goBackList}>返回</Button>
              </Space>
            </Col>
            {/* 解析结果-失败的表格 */}
            {/* <Col span={12} style={{marginTop: '20px'}}>
              {
                this.createAnalyseEle()
              }
            </Col> */}
          </Row>
        }
      </div>
    </Spin>)
  }
}
const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);
  useEffect(() => {
    if (editing) {
      // inputRef.current.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0,
        }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        {/* <Input ref={inputRef} onPressEnter={save} onBlur={save} /> */}
        <Select
          ref={inputRef}
          options={FIELD_TYPE}
          onChange={save}
        ></Select>
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{
          paddingRight: 24,
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};
const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};
export default UploadForm;