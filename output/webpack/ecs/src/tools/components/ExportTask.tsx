import React, { useState, useEffect } from 'react';
import { Table, message, Modal, Button, Spin } from '@aurum/pfe-ui';
import * as apis from '../common/apis';
import common from '@omc/common';
import { format } from 'date-fns';
const { transferAntdTableHeaderArray2Object } = common.helpers;

export default ({ visible, onClose }: any) => {
  const [loading, setLoading] = useState(true);
  const [sourceData, setSourceData]: any = useState([]);
  const [searchObj, setSearchObj]: any = useState({
    pageNo: 1,
    pageSize: 10,
  });

  useEffect(() => {
    if (visible) {
      getExportTask();
    }
  }, [visible, searchObj]);

  async function getExportTask() {
    setLoading(true);
    const resp = await apis.getMerchantModule().getExportTask(searchObj);
    if (!resp.success || !resp.data) {
      message.error(resp.message);
    }
    setLoading(false);
    let list = resp.data?.list || [];
    setSourceData({ list: list, total: resp.data.total });
  }

  const columns: any = transferAntdTableHeaderArray2Object([
    ['任务id', 'id'],
    ['文件名称', 'fileName'],
    [
      '状态',
      'status',
      (value: any) => {
        return (
          <div>{value === 1 ? '已完成' : '进行中'}</div>
        );
      },
    ],
    ['开始时间', 'createdTime'],
    ['操作人', 'operator'],
    [
      '操作',
      'resultUrl',
      (value: any, record: any) => {
        return (record.status === 1 ? <a
          type="link"
          onClick={() => {
            exportRoster(value)
          }} >下载</a> : <div>-</div>)
      }]
  ]);


  const exportRoster = async (resultUrl: any) => {
    let aElement: any = document.getElementById('downloadRoster'); //获取a标签元
    aElement.href = resultUrl; //设置a标签路径
    const event = new MouseEvent('click');
    aElement.dispatchEvent(event);
  };

  const refresh = () => {
    getExportTask();
  };

  return (
    <div>
      <a id='downloadRoster' style={{ display: 'none' }}></a>
      <Modal
        width={850}
        className="invoice-dialog"
        visible={visible}
        onCancel={() => {
          onClose();
        }}
        footer={null}
        title={`导入任务`}
      >
        <div className="export-main">
          <Button
            style={{ marginBottom: '16px' }}
            type="primary"
            onClick={refresh}
          >
            刷新
          </Button>
          <Spin spinning={loading}>
            {!loading && (
              <Table
                rowKey="id"
                className="mcd-table"
                scroll={{ x: '100%' }}
                columns={columns}
                dataSource={sourceData.list}
                pagination={{
                  pageSize: searchObj.pageSize,
                  hideOnSinglePage: true,
                  showSizeChanger: true,
                  defaultPageSize: 10,
                  total: sourceData.total,
                  showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
                  current: searchObj.pageNo,
                  onChange: (page: any, pageSize: any) => {
                    setSearchObj({ ...searchObj, pageNo: page, pageSize });
                  },
                }}
              />
            )}
          </Spin>
        </div>
      </Modal>
    </div>
  );
};