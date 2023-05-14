import React, {
  useImperativeHandle,
  forwardRef,
  useState,
  useRef,
  useEffect
} from "react";
import { Spin, Form, Row, Col, Button, Select, Input, Table, Tooltip, Space, Badge, Popconfirm, message, Modal } from "@aurum/pfe-ui";
import {
  getUploadDataWarehouseList,
  deleteUploadDataWarehouseItem,
} from '@/api/oap/upload_data.js';
import moment from 'moment';
import { checkMyPermission } from '@mcd/boss-common/dist/utils/common';
import { TABLE_TYPE_LIST } from '@/constants';
import ClipboardJS from 'clipboard';

const UPLOAD_TYPE = [
  { value: '', label: '全部' },
  ...TABLE_TYPE_LIST
]
const TASK_STATUS = [
  { value: '', label: '全部' },
  { value: '4', label: '解析中' },
  { value: '5', label: '解析失败' },
  { value: '2', label: '上传中' },
  { value: '3', label: '上传失败' },
  { value: '1', label: '上传成功' },
]
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
      title: '任务名称',
      dataIndex: 'taskName',
      fixed: 'left',
      width: 280,
      align: 'left',
      ellipsis: true,
      render: (text, record) => (
        // <Tooltip placement="topLeft" title={record.taskName}>
        //    <a onClick={() => linkToAnalysis(record)}>{record.taskName}</a>
        // </Tooltip>
        <span>{record.taskName}</span>
      )
    },
    { title: '说明', dataIndex: 'instruction', ellipsis: true, width: 160, align: 'left' },
    {
      title: '上传类型',
      dataIndex: 'taskType',
      ellipsis: true,
      width: 160,
      align: 'left',
      render: (text, record) => {
        return record.taskType > 1 ? '已有表' : '新建表';
      }
    },
    {
      title: '任务状态',
      dataIndex: 'status',
      ellipsis: true,
      width: 160,
      align: 'left',
      render: (text, record) => {
        let title_ = '--', statusStr = 'default';
        switch (record.status) {
          case 1:
            title_ = '上传成功';
            statusStr = 'success';
            break;
          case 2:
            title_ = '上传中';
            statusStr = 'processing';
            break;
          case 3:
            title_ = '上传失败';
            statusStr = 'error';
            break;
          case 4:
            title_ = '解析中';
            statusStr = 'processing';
            break;
          case 5:
            title_ = '解析失败';
            statusStr = 'error';
            break;
          default:
            title_ = '--';
            statusStr = 'default';
            break;
        }
        // <button class="btn" data-clipboard-text="Just because you can doesn't mean you should — clipboard.js">
        //     Copy to clipboard
        // </button>
        return <Tooltip placement="left" title={+record.status === 3 ? record.errorMessage : title_}>
          <Badge status={statusStr} />
          {+record.status === 3 ? <span className="error_upload_btn" style={{ color: '#4880ff', cursor: 'pointer' }} onClick={() => copyErrorMessage(record)}>{title_}</span> : +record.status === 5 ? <span style={{ color: '#4880ff', cursor: 'pointer' }} onClick={() => showTableCurrentInfo(record)}>{title_}</span> : <span>{title_}</span>}
        </Tooltip>
      }
    },
    { title: "创建人", dataIndex: 'createName', ellipsis: true, width: 160, align: 'left' },
    { title: "更新时间", dataIndex: 'lastModifyAt', ellipsis: true, width: 180, align: 'left' },
    {
      title: '操作',
      dataIndex: 'operation',
      fixed: 'right',
      width: 120,
      render: (text, record) => {
        let btnEle = null;
        if (+record.status === 5) {
          btnEle = <a onClick={() => linkToAnalysis(record)}>修改</a>
        }
        return (<Space size="middle" key={record.id}>
          {btnEle}
          {checkMyPermission('oap:hiveUpload:delete') ? <Popconfirm
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
  const tableErrorCol = [
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
      dataIndex: 'errMessage',
      fixed: 'left',
      width: 280,
      align: 'left',
    }
  ]
  const [isLoading, setLoading] = useState(false);
  const [isLoaded, setLoaded] = useState(false);
  const [filterOptions, setFilterOptions] = useState([]);
  const [checkedValue, setCheckedValue] = useState(['tableIndex', 'taskName', 'instruction', 'taskType', 'status', 'createName', 'lastModifyAt', 'operation']);
  const [defcolumns, setDefcolumns] = useState([]);
  const [columns, setColumns] = useState(tableCol);
  const [dataList, setDataList] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [analyseErrShow, setAnalyseErrShow] = useState(false);
  const [currentTableItem, setCurrentTableItem] = useState({});
  // const [errColumns, setErrColumns] = useState(tableErrorCol);
  const [errDataSource, setErrDataSource] = useState([]);
  // const [rowSelectList, setRowSelectList] = useState({type: 'checkbox', onChange: onSelectChange})

  const [tablePagenation, setTablePagenation] = useState({
    pageSize: 20,
    pageNo: 1,
    total: null,
  })
  const formRef = useRef();
  const copyBtnRef = useRef();
  const [errorTxt, setErrorTxt] = useState('gege');
  
  let curClipboard = null;
  useEffect(() => {
    if (copyBtnRef.current) {
      console.log('errorTxt = ', errorTxt);
      curClipboard = new ClipboardJS(copyBtnRef.current, {
        text: () => errorTxt
      })
      curClipboard.on('success', () => {
        console.log('success');
        curClipboard.destroy();
      });
      curClipboard.on('error', () => {
        console.log('error');
        curClipboard.destroy();
      });
      copyBtnRef.current.click();
    }
  }, [copyBtnRef, errorTxt]);
  useImperativeHandle(ref, () => ({
    fetchDataList
  }))
  const copyErrorMessage = (record) => {
    if (record.errorMessage) {
      setErrorTxt(record.errorMessage);
      message.success("复制成功！");
    }
  }
  const linkToAnalysis = (record) => {
    if (record.id) {
      props.onCreate('edit', record);
    }
    // props.onCreate('edit',record)
  }
  //单条数据删除
  const confirmDelete = (id) => {
    let list = [id];
    deleteUploadDataWarehouseItem(list).then(res => {
      res.msg == 'success' && message.success('删除成功');
      fetchDataList();
    })
  }

  // 批量删除
  const confirmDeleteMulti = () => {
    let list = [...selectedRowKeys];
    if (list.length > 0) {
      deleteUploadDataWarehouseItem(list).then(res => {
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
    console.log('1')
    getUploadDataWarehouseList(commitParams).then(res => {
      let records = res.data.items || [], dataList = [];
      dataList = records.map((item, index) => {
        return {
          ...item,
          lastModifyAt: moment(item.lastModifyAt).format('YYYY-MM-DD HH:mm:ss'),
          tableIndex: (tablePagenation.pageNo - 1) * tablePagenation.pageSize + index + 1,
        }
      })
      setDataList([...dataList]);
      setTablePagenation({
        ...tablePagenation,
        total: res.data.total,
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
    let _filterOptions = columns.map(it => ({
      label: it.title,
      value: it.dataIndex
    }))
    let _checkedValue = columns.map(it => it.dataIndex);
    setFilterOptions(() => [..._filterOptions]);
    setCheckedValue(() => [..._checkedValue]);
    console.log('cccc')
  }, []);

  const rowSelectList = {
    type: 'checkbox',
    onChange: onSelectChange
  }
  const showTableCurrentInfo = (record) => {
    if (+record.status === 5) {
      let list = record.errorColumnInfos?.map((item, index) => {
        return {
          columnName: item.columnName,
          columnType: item.columnType,
          errMessage: item.errMessage,
          tableIndex: index + 1,
        }
      }) || [];
      setCurrentTableItem({ ...record });
      setErrDataSource(list);
      setAnalyseErrShow(true);
    }
  }
  const resetCurrent = () => {
    setAnalyseErrShow(false);
    setCurrentTableItem({});
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
                <Form.Item name="taskName" label="名称">
                  <Input
                    placeholder="请输入查询名称"
                    allowClear />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item name="taskType" label="上传类型">
                  <Select
                    placeholder='请选择'
                    allowClear
                    options={UPLOAD_TYPE}></Select>
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item name="taskStatus" label="任务状态">
                  <Select
                    placeholder='请选择'
                    allowClear
                    options={TASK_STATUS}></Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={30}>
              <Col span={12}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { setTablePagenation({ ...tablePagenation, pageNo: 1 }); }}>查询/刷新</Button>
                  <Button onClick={onReset}>重置</Button>
                  {checkMyPermission('oap:hiveUpload:analyse') ? <Button onClick={onCreateFun}>新建任务</Button> : null}
                  {/* {checkMyPermission('oap:hiveUpload:delete') ? <Popconfirm 
                      placement="top" 
                      title="确认要删除吗？"
                      okText="确定"
                      cancelText="取消"
                      onConfirm={confirmDeleteMulti}>
                      <Button>批量删除</Button>
                    </Popconfirm>:null} */}
                </Space>
              </Col>
            </Row>
          </div>
        </Form>
        <div style={{ height: '12px', background: '#f6f6f6', position: 'relative', top: '4px' }}></div>
        <div ref={copyBtnRef}></div>
        <div className="table-top-wrap">
          <Table
            rowKey="id"
            tableKey="oapUploadHiveList"
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
      {/* 解析失败时，查看失败详情 */}
      <Modal
        width={800}
        title={currentTableItem.taskName || currentTableItem.tableName}
        visible={analyseErrShow}
        footer={[
          <Button key="close" type="primary" onClick={resetCurrent}>关闭</Button>
        ]}
        onCancel={resetCurrent}
      >
        <Table
          rowKey="tableIndex"
          tableKey="tableFailList"
          columns={tableErrorCol}
          dataSource={errDataSource}
        ></Table>
      </Modal>
    </Spin>
  )
})

export default Index;