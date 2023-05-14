import React, { useEffect, useState } from 'react';
import { Table, Form, Button, Input, Modal, Spin, message } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/btb/common/apis';
import './styles/RelatedOrdersSelector.less';

export default ({ visible, onClose, title, searchConds, maxLimit = 10, selectedItemIds = [], source }: any) => {
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [items, setItems]: any = useState({});
  const [searchObj, setSearchObj]: any = useState({
    pageNo: 1,
    pageSize: 999,
    ...searchConds
  });
  // const [form] = Form.useForm();

  async function fetchItems(sObj: any) {
    setLoading(true);
    const resp = await apis.getBOSModule().orderList(sObj);
    resp.data = resp.data || {};
    resp.data.list = resp.data.list || [];
    setLoading(false);
    setItems(resp.data)
  }

  const { transferAntdTableHeaderArray2Object } = common.helpers;
  const columns: any = transferAntdTableHeaderArray2Object([
    ['订单号', 'orderId'],
    ['名称', 'orderName', (_: any, order: any) => order.orderGoods[0].spuName],
    ['数量/金额(元)', 'settlePrice', (settlePrice: any, order: any) => {
      const goods: any = order.orderGoods[0];
      return `${goods.count} / ${settlePrice / 100}`;
    }],
    // ['操作', 'action', (_: any, order: any) => {
    //   return <Button type="link" onClick={() => { }} >选择</Button>
    // }]
  ]);

  function close(itemsToSelect: any) {
    setSelectedRows([]);
    if (onClose) onClose(itemsToSelect, source);
  }

  useEffect(() => {
    if (visible) {
      // form.resetFields();
      fetchItems(searchObj);
    }
  }, [visible, searchObj])

  return (
    <Modal width={900} visible={visible} onCancel={() => { close([]) }}
      bodyStyle={{ paddingTop: '0' }}
      title={title || '所有订单'}
      footer={[
        <Button key="cancel" onClick={() => { close([]) }}>取消</Button>,
        <Button key="confirm" type="primary" onClick={() => { close(selectedRows) }} >确定</Button>,
      ]}
    >
      <Spin spinning={loading}>
        <div className="order-select-modal row">
          {/* <Form layout="vertical"
            form={form}
            className="search-form"
            initialValues={searchObj}
            onFinish={(values: any) => {
              setSearchObj({ ...searchObj, ...values, pageNo: 1 });
            }}
            onValuesChange={(values: any) => {
            }}
          >
            <div className="search-area">
              <Form.Item hidden={true} name="status">
                <Input />
              </Form.Item>
            </div>
          </Form> */}
          {items.list?.length > 0 && <Table
            className="orders-selector"
            columns={columns}
            rowKey="orderId"
            rowSelection={{
              type: 'checkbox',
              onChange: (_: any, selectedRows: any) => {
                if ((selectedRows.length + selectedItemIds.length) > maxLimit) {
                  message.destroy();
                  message.warn(`最多选择${maxLimit}个订单.`)
                } else {
                  setSelectedRows(selectedRows);
                }
              },
              selectedRowKeys: selectedRows.map((it: any) => it.orderId),
              getCheckboxProps: (record: any) => ({
                disabled: selectedItemIds.some((id: any) => id === record.orderId),
              }),
            }}
            dataSource={items.list}
            pagination={{
              pageSize: 10,
              simple: true,
              hideOnSinglePage: false,
              // total: items.total,
              // current: searchObj.pageNo,
              // onChange: (pageNo: any) => {
              //   setSearchObj({ ...searchObj, pageNo });
              // }
            }} />}
        </div>
      </Spin>
    </Modal>
  )
}