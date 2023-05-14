import React, {
  useImperativeHandle,
  forwardRef,
  useState,
  useRef,
  useEffect
} from "react";
// import { Spin, Table, TableFilter,Tooltip,Space,Badge,Popconfirm,message } from "@mcd/portal-components";
import { Row, Col, Form, Button, Input, Spin, Table, Tooltip, Space, Badge, Popconfirm, message } from '@aurum/pfe-ui';
import {
  getTicketAnalysisList,
  deleteTicketAnalysisItem,
  // handleRefreshCkAnalysisTask,
  // handleCancelCkAnalysisTask
  refreshTaskForTicket,
  cancelTaskForTicket,
} from '@/api/oap/ticket_analysis.js';
import moment from 'moment';
import { checkMyPermission } from '@mcd/boss-common/dist/utils/common';

const Index = forwardRef((props, ref) => {
  console.log(props);
  const tableCol = [
    {
      title: '序号',
      dataIndex: 'tableIndex',
      fixed: 'left',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'sliceName',
      fixed: 'left',
      width: 280,
      align: 'left',
      ellipsis: true,
      render: (text, record) => (
        <Tooltip placement="topLeft" title={record.sliceName}>
          <a onClick={() => linkToAnalysis(record)}>{record.sliceName}</a>
        </Tooltip>
      )
    },
    { title: "业务域", dataIndex: 'datasourceName', ellipsis: true, width: 160, align: 'left' },
    // {
    //   title: '表类型',
    //   dataIndex: 'tableType',
    //   ellipsis: true,
    //   width: 160,
    //   align: 'left',
    //   render: (text, record) => (<>{text === 0 ? 'ClickHouse': 'Kylin'}</>),
    // },
    {
      title: "状态",
      dataIndex: 'queryStatus',
      ellipsis: true,
      width: 160,
      align: 'left',
      render: (text, record) => (
        <Tooltip placement="topLeft" title={record.queryStatus}>
          <Badge status={record.queryStatus && record.queryStatus.toLowerCase() == 'finish' ? 'success' : 'error'} text={record.queryStatus} />
        </Tooltip>
      )
    },
    { title: "进度", dataIndex: 'queryProcess', ellipsis: true, width: 160, align: 'left' },
    { title: "创建人", dataIndex: 'createName', ellipsis: true, width: 160, align: 'left' },
    { title: "更新时间", dataIndex: 'lastModifyAt', ellipsis: true, width: 180, align: 'left' },
    {
      title: '操作',
      dataIndex: 'operation',
      fixed: 'right',
      width: 120,
      render: (text, record) => {
        let btnEle = null;
        let statusStr = record.queryStatus.toLowerCase();
        if (['finish', 'cancel'].includes(statusStr)) {
          btnEle = checkMyPermission('oap:ticketAnalysis:refresh') ? (<Popconfirm
            title='确认要刷新吗？'
            okText="确定"
            cancelText="取消"
            onConfirm={() => confirmRefresh(record.id)}>
            <a href="#">刷新</a>
          </Popconfirm>) : null;
        }
        if (['waiting', 'processing'].includes(statusStr)) {
          btnEle = checkMyPermission('oap:ticketAnalysis:cancel') ? (<Popconfirm
            title='确认要取消吗？'
            okText="确定"
            cancelText="取消"
            onConfirm={() => confirmCancel(record.id)}>
            <a href="#">取消</a>
          </Popconfirm>) : null;
        }
        return (<Space size="middle" key={record.id}>
          {btnEle}
          {checkMyPermission('oap:ticketAnalysis:deleteSlice') ? <Popconfirm
            title="确认要删除吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => confirmDelete(record.id)}>
            <a href="#">删除</a>
          </Popconfirm> : null}
        </Space>)
      }
    }
  ]
  const [isLoading, setLoading] = useState(false);
  const [isLoaded, setLoaded] = useState(false);
  const [filterOptions, setFilterOptions] = useState([]);
  const [checkedValue, setCheckedValue] = useState(['tableIndex', 'sliceName', 'datasourceName', 'queryStatus', 'queryProcess', 'createName', 'lastModifyAt', 'operation']);
  const [defcolumns, setDefcolumns] = useState([]);
  const [columns, setColumns] = useState(tableCol);
  const [dataList, setDataList] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  // const [rowSelectList, setRowSelectList] = useState({type: 'checkbox', onChange: onSelectChange})

  const [tablePagenation, setTablePagenation] = useState({
    pageSize: 20,
    pageNo: 1,
    total: null,
  })
  const formRef = useRef();
  useImperativeHandle(ref, () => ({
    fetchDataList
  }))
  const linkToAnalysis = (record) => {
    props.onCreate('edit', record)
  }
  const confirmRefresh = (id) => {
    refreshTaskForTicket(id).then(res => {
      res.msg == 'success' && message.success('刷新成功');
      fetchDataList();
    }).catch((err) => {
      message.error(err.msg);
    })
  }
  const confirmCancel = (id) => {
    cancelTaskForTicket(id).then(res => {
      res.msg == 'success' && message.success('取消成功');
      fetchDataList();
    }).catch((err) => {
      message.error(err.msg);
    })
  }
  //单条数据删除
  const confirmDelete = (id) => {
    let list = [id];
    deleteTicketAnalysisItem(list).then(res => {
      res.msg == 'success' && message.success('删除成功');
      fetchDataList();
    })
  }

  // 批量删除
  const confirmDeleteMulti = () => {
    let list = [...selectedRowKeys];
    if (list.length > 0) {
      deleteTicketAnalysisItem(list).then(res => {
        res.msg == 'success' && message.success('删除成功');
        fetchDataList();
      })
    } else {
      message.warning('请勾选需要删除的选项！')
    }
  }
  const onSelectChange = (selectedRowKeys) => {
    console.log('1 = ', selectedRowKeys);
    setSelectedRowKeys(selectedRowKeys);
  }
  const fetchDataList = () => {
    let params = formRef.current.getFieldsValue();
    let commitParams = Object.assign({
      size: tablePagenation.pageSize,
      page: tablePagenation.pageNo - 1
    }, params);
    setLoading(true);
    setDataList([]);
    getTicketAnalysisList(commitParams).then(res => {
      let records = res.data.records || [], dataList = [];
      dataList = records.map((item, index) => {
        return {
          ...item,
          lastModifyAt: moment(item.lastModifyAt).format('YYYY-MM-DD HH:mm:ss'),
          tableIndex: (tablePagenation.pageNo - 1) * tablePagenation.pageSize + index + 1,
          queryProcess: item.queueIndex == 0 ? `${item.queryProcess}%` : (item.queueIndex > 0 ? `正在队列中，第${item.queueIndex}位` : '入队等待中')
        }
      })
      setDataList([...dataList]);
      setTablePagenation({
        ...tablePagenation,
        total: res.data.page.totalElements,
      })
    }).catch((err) => {
      console.log(400, err);
    }).finally(() => {
      setLoading(false);
      setLoaded(true);
      // const data = localStorage.getItem(getTableKey('oapTicketList'));
      // const _checkedValue = data ? JSON.parse(data) : checkedValue;
      // onFilterChange(_checkedValue);
    })
    console.log('2')
    console.log('3')
  }
  const onFilterChange = (checkedValue) => {
    let _columns = defcolumns.filter(it => checkedValue.includes(it.dataIndex));
    setColumns(() => [..._columns]);
    setCheckedValue(() => [...checkedValue]);
  }
  const resetColumns = () => {
    // this.setState({
    //   columns: this.state.defcolumns,
    //   checkedValue: this.state.filterOptions.map((it) => it.value)
    // })
    setColumns(() => [...defcolumns]);
    setCheckedValue(() => [...filterOptions.map((it) => it.value)]);
  }
  //重置查询条件
  const onReset = () => {
    formRef.current.resetFields();
  }
  const onCreateFun = () => {
    props.onCreate('create', {})
  }
  const onPageChange = (pageNo, pageSize) => {
    // this.setState({
    //     pageNo: pageNo,
    //     pageSize: pageSize
    // }, () => {
    //     this.formRef.current.submit();
    // });
    setTablePagenation((preState) => ({
      ...preState,
      pageNo: pageNo,
      pageSize: pageSize,
    }))
    formRef.current.submit();
  }

  useEffect(() => {
    console.log('a')
    fetchDataList();
    setDefcolumns(columns);
    // let _filterOptions = columns.map(it => ({
    //   label: it.title,
    //   value: it.dataIndex
    // }))
    let _filterOptions = columns.map(it => it.value)
    let _checkedValue = columns.map(it => it.dataIndex);
    console.log('_filterOptions = ', _filterOptions);
    console.log('_checkedValue = ', _checkedValue);
    setFilterOptions(() => [..._filterOptions]);
    setCheckedValue(() => [..._checkedValue]);
    console.log('cccc')
  }, []);

  const rowSelectList = {
    type: 'checkbox',
    onChange: onSelectChange
  }
  return (
    <Spin spinning={isLoading}>
      <div className="table-container">
        <Form
          className="search-form"
          ref={formRef}
          layout="vertical"
          size="middle"
          onFinish={fetchDataList}
        >
          <div className="search-area">
            <Row gutter={32}>
              <Col span={3}>
                <Form.Item name="sliceName" label="名称">
                  <Input
                    placeholder="请输入查询名称"
                    allowClear />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={12}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { setTablePagenation({ ...tablePagenation, pageNo: 1 }); }}>查询/刷新</Button>
                  <Button onClick={onReset}>重置</Button>
                  {checkMyPermission('oap:ticketAnalysis:saveChart') ? <Button onClick={onCreateFun}>创建分析</Button> : null}
                  {checkMyPermission('oap:ticketAnalysis:deleteSlice') ? <Popconfirm
                    placement="top"
                    title="确认要删除吗？"
                    okText="确定"
                    cancelText="取消"
                    onConfirm={confirmDeleteMulti}>
                    <Button>批量删除</Button>
                  </Popconfirm> : null}
                </Space>
              </Col>
            </Row>
          </div>
        </Form>
        <div style={{ height: '12px', background: '#f6f6f6', position: 'relative', top: '4px' }}></div>
        <div className="table-top-wrap">
          <Table
            rowKey="id"
            tableKey="oapTicketList"
            columns={columns}
            dataSource={dataList}
            rowSelection={rowSelectList}
            allFilterColumns={checkedValue}
            pagination={{
              showQuickJumper: true,
              showSizeChanger: true,
              pageSize: tablePagenation.pageSize,
              current: tablePagenation.pageNo,
              total: tablePagenation.total,
              onChange: (pageNo, pageSize) => onPageChange(pageNo, pageSize)
            }}
            scroll={{ x: '100%' }} />
        </div>
      </div>
    </Spin>
  )
})

export default Index;