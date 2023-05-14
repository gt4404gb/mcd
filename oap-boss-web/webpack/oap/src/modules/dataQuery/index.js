import React from 'react';
import { Spin, Table, message } from '@aurum/pfe-ui';
import { queryBieeLdwList } from '@/api/oap/guide_analysis.js';

export default class DataQuery extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      dataList: [],
      columns: [
        { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
        {
          title: "查询类型",
          dataIndex: 'reportName',
          ellipsis: true,
          width: 280,
          render: (text, record) => (<a key={record.id} onClick={() => this.link(record)}>{text}</a>)
        },
        {
          title: '操作',
          dataIndex: 'operation',
          fixed: 'right',
          width: 100,
          render: (text, record) => (<a key={record.id} onClick={() => this.link(record)}>查看</a>)
        }
      ]
    }
  }

  async componentDidMount () {
    await this.fetchDataList();
  }

  fetchDataList = () => {
    this.setState({
      isLoading: true,
      dataList: [],
    }, () => {
      queryBieeLdwList().then(res => {
        let dataList = res.data || [];
        dataList.forEach((item, index) => {
          item.tableIndex = index + 1;
        })
        this.setState({ dataList })
      }).catch((err) => {
        err.msg && message.error(err.msg);
      }).finally(() => {
        this.setState({ isLoading: false })
      })
    })
  }

  link = (record) => {
    const params = {
      tabNameZh: record.reportName,
      tabNameEn: record.reportName,
      path: `/oap/data_query_detail?id=${record.id}`,
    };
    window.EventBus && window.EventBus.emit("setAppTab", null, params);
    this.props.history.push({
      pathname: `/oap/data_query_detail?id=${record.id}`
    });
    sessionStorage.setItem('oapDataQueryInfo', encodeURIComponent(JSON.stringify({ ssoReportUrl: record.ssoReportUrl, id: record.id, reportName: record.reportName })))
  }

  render () {
    return <Spin spinning={this.state.isLoading}>
      <div className="table-container">
        <div className="table-top-wrap" style={{ paddingBottom: '16px' }}>
          <Table
            rowKey="id"
            columns={this.state.columns}
            dataSource={this.state.dataList}
            tableKey="oapDataQuery"
            pagination={{ position: ['none'], pageSize: 100000 }}
            scroll={{ x: '100%' }} />
        </div>
      </div>
    </Spin>
  }
}