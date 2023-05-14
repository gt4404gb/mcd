import React from 'react';
import { Spin, Form, Row, Col, Button, Select, Input, Table, Space, message } from '@aurum/pfe-ui';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { getReportTemplateList } from '@/api/oap/report_upload.js';
import { UPLOAD_TYPE_LIST, REPORT_UPLOAD_TYPE } from '@/constants';
import { optionFilterProp } from "@/utils/store/func";

class List extends React.Component {
  constructor(props) {
    super(props);
    this.formScheduleRef = React.createRef();
    this.state = {
      isLoading: false,
      checkedValue: ['tableIndex', 'reportName', 'reportDesc', 'uploadTypeName', 'operation'],
      columns: [
        { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
        { title: "报告名称", dataIndex: 'reportName', fixed: 'left', width: 280 },
        { title: "说明", dataIndex: 'reportDesc', ellipsis: true, width: 160 },
        { title: "上传类型", dataIndex: 'uploadTypeName', ellipsis: true, width: 120 },
        {
          title: '操作',
          dataIndex: 'operation',
          fixed: 'right',
          width: 160,
          render: (text, record) => {
            return <Space size="middle" key={record.id}>
              <a onClick={() => this.linkToForm(record)}>上传</a>
            </Space>
          }
        }
      ],
      dataList: [],
      pageSize: 20,
      pageNo: 1,
      total: null,
      uploadTypeList: [
        { value: 'all', label: '全部' },
        ...UPLOAD_TYPE_LIST
      ],
      formData: {
        uploadType: 'all'
      }
    }
  }

  async componentDidMount () {
    await this.fetchDataList();
  }

  //获取查询列表
  fetchDataList = () => {
    let params = this.formScheduleRef.current.getFieldsValue();
    //去除‘全部’的id
    let arr = ['uploadType'], tempObj = { ...params };
    arr.forEach(key => {
      if (tempObj[key] == 'all') delete tempObj[key];
    })
    let commitParams = Object.assign({
      size: this.state.pageSize,
      page: this.state.pageNo - 1,
    }, tempObj);
    this.setState({
      isLoading: true,
      dataList: [],
    }, () => {
      getReportTemplateList(commitParams).then(res => {
        let dataList = res.data.items || [];
        dataList.forEach((item, index) => {
          item.tableIndex = (this.state.pageNo - 1) * this.state.pageSize + index + 1;
          if (item.uploadType) {
            item.uploadTypeName = optionFilterProp(UPLOAD_TYPE_LIST, 'value', item.uploadType)?.label || '';
          }
        })
        this.setState({
          dataList,
          total: res.data?.total,
        });
      }).catch(err => {
        err.msg && message.error(err.msg);
      }).finally(() => {
        this.setState({
          isLoading: false
        })
      })
    })
  }

  //重置查询条件
  onReset = () => {
    this.formScheduleRef.current.resetFields();
  }

  onPageChange = (pageNo, pageSize) => {
    this.setState({
      pageNo: pageNo,
      pageSize: pageSize
    }, () => {
      this.formScheduleRef.current.submit();
    });
  }

  linkToForm = (record) => {
    if (record.uploadType == REPORT_UPLOAD_TYPE.pageEmbedding) {
      window.open(record.url)
    } else {
      this.props.onCreate('edit', record)
    }
  }

  render () {
    const { isLoading, formData, uploadTypeList, columns, dataList } = this.state;
    return <Spin spinning={isLoading}>
      <div className="table-container">
        <Form
          className="search-form"
          ref={this.formScheduleRef}
          layout="vertical"
          size="middle"
          initialValues={formData}
          onFinish={this.fetchDataList}>
          <div className="search-area">
            <Row gutter={32}>
              <Col span={3}>
                <Form.Item name="templateName" label="报告名称">
                  <Input placeholder="查询报告名称" allowClear />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item name="uploadType" label="上传类型">
                  <Select placeholder="全部" allowClear options={uploadTypeList}></Select>
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询/刷新</Button>
                  <Button onClick={this.onReset}>重置</Button>
                </Space>
              </Col>
            </Row>
          </div>
        </Form>
        <div style={{ height: '12px', background: '#f6f6f6', position: 'relative' }}></div>
        <div className="table-top-wrap">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataList}
            allFilterColumns={this.state.checkedValue}
            tableKey="oapReportTemplate"
            pagination={{
              showQuickJumper: true,
              showSizeChanger: true,
              pageSize: this.state.pageSize,
              current: this.state.pageNo,
              total: this.state.total,
              onChange: (pageNo, pageSize) => this.onPageChange(pageNo, pageSize)
            }}
            scroll={{ x: '100%' }} />
        </div>
      </div>
    </Spin>
  }
}

export default List;