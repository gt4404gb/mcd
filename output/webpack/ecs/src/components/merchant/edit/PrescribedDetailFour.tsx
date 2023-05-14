import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Form, Input, Button, InputNumber, message, Table, Select, Radio, Space, Tooltip, Popover, IconFont } from '@aurum/pfe-ui';
import { sanitizeToInteger, getShopName } from '@/common/helper';
import * as apisEdit from '@/common/net/apis_edit';
import CrmSimpleTable from '@/components/merchant/edit/crmSimpleTable';
import SelectTemplate from '@/components/SelectTemplate';
const mapStateToProps = (state: any) => {
  return {
    merchantDetail: state.merchant.merchantDetail,
  }
}

export default connect(mapStateToProps)(({ skus, field, onChange = null, disabled,
  onSelectNewCoupon, onWriteRightInfo, merchantDetail, taxOptions, shopId,
  changeSkuListExpenditure, changeExpressSite, isMaterial, isShowGift, IsAuction,
  changeSkuListImportType, isCreated, spuId, categoryId, allowInvByStore, templateOptions, isMaiyouli,
  expressSiteList, expressCompanyList, warehouseCodeList }: any) => {

  const [currColumns, setCurrColumns]: any = useState([]);


  let columns: any = [{
    title: 'skuId',
    dataIndex: 'skuId',
    width: 100,
    fixed: 'left',
    key: 'skuId',
    render: (text: any, fields: any, index: any) => (
      <span>{skus[index]?.skuId}</span>
    )
  }, {
    title: 'sku详情',
    dataIndex: 'skuName',
    width: 100,
    fixed: 'left',
    key: 'skuName',
    render: (text: any, fields: any, index: any) => (
      <span>{skus[index]?.skuName}</span>
    )
  },
  {
    title: '售卖价',
    className: 'tdrequired',
    dataIndex: 'price',
    width: 100,
    key: 'price',
    render: (text: any, field: any) => {
      return <><Form.Item colon={false} name={[field.name, 'price']} rules={[{ required: true, message: '请填写价格' }]}>
        <InputNumber size='small' priceMode disabled={disabled} min={0}
        />
      </Form.Item>
      </>
    }
  },
  {
    title: '库存',
    width: 100,
    className: 'tdrequired',
    dataIndex: 'stock',
    key: 'stock',
    render: (text: any, field: any) => (
      <Form.Item colon={false} name={[field.name, 'stock']} rules={[{ required: true, message: '请填写库存' }]}>
        <InputNumber size='small' priceMode min={1} disabled={disabled} />
      </Form.Item>)
  },
  {
    title: '税率',
    width: 120,
    className: 'tdrequired',
    dataIndex: 'taxId',
    key: 'taxId',
    render: (text: any, field: any) => (
      <Form.Item colon={false} name={[field.name, 'taxId']} rules={[{ required: true, message: '请选择税率' }]}>
        <Select size='small' allowClear disabled={disabled} placeholder={$t('请选择税率')} dropdownMatchSelectWidth={200}>
          {taxOptions}
        </Select>
      </Form.Item>)
  },
  {
    title: '按核销餐厅开票',
    width: 130,
    className: 'tdrequired',
    dataIndex: 'invByStore',
    key: 'invByStore',
    render: (text: any, field: any, index: any) => {
      return <Form.Item name={[field.name, 'invByStore']}>
        <Radio.Group disabled={!allowInvByStore || disabled}>
          <Radio value={0}>否</Radio>
          <Radio value={1}>是</Radio>
        </Radio.Group>
      </Form.Item>
    }
  },
  {
    title: '划线价',
    width: 100,
    dataIndex: 'linePrice',
    key: 'linePrice',
    render: (text: any, field: any) => (
      <Form.Item colon={false} name={[field.name, 'linePrice']} dependencies={['price']}
        rules={[
          ({ getFieldValue }) => ({
            validator(_, value) {
              /* @ts-ignore */
              let index = _.field.slice(8, 9);
              if (value && getFieldValue('skuList')[index].price > value) {
                return Promise.reject(new Error('划线价要大于等于售卖价!'));
              }
              return Promise.resolve();
            },
          }),
        ]}
      >
        <InputNumber size='small' priceMode disabled={disabled} min={1} />
      </Form.Item>)
  }
  ]

  if (shopId == 1 || (shopId === 10005 && categoryId === 28)) { //新增麦麦商城实物购买方式 20220424
    columns.splice(2, 0, {
      title: '购买方式',
      className: 'tdrequired',
      dataIndex: '购买方式',
      width: 180,
      key: 'priceStyle',
      render: (text: any, field: any, index: any) => {
        return <Form.Item name={[field.name, 'priceStyle']} rules={[{ required: true, message: '请选择购买方式' }]} className='skuListExpenditure'>
          <Radio.Group disabled={disabled} onChange={(e) => { changeSkuListImportType('priceStyle', e.target.value, index) }} >
            <Radio value={1}>现金</Radio>
            <Radio value={2}>现金 + 积分</Radio>
          </Radio.Group>
        </Form.Item>
      }
    });

    columns.splice(4, 0,
      {
        title: '扣减积分',
        dataIndex: 'points',
        width: 100,
        key: 'points',
        render: (text: any, field: any, index: any) => {
          return <Form.Item colon={false} name={[field.name, 'points']} rules={[{ required: skus[index]?.priceStyle === 2, message: '请填写扣减积分' }]}>
            <InputNumber size='small' priceMode disabled={disabled || skus[index]?.priceStyle === 1} placeholder="限正整数" min={1} maxLength={6}
              formatter={(value: any) => sanitizeToInteger(value)}
              parser={value => sanitizeToInteger(value) || ''}
            />
          </Form.Item>
        }
      }
    );
  }

  if (shopId === 2 || shopId === 3) {
    columns = [{
      title: 'skuId',
      className: 'tdrequired',
      dataIndex: 'skuId',
      width: 100,
      fixed: 'left',
      key: 'skuId',
      render: (text: any, fields: any, index: any) => (
        <span>{skus[index]?.skuId}</span>
      )
    }, {
      title: 'sku详情',
      className: 'tdrequired',
      dataIndex: 'skuName',
      width: 120,
      fixed: 'left',
      key: 'skuName',
      render: (text: any, fields: any, index: any) => (
        <span>{skus[index]?.skuName}</span>
      )
    }, {
      title: '售卖价' + getShopName(shopId),
      className: 'tdrequired',
      dataIndex: 'points',
      width: 100,
      key: 'points',
      render: (text: any, field: any) => {
        return <Form.Item colon={false} name={[field.name, 'points']} rules={[{ required: true, message: '请填写售卖价' + getShopName(shopId) }]}>
          <InputNumber size='small' disabled={disabled} priceMode placeholder="限正整数" min={1} maxLength={7}
            formatter={(value: any) => sanitizeToInteger(value)}
            parser={value => sanitizeToInteger(value) || ''}
          />
        </Form.Item>
      }
    },
    {
      title: '划线价' + getShopName(shopId),
      width: 100,
      dataIndex: 'linePrice',
      key: 'linePrice',
      render: (text: any, field: any) => (
        <Form.Item colon={false} name={[field.name, 'linePrice']} dependencies={['price']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                /* @ts-ignore */
                let index = _.field.slice(8, 9);
                if (value && getFieldValue('skuList')[index].points >= value) {
                  return Promise.reject(new Error('划线价' + getShopName(shopId) + '要大于售卖价' + getShopName(shopId) + '!'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber size='small' priceMode disabled={disabled} min={1} />
        </Form.Item>)
    },
    {
      title: '库存',
      width: 100,
      className: 'tdrequired',
      dataIndex: 'stock',
      key: 'stock',
      render: (text: any, field: any) => (
        <Form.Item colon={false} name={[field.name, 'stock']} rules={[{ required: true, message: '请填写库存' }]}>
          <InputNumber size='small' priceMode min={1} disabled={disabled}
            formatter={(value: any) => sanitizeToInteger(value)}
            parser={value => sanitizeToInteger(value) || ''}
          />
        </Form.Item>)
    }
    ]
  }

  const deleteRedeemCode = (params: any, index: any) => {
    (async () => {
      const result = await apisEdit.getMerchantModule().redeemCode(params);
      if (result.success) {
        message.success('删除成功')
        changeSkuListImportType('excelUploaded', false, index)
      }
    })()
  }

  //券核销价，单买价 只有积分积点的非实物才有
  let tdrequiredColumn = [{
    title: '券核销价',
    className: 'tdrequired',
    dataIndex: 'extTradePrice',
    width: 120,
    key: 'extTradePrice',
    render: (text: any, field: any) => {
      return <Form.Item colon={false} name={[field.name, 'extTradePrice']} rules={[{ required: true, message: '请填写券核销价' }]}>
        <InputNumber size='small' priceMode disabled={disabled} min={0} />
      </Form.Item>
    }
  },
  {
    title: '券单买价',
    className: '',
    dataIndex: 'extOriginPrice',
    width: 120,
    key: 'extOriginPrice',
    render: (text: any, field: any) => {
      return <Form.Item colon={false} name={[field.name, 'extOriginPrice']}
        rules={[
          ({ getFieldValue }) => ({
            validator(_, value) {
              /* @ts-ignore */
              let index = _.field.slice(8, 9);
              if (value && getFieldValue('skuList')[index].extTradePrice >= value) {
                return Promise.reject(new Error('券单买价要大于券核销价!'));
              }
              return Promise.resolve();
            },
          }),
        ]}
      >
        <InputNumber size='small' priceMode disabled={disabled} min={0} />
      </Form.Item>
    }
  }]

  if ((shopId === 2 || shopId === 3) && !isMaterial && categoryId !== 17 && !merchantDetail.isThirdCode) {
    columns = columns.concat(tdrequiredColumn)
  }

  let columnsAutoRenew: any = [
    {
      title: '支持自动续费',
      width: categoryId === 28 ? 400 : 260,
      dataIndex: 'autoRenew',
      key: 'autoRenew',
      render: (text: any, field: any, index: any) => {
        return <Form.Item style={{ marginBottom: 0 }} className='skuListExpenditure'>
          <Input.Group compact>
            <Form.Item name={[field.name, 'autoRenew']}>
              <Select onChange={(e) => { autoRenew(e, index) }} disabled={disabled}>
                <Select.Option value={1}>是</Select.Option>
                <Select.Option value={0}>否</Select.Option>
              </Select>
            </Form.Item>
            {
              skus[index]?.autoRenew == '1' && (
                <>
                  <Form.Item name={[field.name, 'renewFirstPrice']} rules={[{ required: true, message: '请填写首次价格' }]}>
                    <InputNumber size='small' priceMode placeholder='首次价格' disabled={disabled} min={0} maxLength={7} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'renewPrice']} rules={[{ required: true, message: '请填写续费价格' }]}>
                    <InputNumber size='small' priceMode placeholder='续费价格' disabled={disabled} min={0} maxLength={7} />
                  </Form.Item>
                  <Tooltip title="请联系支付网关IT同事确认续费模板编号">
                    <Form.Item name={[field.name, 'planId']} rules={[{ type: 'string', required: true, message: '请填写续费模板编号' }]}>
                      <Input size='small' disabled={disabled} min={0} placeholder='请填写续费模板编号' />
                    </Form.Item>
                  </Tooltip>
                </>
              )
            }
          </Input.Group>
        </Form.Item>
      }
    }
  ]

  //实物重量
  let commodityWeight: any = [
    {
      title: '发货方',
      width: 150,
      dataIndex: 'taxId',
      key: 'taxId',
      render: (text: any, field: any, index: any) => (
          <Form.Item name={[field.name, 'expressSite']} style={{ marginRight: '10px', minWidth: '80px' }}>
            <Select onChange={(e) => { expressSite(e, index) }} size='small' disabled={disabled} placeholder={$t('请选择发货方')} >
              {expressSiteList}
            </Select>
          </Form.Item>
      )
    },
    {
      title: '仓库商品编码',
      width: 150,
      dataIndex: 'goodNo',
      key: 'goodNo',
      render: (text: any, field: any, index: any) => (
        <Form.Item
          className='goodNo'
          name={[field.name, 'goodNo']}
          rules={[{ required: skus[index]?.expressSite !== 'MANUAL', message: '请填写仓库商品编码' }]}
        >
          <Input size='small' disabled={(skus[index]?.expressSite == 'HAVI' || skus[index]?.expressSite == 'QIMEN') ? disabled : true} placeholder="请填写仓库商品编码" />
        </Form.Item>
      )
    },
    {
      title: '发货仓库编码',
      width: 150,
      className: 'tdrequired',
      dataIndex: 'warehouseCode',
      key: 'warehouseCode',
      render: (text: any, field: any, index: any) => (
        <Form.Item
          name={[field.name, 'warehouseCode']}
          rules={[{ required: skus[index]?.expressSite === 'QIMEN', message: '请填写发货仓库编码' }]}
        >
          <Select size='small' disabled={skus[index]?.expressSite !== 'QIMEN' ? true : disabled} placeholder={$t('请填写发货仓库编码')} >
            {warehouseCodeList}
          </Select>

          
        </Form.Item>
      )
    },
    {
      title: '请选择优先快递',
      width: 130,
      className: 'tdrequired',
      dataIndex: 'logisticsCode',
      key: 'logisticsCode',
      render: (text: any, field: any, index: any) => (
        <Form.Item
          name={[field.name, 'logisticsCode']}
          rules={[{ required: skus[index]?.expressSite === 'QIMEN', message: '请选择优先快递' }]}
          style={{ marginRight: '10px', minWidth: '80px' }}
        >
          <Select size='small' disabled={skus[index]?.expressSite !== 'QIMEN' ? true : disabled} placeholder={$t('请选择优先快递')} >
            {expressCompanyList}
          </Select>
        </Form.Item>
      )
    },
    {
      title: '重量',
      dataIndex: 'weight',
      width: 120,
      key: 'weight',
      render: (text: any, field: any) => {
        return <Form.Item className='weight' colon={false} name={[field.name, 'weight']} extra='kg'>
          <InputNumber size='small' priceMode disabled={disabled} min={0} placeholder={$t('请填写重量')} />
        </Form.Item>
      }
    }
  ]

  //gift 否支持赠送
  let giftColumns: any = [
    {
      title: '是否支持赠送',
      dataIndex: 'gift',
      width: 110,
      key: 'gift',
      render: (text: any, field: any) => {
        return <Form.Item name={[field.name, 'gift']}>
          <Select disabled={disabled}>
            <Select.Option value={1}>否</Select.Option>
            <Select.Option value={2}>是</Select.Option>
          </Select>
        </Form.Item>
      }
    }
  ]

  let columnsRights: any = [
    {
      title: '权益详情',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: "center",
      render: (text: any, field: any) => (
        <div className="action-block">
          <a onClick={() => {
            if (disabled) {
              message.warning('当前为不可编辑状态');
              return;
            }
            onWriteRightInfo(field.key);
          }}>维护权益详情</a>
        </div>
      )
    }]

  let columnsExt = [{
    title: categoryId === 28 ? '规格编码' : '卡券编号',
    width: 200,
    dataIndex: 'ext',
    className: 'tdrequired',
    key: 'ext',
    render: (text: any, field: any) => (
      <Form.Item colon={false} name={[field.name, 'ext']} rules={[{ required: true, message: categoryId === 28 ? '请关联规格' : '请关联卡券' }]} >
        <Input size='small' disabled />
      </Form.Item>
    )
  },
  {
    title: categoryId === 28 ? '规格描述' : '卡券名称',
    width: 150,
    dataIndex: 'extName',
    className: 'light',
    key: 'extName',

    render: (text: any, field: any, index: any) => {
      if (categoryId === 28) {
        return <Popover content={<div style={{ width: '1000px' }}><CrmSimpleTable
          data={[skus[index].selectCrmObj]}
        /></div>} title="">
          <span>{skus[index]?.extName} <IconFont type="icon-xinxi" /></span>
        </Popover>
      } else {
        return <Form.Item colon={false} name={[field.name, 'extName']}>
          <Input size='small' disabled />
        </Form.Item>
      }
    }
  },
  {
    title: categoryId === 28 ? '关联规格' : '关联',
    dataIndex: 'action',
    key: 'action',
    width: 100,
    fixed: 'right',
    align: "center",
    render: (text: any, field: any) => (
      <div className="action-block">
        <a onClick={() => {
          if (disabled) {
            message.warning('当前为不可编辑状态');
            return;
          }
          onSelectNewCoupon(field.key);
        }}>{categoryId === 28 ? '选择规格' : '关联卡券编号'}</a>
      </div>
    )
  }]

  //aurum 最后一列没有返回index， 故增加一列
  let thirdCodeColumns: any = [
    {
      title: '兑换码',
      width: 100,
      dataIndex: 'importType',
      key: 'importType',
      render: (text: any, field: any, index: any) => {
        return <Form.Item style={{ marginBottom: 0 }} className='skuListExpenditure'>
          <Input.Group compact>
            <Form.Item name={[field.name, 'importType']} rules={[{ required: true, message: '请选择兑换码方式' }]}>
              <Radio.Group disabled={disabled} onChange={(e) => { changeSkuListImportType('triggerTransferFlag', e.target.value, index) }} >
                <Radio value={2}>实时生成</Radio>
              </Radio.Group>
            </Form.Item>
          </Input.Group>
        </Form.Item>
      }
    },
    {
      title: '',
      dataIndex: '',
      width: 100,
      fixed: '',
      key: '',
      render: (text: any, fields: any, index: any) => (
        <span></span>
      )
    },
  ]

  //categoryId === 24 关联资源
  let templateColumns: any = [
    {
      title: '关联资源',
      width: 160,
      dataIndex: 'ext',
      key: 'ext',
      render: (text: any, field: any, index: any) => {
        return <Form.Item className="theme-transfer" style={{ marginBottom: 0 }} name={[field.name, 'ext']}>
          <SelectTemplate disabled={disabled} originTemplateOptions={templateOptions} />
        </Form.Item>
      }
    }
  ]


  //实物商品
  if (isMaterial) {
    columns = columns.concat(commodityWeight);
  }

  //是否可赠送  shopId 4 为麦有礼，默认赠送，所以不需要露出选择项
  if (isShowGift && !isMaiyouli && shopId !== 5 && !IsAuction && !merchantDetail.isThirdCode) {
    columns = columns.concat(giftColumns);
  }
  
  //兑换码O麦金会员
  if (categoryId === 30) {
    columns = columns.concat(thirdCodeColumns);
  }

  //兑换码第三方
  if (categoryId === 24) {
    columns = columns.concat(templateColumns);
  }

  //麦麦商城卡类型需要维护自动续费, 卡类型需要维护权益详情
  if ((shopId === 1 && merchantDetail.isNeedExtTypeEqual3) && !merchantDetail.isThirdCode) {
    columns = columns.concat(columnsAutoRenew);
    if (categoryId !== 28) {
      columnsExt = columnsExt.concat(columnsRights);
    }
  }

  if (merchantDetail.isNeedExtType) {
    columns = columns.concat(columnsExt)
  }

  const autoRenew = (e: any, index: any) => {
    changeSkuListExpenditure(e, index)
  }

  const expressSite = (e: any, index: any) => {
    changeExpressSite(e, index)
  }

  return (
    <div className="specValue" style={{ maxHeight: '700px' }}>
      <Form.List name={field}>
        {(fields: any, { add, remove }: any) => {
          return <Table dataSource={fields} columns={columns} pagination={false} scroll={{ x: '100%' }} className='PrescribedDetailFour' />
        }}
      </Form.List>
    </div>
  )
}
);