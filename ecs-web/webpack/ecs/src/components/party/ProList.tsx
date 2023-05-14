import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import * as merchantAction from '@/redux/actions/merchantAction';
import { Form, Select, DatePicker, Table, Row, Col, Input, Button, Empty, message, Modal, Upload, IconFont, Radio, ProCascaderProvince } from '@aurum/pfe-ui';
import { format } from 'date-fns';
import * as apisEdit from '@/common/net/apis_edit';
import ExportModal from './ExportModal';
import moment from 'moment';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';
import { Space } from '@aurum/pfe-ui';
import { ab2str } from '@/common/helper';

const { Option } = Select;
const { RangePicker }: any = DatePicker

const mapStateToProps = (state: any) => {
  return {
    sequentialMess: state.merchant.sequentialMess,
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  changeSequentialMess: (payload: any) => dispatch({
    type: merchantAction.MERCHANT_SHOW_SEQUENTIAL,
    payload
  }),
});

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

export default connect(mapStateToProps, mapDispatchToProps)(({ }: any) => {
  const [activityRows, setActivityRows]: any = useState([]);
  const [searchObj, setSearchObj]: any = useState(initSearchObj);
  const [totalCount, setTotalCount]: any = useState(0);
  const [exportName, setExportName] = useState('导出');
  const [visible, setVisible]: any = useState(false);
  const [refreshData, setRefreshData]: any = useState('');
  let AllRegion: any = useRef({});
  const seleceRegion:any = useRef({});

  //城市选择配置
  const cityFilterCodes: any = [];
  const defaultQueryCity: any = [];
  const queryCityMap: any = {};
  cityFilterCodes.map((c: any) =>
    defaultQueryCity.push({
      code: c,
      name: queryCityMap[c]
    })
  )
  let defaultColumns: any = [
    {
      title: '餐厅编号',
      dataIndex: 'storeCode',
      key: 'storeCode',
      with: 120
    },
    {
      title: '餐厅名称',
      dataIndex: 'store',
      key: 'store',
      with: 120
    },
    {
      title: '商品ID',
      dataIndex: 'spuId',
      key: 'spuId',
      with: 100
    },
    {
      title: '商品名称',
      dataIndex: 'spuName',
      key: 'spuName',
      with: 120
    },
    {
      title: '活动日期',
      dataIndex: 'partyDate',
      key: 'partyDate',
      with: 120
    },
    {
      title: '活动场次',
      dataIndex: 'partyTime',
      key: 'partyTime',
      with: 100
    },
    {
      title: '大厨Id',
      dataIndex: 'cookEmpNo',
      key: 'cookEmpNo',
      with: 100
    },
    {
      title: '参与人数',
      dataIndex: 'partyPeople',
      key: 'partyPeople',
      width: 100,
    },
    {
      title: '适合年龄',
      dataIndex: 'partyAge',
      key: 'partyAge',
      width: 100,
    }
  ];

  const [form] = Form.useForm();
  useEffect(() => {
    form.resetFields();
    (async () => {
      const searchConds = { ...searchObj };
      if(seleceRegion.current && seleceRegion.current.length > 0) {
        searchConds.provinceCode = seleceRegion.current[0];
        searchConds.cityCode = seleceRegion.current[1];
        searchConds.countyCode = seleceRegion.current[2];
      }
      delete searchConds.dateRange;
      const { data: resultObj } = await apisEdit.getMerchantModule().newPartyList(searchConds);
      if (resultObj && resultObj.list) {
        setActivityRows(resultObj.list)
        setTotalCount(resultObj.total)
      }
    })()
  }, [searchObj, refreshData]);

  const exportExcel = async () => {
    let values = form.getFieldsValue(searchObj);
    if (!values.spuId) {
      message.error('请输入商品ID')
      return;
    }
    if (!activityRows.length) {
      message.error('请重新选择')
      return;
    }

    const searchConds = { ...values };
    if (searchConds.dateRange) {
      searchConds.startDate = searchConds.dateRange[0]?.format('YYYY-MM-DD HH:mm:ss') || '';
      searchConds.endDate = searchConds.dateRange[1]?.format('YYYY-MM-DD HH:mm:ss') || '';
    }
    delete searchConds.dateRange;

      setExportName('导出中 ...')
      try {
        const buffResp: any = await apisEdit.getMerchantModule().exportSessions({ ...searchConds});
        ab2str(buffResp, (resp: any) => {
          if (!resp.success && resp.message) {
            message.error(resp.message);
          } else {
            const reader: any = new FileReader();
            reader.readAsDataURL(new Blob([buffResp])); // 转换为base64，可以直接放入a的href
            reader.onload = function (e: any) {
              const aElement: any = document.getElementById('orders-export'); //获取a标签元素
              aElement.download = `活动场次_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`;
              aElement.href = e.target.result;
              const event = new MouseEvent('click');
              aElement.dispatchEvent(event);
            };
          }
          setExportName('导出')
        });
      } catch(e) {
        console.log('e', e)
        setExportName('导出')
      }
    
  }

  const onChange = (value:any) => {
    seleceRegion.current = value || [];
  }

  return (
    <div className="party-list">
      <ExportModal activityRows={activityRows} visible={visible} setRefreshData={setRefreshData} onClose={() => { setVisible(false) }} />
      <Form layout="vertical"
        form={form}
        className="search-form"
        initialValues={searchObj}
        onFinish={(values: any) => {
          const narrowSearchObj: any = {};
          Object.keys(values).map((key) => {
            if (key === 'dateRange') {
              if (values.dateRange) {
                if (values.dateRange[0]) narrowSearchObj.startDate = values.dateRange[0].format('YYYY-MM-DD');
                if (values.dateRange[1]) narrowSearchObj.endDate = values.dateRange[1].format('YYYY-MM-DD');
                if (narrowSearchObj.startDate && narrowSearchObj.endDate) {
                  narrowSearchObj.dateRange = [moment(narrowSearchObj.startDate, 'YYYY-MM-DD'), moment(narrowSearchObj.endDate, 'YYYY-MM-DD')];
                }
              } else {
                narrowSearchObj.startDate = narrowSearchObj.endDate = null;
                narrowSearchObj.dateRange = [];
              }
            } else {
              narrowSearchObj[key] = values[key];
            }
          });
          narrowSearchObj.pageNum = 1;
          setSearchObj({ ...searchObj, ...narrowSearchObj });
        }}
        onValuesChange={(values: any) => {
        }}
      >
        <div className="search-area">
          <Row gutter={32}>
            <Col span={3}>
              <Form.Item name='store' label={$t('餐厅名称')} >
                <Input maxLength={140} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item name='spuName' label={$t('商品名称')} >
                <Input maxLength={140} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item name='spuId' label={$t('商品ID')} >
                <Input maxLength={140} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item name='storeCode' label={$t('门店编号')} >
                <Input maxLength={140} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={32}>
            <Col span={3}>
              <Form.Item label={$t('活动日期')} name='dateRange'>
                <RangePicker
                  style={{ width: '100%' }}
                  picker="date"
                />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('省市区')}>
                <ProCascaderProvince
                  onChange={onChange}
                  placeholder="请选择"
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
                <Button
                  // disabled={!checkMyPermission('ecs:ecsLego:partyExport')} 
                  onClick={(it: any) => {
                    if (exportName !== '导出') {
                      return
                    } else {
                      exportExcel();
                    }
                  }}>{exportName}</Button>
              </Space>
            </Col>
          </Row>
        </div>
      </Form>
      <div className="table-top-wrap" >
        <Row style={{ marginBottom: '12Px' }}>
          <Col>
            <Button type="primary" onClick={() => { setVisible(true) }}>批量导入</Button>
          </Col>
        </Row>

        {activityRows?.length > 0 && <Table
          scroll={{ x: '100%' }}
          tableLayout="fixed"
          columns={defaultColumns}
          dataSource={activityRows}
          rowKey='relationld'
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
          }} />}
        {!activityRows || activityRows.length == 0 &&
          <Empty />
        }
      </div>
      <a id='orders-export' style={{display:'none'}}></a>
    </div>
  )
})
