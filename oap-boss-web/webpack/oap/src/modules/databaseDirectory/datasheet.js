import React from 'react';
import { Spin, Form, Row, Col, Button, Input, Table, message, Select, Space, Popconfirm } from '@aurum/pfe-ui';
import { AUTH_STATUS_LIST, APPLY_STATUS_LIST, READ_WRITE_PERMISSION, AUTH_STATUS, APPLY_STATUS } from '@/constants';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { queryDatasheetList, refreshDatasheetList, syncDatabaseInfo } from '@/api/oap/database';
import { optionFilterProp } from "@/utils/store/func";
import querystring from "query-string";

export default class Datasheet extends React.Component {
  constructor(props) {
    super(props);
    this.formDatasheetRef = React.createRef();
    this.state = {
      isLoading: false,
      modelList: [],
      checkedValue: ['tableIndex', 'dateBaseName', 'tableName', 'tableComment', 'authStatusName', 'authStatusPowerName', 'applyStatusName', 'operation'],
      defcolumns: [],
      columns: [
        { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 60 },
        { title: "库名", dataIndex: 'databaseName', ellipsis: true, width: 120 },
        { title: "表名", dataIndex: 'tableName', ellipsis: true, width: 180 },
        // { title: "中文描述", dataIndex: 'tableComment', ellipsis: true, width: 160 },
        {
          title: "权限状态",
          dataIndex: 'authStatusName',
          ellipsis: true,
          width: 100,
          render: (text, record) => {
            const color = record.authStatus == AUTH_STATUS.havePermission ? '#32cd32' : (record.authStatus == AUTH_STATUS.syncFailed ? 'red' : '')
            return <span key={record.id} style={{ color: color }}>{text}</span>
          }
        },
        { title: "具体权限", dataIndex: 'authStatusPowerName', ellipsis: true, width: 100 },
        {
          title: "审批状态",
          dataIndex: 'applyStatusName',
          ellipsis: true,
          width: 100,
          render: (text, record) => {
            if (!checkMyPermission('oap:applyHive:save')) return '';
            if (record.applyStatus === APPLY_STATUS.stateless && (record?.mainId ?? '') === '') {
              return <a key={record.id} style={{ fontSize: '12px' }}>{text}</a>
            }
            return <a key={record.id} style={{ fontSize: '12px' }} onClick={() => this.linkToApply('form', record)}>{text}</a>
          }
        },
        {
          title: "操作",
          dataIndex: 'operation',
          fixed: 'right',
          width: 100,
          render: (text, record) => {
            return <Space key={record.id}>
              {checkMyPermission('oap:applyHive:fieldList') && <a onClick={() => this.gotoDatafieldPage(record)}>查看字段</a>}
              {record.authStatus == AUTH_STATUS.syncFailed && checkMyPermission('oap:applyHive:sync') ? <Popconfirm
                title="是否确定重新同步？"
                okText="确定"
                cancelText="取消"
                onConfirm={() => this.confirmSync(record?.mainId)}>
                <a href="#">重新同步</a>
              </Popconfirm> : null}
            </Space>
          }
        }
      ],
      dataList: [],
      pageSize: 10,
      pageNo: 1,
      total: null,
      formData: {
        authStatus: 'all',
        authStatusPower: 'none',
        applyStatus: 'all'
      },
      authStatusPowerList: [
        { label: '全部', value: 'none' },
        ...READ_WRITE_PERMISSION
      ]
    }
  }

  async componentDidMount () {
    await this.fetchDataList();
  }

  onReset = () => {
    this.formDatasheetRef.current.resetFields();
  }

  onPageChange = (pageNo, pageSize) => {
    this.setState({
      pageNo: pageNo,
      pageSize: pageSize
    }, () => {
      this.formDatasheetRef.current.submit();
    });
  }

