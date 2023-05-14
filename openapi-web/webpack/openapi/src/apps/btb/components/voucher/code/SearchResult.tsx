import React, { useState, useEffect } from 'react';
import { Table, Space, Popconfirm, Button, message, Modal, Upload, IconFont, Tag } from '@aurum/pfe-ui';
import * as apis from '@/apps/btb/common/apis';
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
import { format } from 'date-fns';
import utils from '@/apps/btb/common/utils';
import ExportTask from '@/apps/btb/components/voucher/code/ExportTask';
const { transferAntdTableHeaderArray2Object, getEntityColumnColor, getEntityColumnLabel } = common.helpers;

const filterColumns = ['redeemTime', 'addTime', 'beginTime', 'endTime']
const TEMPLATEURL = 'http://cdn.mcd.cn/ecs/template_voucher.xlsx';

export default ({ dataSource, searchObj, onChangePartialSearchObj }: any) => {
  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [columns, setColumns]: any = useState([]);
  const [businessColumns, setBusinessColumn]: any = useState([]);
  const [actionColumns, setActionColumns]: any = useState([]);
  const [checkedColumns, setCheckedColumns]: any = useState([]);
  const [visible, setVisible]: any = useState(false);
  const [tabVisible, setTabVisible]: any = useState(false);
  const [file, setFile]: any = useState(null);
  const [fileError, setFileError]: any = useState(null);

  function updateFile(file: any) {
    setFile(file);
    setFileError(file ? null : '请上传Excel模板文件');
  }

  useEffect(() => {
    if (dataSource.data) {
      const dataRows = dataSource.data.list;
      setTotalCount(dataSource.data.total);
      setDataRows(dataRows);
    }
  }, [dataSource]);

  useEffect(() => {
    const businessColumns: any = transferAntdTableHeaderArray2Object([
      ['兑换码', 'redeemCode'],
      ['生成方式', 'codeType', (value: any) => getEntityColumnLabel(constants.btb.voucherCode.codeType, value)],
      ['供应商', 'supplierMerchantName'],
      ['交易号', 'orderId'],
      ['Sku_id', 'templateCode'],
      ['商品名称', 'templateName'],
      ['分销商', 'merchantName'],
      ['状态', 'status', (value: any) => {
        return <Tag color={getEntityColumnColor(constants.btb.voucherCode.status, value)} >
          {getEntityColumnLabel(constants.btb.voucherCode.status, value)}</Tag>
      }],
      ['兑换账户', 'redeemCustomerId', (value: any) => value || '/'],
      ['兑换时间', 'redeemTime'],
      ['生成时间', 'addTime'],
      ['有效开始时间', 'beginTime'],
      ['有效结束时间', 'endTime'],
    ]);

    const actionColumns: any = [{
      title: $t('Action'),
      dataIndex: 'action',
      key: 'action',
      width: 120,
      fixed: 'right' as 'right',
      render: (_: any, record: any) => {
        if (record.status !== constants.btb.voucherCode.status.PENDING.value) return null;
        if (record.codeType === constants.btb.voucherCode.codeType.THIRD_PARTY.value) return null;
        return <Space size="small">
          <Popconfirm onConfirm={() => {
            (async () => {
              const resp: any = await apis.getVoucherModule().redeemCodeCancel(record.id);
              if (resp.success) {
                message.success('作废成功');
                onChangePartialSearchObj({ ...searchObj });
              } else {
                message.error(resp.message || `作废失败`);
              }
            })();
          }} title={`确认要作废吗？`} okText="确认" cancelText="取消" >
            <Button type="link">作废</Button>
          </Popconfirm>
        </Space>
      },
    }];

    setBusinessColumn(businessColumns);
    setActionColumns(actionColumns);
  }, [searchObj]);

  useEffect(() => {
    setColumns(businessColumns.concat(checkedColumns, actionColumns));
  }, [businessColumns, actionColumns, checkedColumns]);

  const exportExcel = async () => {
    if (!file) {
      setFileError('请上传文件模板');
      return;
    }
    setFileError(null);
    const formData = new FormData();
    formData.append('file', file);
    const buffResp: any = await apis.getVoucherModule().exportCodes(formData);
    utils.ab2str(buffResp, (resp: any) => {
      if (!resp.success && resp.message) {
        message.error(resp.message);
      } else {
        message.success('文件导入成功,请稍后查看结果')
        setVisible(false);
      }
    });
  }


  const downTemplate = async () => {
    const buffResp: any = await apis.getVoucherModule().getExportTemplate();
    utils.ab2str(buffResp, (resp: any) => {
      if (!resp.success && resp.message) {
        message.error(resp.message);
      } else {
        const reader: any = new FileReader();
        reader.readAsDataURL(new Blob([buffResp])); // 转换为base64，可以直接放入a的href
        reader.onload = function (e: any) {
          const aElement: any = document.getElementById('downloadTemplate'); //获取a标签元素
          aElement.download = '模板.xlsx';
          aElement.href = e.target.result;
          const event = new MouseEvent('click');
          aElement.dispatchEvent(event);
        };
      }
    });
  };

  return (
    <div className="table-top-wrap" >
      <a id='downloadTemplate' style={{ display: 'none' }}></a>
      <Modal width={550} className="invoice-dialog" visible={visible} onCancel={() => {
        setVisible(false)
      }} footer={null}
        title={`导入兑换码`}
      >
        <div className='export-main'>
          <a id="coupon-expand-download"></a>
          <div className='export-t1'>模板上传</div>
          <div className='export-t2'>仅支持xls/xlsx格式，文件不可超过500M！</div>
          <div style={{ display: 'flex' }}>
            <Upload
              accept={'.xlsx'}
              maxCount={1}
              className='export-btn'
              onChange={(info: any) => {
                if (info.fileList.length === 0) {
                  updateFile(null);
                } else {
                  updateFile(info.file);
                }
              }}
              beforeUpload={(file: any) => {
                return false;
              }}>
              <Button><IconFont type="icon-shangchuan" />上传文件</Button>
            </Upload>
            <Button type="link" onClick={downTemplate}>下载模板</Button>
          </div>
          <Space>
            <Button disabled={file === null} type="primary" onClick={exportExcel}>导入</Button>
            <Button onClick={() => { setVisible(false) }}>取消</Button>
          </Space>
        </div>
      </Modal>
      <ExportTask visible={tabVisible} onClose={() => { setTabVisible(false) }} />
      <div className="table-top">
        <div className='export-btn'>
          <Space>
            <Button type="primary" onClick={() => { setVisible(true) }}>导入兑换码</Button>
            <Button onClick={() => { setTabVisible(true) }}>查看任务</Button>
          </Space>
        </div>
      </div>
      <Table
        rowKey="id"
        className="mcd-table"
        scroll={{ x: '100%' }}
        columns={columns}
        dataSource={dataRows}
        expanded
        allFilterColumns={filterColumns}
        pagination={{
          hideOnSinglePage: true,
          pageSize: searchObj.pageSize,
          showQuickJumper: true,
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
          current: dataSource.currentPage || searchObj.currentPage,
          total: totalCount,
          onChange: (currentPage: any, pageSize: any) => {
            onChangePartialSearchObj({
              currentPage,
              pageSize,
            });
          },
        }} />
    </div>
  )
}