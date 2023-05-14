import React from 'react';
import { Spin, Form, Row, Col, Button, Input, Table, message, Select, Space } from '@aurum/pfe-ui';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { queryDatafieldList, refreshDatafieldList } from '@/api/oap/database';

export default class Datasheet extends React.Component {
  constructor(props) {
    super(props);
    this.formDatafieldRef = React.createRef();
    this.state = {
      isLoading: false,
      modelList: [],
      checkedValue: ['tableIndex', 'fieldName', 'fieldComment', 'fieldType'],
      defcolumns: [],
      columns: [
        { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 60 },
        { title: "字段名", dataIndex: 'fieldName', ellipsis: true, fixed: 'left', width: 140 },
        { title: "中文描述", dataIndex: 'fieldComment', ellipsis: true, width: 160 },
        { title: "字段类型", dataIndex: 'fieldType', ellipsis: true, width: 100 },
      ],
      dataList: [],
      pageSize: 10,
      pageNo: 1,
      total: null,
    }
  }

  async componentDidMount () {
    await this.fetchDataList();
  }

  onReset = () => {
    this.formDatafieldRef.current.resetFields();
  }

  onPageChange = (pageNo, pageSize) => {
    this.setState({
      pageNo: pageNo,
      pageSize: pageSize
    }, () => {
      this.formDatafieldRef.current.submit();
    });
  }

  //获取查询列表
  fetchDataList = () => {
    let params = this.formDatafieldRef.current.getFieldsValue();
    let baseInfo = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapDatabaseInfo'))) || {};
    let commitParams = Object.assign({
      size: this.state.pageSize,
      page: this.state.pageNo - 1,
      dateBaseName: baseInfo?.databaseName,
      tableName: baseInfo?.tableName,
    }, params);
    this.setState({
      isLoading: true,
      dataList: [],
    }, () => {
      queryDatafieldList(commitParams).then(res => {
        let dataList = res.data.items || [];
        dataList.forEach((item, index) => {
          item.tableIndex = (this.state.pageNo - 1) * this.state.pageSize + index + 1;
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

  gotoDatafieldsPage = (record) => {
    this.props.history.push({
      pathname: `/oap/datafields?id=${record.id}`,
    });
  }

  goBack = () => {
    this.props.history.go(-1);
  }

  refresh = () => {
    let baseInfo = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapDatabaseInfo'))) || {};
    this.setState({
      isLoading: true,
      dataList: [],
    }, () => {
      refreshDatafieldList({ dateBaseName: baseInfo?.databaseName, tableName: baseInfo?.tableName }).then(res => {
        res.msg == 'success' && message.success('刷新成功');
        this.fetchDataList();
      }).catch(err => {
        err.msg && message.error(err.msg);
      }).finally(() => {
        this.setState({
          isLoading: false
        })
      })
    })
  }

  render () {
    const { isLoading } = this.state;
    return <Spin spinning={isLoading}>
      <div className="table-container">
        <Form
          className="search-form"
          ref={this.formDatafieldRef}
          layout="vertical"
          size="middle"
          onFinish={this.fetchDataList}>
          <div className="search-area">
            <Row gutter={32}>
              <Col span={3}>
                <Form.Item name="name" label="关键词">
                  <Input
                    placeholder="请输入关键词"
                    allowClear />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询</Button>
                  <Button onClick={this.onReset}>重置</Button>
                  <Button onClick={this.goBack}>返回</Button>
                </Space>
              </Col>
            </Row>
          </div>
        </Form>
        <div className="table-top-wrap" style={{ paddingTop: '32px' }}>
          <div className="table-top-btn">
            <Space>
              {checkMyPermission('oap:applyHive:fieldRefresh') ? <Button onClick={this.refresh}>刷新列表</Button> : null}
            </Space>
          </div>
          <Table
            rowKey="id"
            columns={this.state.columns}
            dataSource={this.state.dataList}
            allFilterColumns={this.state.checkedValue}
            tableKey="oapDatasheet"
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