  //获取查询列表
  fetchDataList = () => {
    let params = this.formDatasheetRef.current.getFieldsValue();
    //去除‘全部’的id
    let arr = ['authStatus', 'applyStatus'], tempObj = { ...params };
    arr.forEach(key => {
      if (tempObj[key] == 'all') delete tempObj[key];
    })
    if (tempObj['authStatusPower'] == 'none') delete tempObj['authStatusPower'];
    let baseInfo = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapDatabaseInfo'))) || {};
    let commitParams = Object.assign({
      size: this.state.pageSize,
      page: this.state.pageNo - 1,
      dateBaseName: baseInfo?.databaseName,
    }, tempObj);
    this.setState({
      isLoading: true,
      dataList: [],
    }, () => {
      queryDatasheetList(commitParams).then(res => {
        let dataList = res.data.items || [];
        dataList.forEach((item, index) => {
          if ((item?.authStatus ?? '') !== '') {
            item.authStatusName = optionFilterProp(AUTH_STATUS_LIST, 'value', item.authStatus)?.label || '';
          }
          if ((item?.authStatusPower ?? '') !== '') {
            item.authStatusPowerName = optionFilterProp(this.state.authStatusPowerList, 'value', item.authStatusPower)?.label || '';
          }
          if ((item?.applyStatus ?? '') !== '') {
            if (item.applyStatus == 9 && (item?.mainId ?? '') !== '') {
              item.applyStatusName = optionFilterProp(APPLY_STATUS_LIST, 'value', 10)?.label || '';
            } else {
              item.applyStatusName = optionFilterProp(APPLY_STATUS_LIST, 'value', item.applyStatus)?.label || '';
            }
          }
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

  gotoDatafieldPage = (record) => {
    let baseInfo = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapDatabaseInfo'))) || {};
    sessionStorage.setItem('oapDatabaseInfo', encodeURIComponent(JSON.stringify({ ...baseInfo, tableName: record.tableName })))
    this.props.history.push({
      pathname: '/oap/datafield',
      search: querystring.stringify({ id: record.id })
    });
  }

  goBack = () => {
    this.props.history.go(-1);
  }

  linkToApply = (flag, record = {}) => {
    if (flag == 'createOthers') {
      this.props.history.push({
        pathname: '/oap/database/apply-create',
        search: querystring.stringify({ isOthers: true })
      });
    } else if (flag == 'createSelf') {
      this.props.history.push({
        pathname: '/oap/database/apply-create'
      });
    } else if (flag == 'form') {
      this.props.history.push({
        pathname: '/oap/database/apply-form',
        search: querystring.stringify({ id: record?.mainId })
      });
    }
  }

  refresh = () => {
    let baseInfo = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapDatabaseInfo'))) || {};
    this.setState({
      isLoading: true,
      dataList: [],
    }, () => {
      refreshDatasheetList({ dateBaseName: baseInfo?.databaseName }).then(res => {
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

  //重新同步
  confirmSync = (mainId) => {
    this.setState({
      isLoading: true,
      dataList: [],
    }, () => {
      syncDatabaseInfo({ mainId }).then(res => {
        res.msg == 'success' && message.success('同步成功');
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
    const { isLoading, formData } = this.state;
    return <Spin spinning={isLoading}>
      <div className="table-container">
        <Form
          className="search-form"
          ref={this.formDatasheetRef}
          layout="vertical"
          size="middle"
          initialValues={formData}
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
              <Col span={3}>
                <Form.Item name="authStatus" label="权限状态">
                  <Select placeholder="全部" allowClear>
                    {AUTH_STATUS_LIST.map(model => {
                      return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
                    })}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item name="authStatusPower" label="具体权限">
                  <Select placeholder="全部" allowClear>
                    {this.state.authStatusPowerList.map(model => {
                      return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
                    })}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item name="applyStatus" label="审批状态">
                  <Select placeholder="全部" allowClear>
                    {APPLY_STATUS_LIST.map(model => {
                      return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
                    })}
                  </Select>
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
              {checkMyPermission('oap:applyHive:save') ? <Button type="primary" onClick={() => this.linkToApply('createSelf')}>申请</Button> : null}
              {checkMyPermission('oap:applyHive:save') ? <Button onClick={() => this.linkToApply('createOthers')}>为供应商申请</Button> : null}
              {checkMyPermission('oap:applyHive:tableRefresh') ? <Button onClick={this.refresh}>刷新列表</Button> : null}
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