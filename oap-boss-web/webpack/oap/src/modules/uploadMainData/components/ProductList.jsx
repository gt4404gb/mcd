import React, {
  useImperativeHandle,
  forwardRef,
  useState,
  useRef,
  useEffect
} from "react";
import { Spin, Form, Row, Col, Button, Select, Input, Table, Tooltip, Space, Badge, Popconfirm, message } from "@aurum/pfe-ui";
// import { 
//   getUploadDataWarehouseList,
//   deleteUploadDataWarehouseItem,
// } from '@/api/oap/upload_data.js';
import {
  getUploadMainDataList,
  uploadMainDataFile,
} from '@/api/oap/upload_main.js';
import { downloadFile } from '@/api/oap/commonApi.js';
import moment from 'moment';
import { checkMyPermission } from '@mcd/boss-common/dist/utils/common';

const statusWords = {
  1: 'Completed',
  2: 'Processing',
  3: 'Error',
}
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
      title: '文件名称',
      dataIndex: 'fileName',
      fixed: 'left',
      width: 280,
      align: 'left',
      ellipsis: true,
      render: (text, record) => (
        <span>{record.fileName}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'uploadStatus',
      ellipsis: true,
      width: 100,
      align: 'left',
      render: (text, record) => (
        <span>{statusWords[record.uploadStatus]}</span>
      )
    },
    { title: "更新时间", dataIndex: 'lastModifyAt', ellipsis: true, width: 180, align: 'left' },
    {
      title: '操作',
      dataIndex: 'operation',
      fixed: 'right',
      width: 120,
      render: (text, record) => {
        let btnEle = null;
        return (<Space size="middle" key={record.id}>
          {/* {checkMyPermission('oap:hiveUpload:delete') ? <Popconfirm 
            title="确认要删除吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => confirmDelete(record.id)}>
            <a href="#">删除</a>
          </Popconfirm>: null} */}
          {(checkMyPermission('oap:index:files') && (+record.uploadStatus === 1 || +record.uploadStatus === 3)) ? <a onClick={() => productMainDataDownload(record)}>下载</a> : null}
        </Space>)
      }
    }
  ]
  const fileInput = useRef();
  const [isLoading, setLoading] = useState(false);
  const [checkedValue, setCheckedValue] = useState(['tableIndex', 'taskName', 'instruction', 'taskType', 'status', 'createName', 'lastModifyAt', 'operation']);
  const [columns, setColumns] = useState(tableCol);
  const [dataList, setDataList] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isProtect, setIsProtect] = useState(false);
  const [tablePagenation, setTablePagenation] = useState({
    pageSize: 20,
    pageNo: 1,
    total: null,
  })
  const formRef = useRef();
  useImperativeHandle(ref, () => ({
    fetchDataList
  }))
  //单条数据删除
  const productMainDataDownload = (record) => {
    if (!record.fileId) {
      return false;
    }
    setLoading(true);
    downloadFile(record.fileId).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data.fileBlob], { type: 'application/octet-stream' }))
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      let downName = res.data.fileName.replace(/"|'/g, '');
      link.setAttribute('download', downName);
      document.body.appendChild(link)
      link.click();
      document.body.removeChild(link);
      setLoading(false);
    }).catch(err => {
      message.error('下载失败');
    }).finally(() => {
      setLoading(false);
    })
  }

  const onSelectChange = (selectedRowKeys) => {
    setSelectedRowKeys(selectedRowKeys);
  }
  const fetchDataList = (pagenation = tablePagenation) => {
    let params = {}; // formRef.current.getFieldsValue();
    let commitParams = Object.assign({
      size: pagenation.pageSize,
      page: pagenation.pageNo - 1
    }, params);
    setLoading(true);
    setDataList([]);
    getUploadMainDataList(commitParams).then(res => {
      console.log('res = ', res);
      let records = res.data.items || [], dataList = [];
      dataList = records.map((item, index) => {
        return {
          ...item,
          lastModifyAt: moment(item.lastModifyAt).format('YYYY-MM-DD HH:mm:ss'),
          tableIndex: (pagenation.pageNo - 1) * pagenation.pageSize + index + 1,
        }
      })
      setDataList([...dataList]);
      setTablePagenation({
        ...pagenation,
        total: res.data.total,
      })
    }).catch((err) => {
      console.log(400, err);
    }).finally(() => {
      setLoading(false);
    })
  }
  //重置查询条件
  const onReset = () => {
    formRef.current.resetFields();
  }
  // 上传文件
  const handleSelectFile = () => {
    let result = calculateTime();
    if (!result) {
      fileInput.current.value = null;
      fileInput.current.click();
    }
  }
  //上传
  const handleFileChange = (ev) => {
    const files = ev.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    // const fileTypes = ['text/csv', 'application/vnd.ms-excel'];
    const fileTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!fileTypes.includes(file.type)) {
      message.warning('请选择excel格式的文件');
      return false;
    }
    setLoading(true);
    uploadMainDataFile('OAP_CSV', file).then(res => {
      res.msg == 'success' && message.success('上传成功');
    }).catch((err) => {
      console.log('err = ', err);
      err && message.error(err.msg || err);
    }).finally(() => {
      fetchDataList(tablePagenation);
      setLoading(false);
    })
  }
  const onPageChange = (pageNo, pageSize) => {
    setTablePagenation((preState) => ({
      ...preState,
      pageNo: pageNo,
      pageSize: pageSize,
    }))
    fetchDataList({
      ...tablePagenation,
      pageNo: pageNo,
      pageSize: pageSize,
    });
    // formRef.current.submit();
  }

  useEffect(() => {
    fetchDataList(tablePagenation);
    let _checkedValue = columns.map(it => it.dataIndex);
    setCheckedValue(() => [..._checkedValue]);
    calculateTime();
  }, []);
  const refreshList = () => {
    setTablePagenation((preState) => ({
      ...preState,
      pageNo: 1,
      pageSize: 20,
    }))
    fetchDataList({
      ...tablePagenation,
      pageNo: 1,
      pageSize: 20,
    });
  }
  const rowSelectList = {
    type: 'checkbox',
    onChange: onSelectChange
  }
  const dateFormat = 'YYYY-MM-DD HH:mm:ss';
  const calculateTime = () => {
    let result = false;
    let toDay = moment(Date.now()).format(dateFormat);
    console.log('toDay = ', toDay);
    let toDayHour = toDay.split(' ').pop().split(':').shift();
    if (toDayHour >= 23) {
      console.log('维护中...')
      setIsProtect(true);
      result = true;
    } else {
      console.log('正常运行中...')
      setIsProtect(false);
    }
    return result;
  }
  return (
    <Spin spinning={isLoading}>
      <div className="table-container">
        {/* <Form 
          className="search-form"
          ref={formRef}
          layout="vertical"
          size="middle"
          onFinish={fetchDataList}
          >
            <div className="search-area">
              <Row gutter={12}>
                <Col span={3}>
                  <Form.Item name="taskName" label='产品名称'>
                    <Input
                      placeholder="请输入查询名称"
                      allowClear/>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={isLoading} onClick={()=>{setTablePagenation({...tablePagenation,pageNo: 1});}}>查询/刷新</Button>
                    <Button onClick={onReset}>重置</Button>
                    {checkMyPermission('oap:hiveUpload:analyse') ? (<><Button onClick={ handleSelectFile}>上传数据</Button><input type="file" style={{display:'none'}} ref={fileInput} onChange={handleFileChange} /></>):null}
                  </Space>
                </Col>
              </Row>
            </div>
        </Form> */}
        <div style={{ background: '#fff', padding: '16px 16px 4px 16px' }}>
          <Row gutter={12}>
            <Col span={12}>
              <Space>
                {checkMyPermission('oap:product:upload') ? (<>
                  <Button disabled={isProtect} type="primary" onClick={handleSelectFile}>上传文件</Button>
                  <input type="file" style={{ display: 'none' }} ref={fileInput} onChange={handleFileChange} />
                  <Button onClick={refreshList}>刷新</Button>
                </>) : null}
              </Space>
            </Col>
            <Col span={12}>
              <span style={{ display: 'inline-block', marginTop: 10, height: '24px', lineHeight: '24px', color: '#999' }}>{isProtect ? '数据正在更新中，每日23点-24点暂停上传' : '上传数据每日23点自动更新至数仓'}</span>
            </Col>
          </Row>
        </div>
        <div className="table-top-wrap">
          <Table
            rowKey="id"
            tableKey="oapUploadMainDataList"
            columns={columns}
            dataSource={dataList}
            // rowSelection={rowSelectList}
            allFilterColumns={checkedValue}
            pagination={{
              showQuickJumper: true,
              showSizeChanger: true,
              pageSize: tablePagenation.pageSize,
              current: tablePagenation.pageNo,
              total: tablePagenation.total,
              onChange: (pageNo, pageSize) => onPageChange(pageNo, pageSize)
            }}
            scroll={{ x: '100%' }}
          />
        </div>
      </div>
    </Spin>
  )
})

export default Index;