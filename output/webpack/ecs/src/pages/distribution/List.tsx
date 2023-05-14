import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Select, DatePicker, Table, Row, Col, Input, Button, Empty, Pagination, Modal, Space, IconFont, Radio } from '@aurum/pfe-ui';
import '@/assets/styles/distribution/list.less'
import TableCell from '@/pages/distribution/TableCell'

const initSearchObj: any = {
  spuId: '', // 活动编号（精准查询）
  spuName: '',//活动名称
  startDate: '',
  endDate: '',
  store: '',
  provinceCode: '', //省编码
  cityCode: '',  //市编码
  countyCode: '',//区编码
  storeCode: '',
  pageNum: 1,
  pageSize: 50,
  dateRange: [],
}

export default (() => {
  const { Search } = Input;
  const [paginationTotal, setPaginationTotal] = useState(50);
  const [searchTemplate, setSearchTemplate] = useState("");
  const [templateListData, setTemplateListData] = useState([]);
  const [searchObj, setSearchObj]: any = useState(initSearchObj);
  useEffect(() => {
    (async () => {
      setTemplateListData([]);
      setPaginationTotal(50)
    })()
  }, [])
  const onSearch = (value: string) => {
    const setV = value.trim();
    if (setV.length > 0) {
      setSearchTemplate(setV)
    }
  }
  const mockData = {
    name: '按重量计算',
    lasModify: '2021-06-30',
    freightInformation: [
      {
        'DISTRIBUTIONAREA': '可配送区域',
        'FIRSTARTICLE': '首件（个）',
        'CONTINUATION': '续件（个）',
        'FREIGHT': '运费（元）',
        'RENEW': '续费（元）'
      }, {
        'DISTRIBUTIONAREA': '江苏南京',
        'FIRSTARTICLE': '1',
        'CONTINUATION': '2',
        'FREIGHT': '5',
        'RENEW': '12'
      }]
  }
  const mockData1 = {
    name: '按件数计算',
    lasModify: '2021-06-30',
    freightInformation: [{
      'DISTRIBUTIONAREA': '可配送区域',
      'FIRSTARTICLE': '首件（个）',
      'CONTINUATION': '续件（个）',
      'FREIGHT': '运费（元）',
      'RENEW': '续费（元）'
    }, {
      'DISTRIBUTIONAREA': '江苏无锡',
      'FIRSTARTICLE': '10',
      'CONTINUATION': '2',
      'FREIGHT': '52',
      'RENEW': '12'
    },]
  }
  const cells = [mockData, mockData1];
  const getCurrentData = (page: number, pageSize: any) => {
    console.warn({ page, pageSize })
  }
  const [form] = Form.useForm();
  return (
    <div className="distribution-list table-container">
      <Form layout="vertical"
        form={form}
        className="search-form"
        initialValues={searchObj}
        onFinish={(values: any) => {

        }}
        onValuesChange={(values: any) => {
        }}
      >
        <div className="search-area">
          <Row gutter={32}>
            <Col span={3}>
              <Form.Item name='store' label={$t('运费模板')} >
                <Input.Search
                  placeholder="按运费模版名称进行查找"
                  onSearch={onSearch}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={32}>
            <Col span={6}>
              <Space size='xs'>
                <Button type="primary" htmlType="submit">查询</Button>
                <Button htmlType="reset" onClick={(it: any) => {
                  setSearchObj(initSearchObj);
                }}>重置</Button>
              </Space>
            </Col>
          </Row>
        </div>
      </Form>

      {/* <div className="table-top-wrap" >
        <Table
          scroll={{ x: '100%' }}
          tableLayout="fixed"
          columns={defaultColumns}
          dataSource={activityRows}
          rowKey = 'id'
          pagination={{
            pageSize: searchObj.pageSize,
            showQuickJumper: true,
            showSizeChanger: true,
            defaultPageSize: 50,
            showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
            total: totalCount,
            current: searchObj.pageNum,
            onChange: (pageNum: any, pageSize: any) => {
              setSearchObj({ ...searchObj, pageNum, pageSize });
            },
            position: ['bottomLeft']
          }} />
      </div> */}


      <div className="table-top-wrap">
        <div className="link">
          <Link to={{
            pathname: "/ecs/distribution/edit"
          }}>
            <Button type="primary">新建运费模版</Button>
          </Link>
        </div>
        {cells.map((cell, index) => {
          return <TableCell key={index} cellsData={cell} index={index} />
        })}
        <div className="pagination">
          <Pagination
            total={paginationTotal}
            showSizeChanger
            onChange={getCurrentData}
            defaultPageSize={50}
            showTotal={(total, range) => {
              return `共 ${total} 条`
            }
            }
          />
        </div>
      </div>
    </div>
  )
})
