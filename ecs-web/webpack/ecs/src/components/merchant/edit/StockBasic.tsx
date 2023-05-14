import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { Form, Input, Select, InputNumber, Button, Radio, message, Tooltip, Row, Col, IconFont } from '@aurum/pfe-ui';
import { sanitizeToInteger, getShopName } from '@/common/helper';
import * as apisEdit from '@/common/net/apis_edit';
import CrmSimpleTable from '@/components/merchant/edit/crmSimpleTable';
import SelectTemplate from '@/components/SelectTemplate';
import SelectMerchants from '@/components/SelectMerchants';

const { Option } = Select;

const mapStateToProps = (state: any) => {
  return {
    merchantDetail: state.merchant.merchantDetail,
    shopId: state.merchant.shopId,
  }
}

export default connect(mapStateToProps)((({ merchantStockFour, merchantDetail, shopId, taxOptions, canOnlyView, relate, relateRights,
  isMaterial, isShowGift, IsAuction, triggerTransferFlag, isCreated, spuId, skuId, categoryId, allowInvByStore, templateOptions, isMaiyouli,
  expressSiteList, expressCompanyList, warehouseCodeList }: any) => {
  const [isExpenditure, setIsExpenditure] = useState(0);
  const [isUploadFileState, setIsUploadFileState] = useState(false);//excel是否上传过
  useEffect(() => {
    if (merchantStockFour?.proInfo?.autoRenew == 1) {
      setIsExpenditure(1)
    }
    else {
      setIsExpenditure(0)
    }
    if (merchantStockFour?.proInfo) {
      setIsUploadFileState(merchantStockFour?.proInfo?.excelUploaded)
    }
  }, [merchantStockFour])

  //产品是否支持自动续费
  const autoRenew = (e: any) => {
    setIsExpenditure(e)
  }

  const deleteRedeemCode = (params: any) => {
    (async () => {
      const result = await apisEdit.getMerchantModule().redeemCode(params);
      if (result.success) {
        message.success('删除成功')
        setIsUploadFileState(false)
      }
    })()
  }

  return (
    <div>
      <Row gutter={32} className="form-block">
        <Col className="gutter-row" span={6}>
          {(shopId == 1 || (shopId === 10005 && categoryId === 28)) && <Form.Item name={['proInfo', 'priceStyle']} label={$t('购买方式')} rules={[{ required: true, message: '请选择购买方式' }]}>
            <Radio.Group disabled={canOnlyView}>
              <Radio value={1}>现金</Radio>
              <Radio value={2} disabled={categoryId === 33}>现金 + 积分</Radio>
            </Radio.Group>
          </Form.Item>}
        </Col>
      </Row>
      <Row gutter={32} className="form-block">

        {(shopId !== 2 && shopId !== 3) && <Col className="gutter-row" span={6}><Form.Item label={$t('售卖价')} name={['proInfo', 'price']}
          rules={[{ required: true }]}>
          <InputNumber disabled={canOnlyView}
            min={0}
          />
        </Form.Item></Col>}


        {((shopId == 1 || (shopId === 10005 && categoryId === 28)) && merchantStockFour.proInfo?.priceStyle === 2) && <Col className="gutter-row" span={6}><Form.Item label={$t('扣减积分')} name={['proInfo', 'points']}
          rules={[{ required: merchantStockFour?.proInfo?.priceStyle === 2 }]}>
          <InputNumber disabled={canOnlyView} placeholder="限正整数" min={1} maxLength={6}
            formatter={(value: any) => sanitizeToInteger(value)}
            parser={value => sanitizeToInteger(value) || ''}
          />
        </Form.Item></Col>}


        {(shopId == 2 || shopId == 3) && <Col className="gutter-row" span={6}><Form.Item label={$t('售卖价' + getShopName(shopId))} name={['proInfo', 'points']}
          rules={[{ required: true }]}>
          <InputNumber disabled={canOnlyView}
            formatter={(value: any) => sanitizeToInteger(value)}
            parser={value => sanitizeToInteger(value) || ''}
          />
        </Form.Item></Col>}


        {shopId !== 5 && <Col className="gutter-row" span={6}><Form.Item label={$t('库存')} name={['proInfo', 'stock']}
          rules={[{ required: true, message: '请填写库存' }]}>
          <InputNumber disabled={canOnlyView} min={1}
            formatter={(value: any) => sanitizeToInteger(value)}
            parser={value => sanitizeToInteger(value) || ''}
          />
        </Form.Item></Col>}
        {/* 实时生成=》 兑换码O麦金会员;   关联=》 兑换码第三方   30:兑换码O麦金会员; 24:兑换码第三方 */}
        {categoryId === 30 && <Col className="gutter-row" span={6}><Form.Item className="theme-transfer" label={$t('产码类型')} style={{ marginBottom: 0 }}>
          <Input.Group compact>
            <Form.Item name={['proInfo', 'importType']} rules={[{ required: true, message: '请选择兑换码' }]}>
              <Radio.Group disabled={canOnlyView}>
                <Radio value={2}>实时生成</Radio>
              </Radio.Group>
            </Form.Item>
          </Input.Group>
        </Form.Item></Col>}

        {categoryId === 24 && <Col className="gutter-row" span={6}>
          <Form.Item className="theme-transfer" label={$t('关联资源')} style={{ marginBottom: 0 }} name={'ext'}>
            <SelectTemplate disabled={canOnlyView} originTemplateOptions={templateOptions} />
          </Form.Item></Col>
        }

        {(shopId == 2 || shopId == 3) && !isMaterial && categoryId !== 17 && !merchantDetail.isThirdCode && <Col className="gutter-row" span={6}><Form.Item label={$t('券核销价')} name={['proInfo', 'extTradePrice']}
          rules={[{ required: true, message: '请填写券核销价' }]}
        >
          <InputNumber disabled={canOnlyView} min={0} />
        </Form.Item></Col>}

        {(shopId == 2 || shopId == 3) && !IsAuction && !isMaterial && categoryId !== 17 && !merchantDetail.isThirdCode && <Col className="gutter-row" span={6}><Form.Item label={$t('券单买价')} name={['proInfo', 'extOriginPrice']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                /* @ts-ignore */
                if (value && getFieldValue('proInfo').extTradePrice > value) {
                  return Promise.reject(new Error('券单买价要大于等于券核销价!'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber disabled={canOnlyView} min={0} />
        </Form.Item></Col>}

        {(shopId !== 2 && shopId !== 3) && <Col className="gutter-row" span={6}><Form.Item label={$t('税率')} name={['proInfo', 'taxId']}
          rules={[{ required: true }]} className="taxId">
          <Select allowClear disabled={canOnlyView} placeholder={$t('请选择税率')} >
            {taxOptions}
          </Select>
        </Form.Item></Col>}
        {(shopId !== 2 && shopId !== 3) && !IsAuction && <Col className="gutter-row" span={6}><Form.Item label={$t('划线价')} name={['proInfo', 'linePrice']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                /* @ts-ignore */
                if (value && getFieldValue('proInfo').price >= value) {
                  return Promise.reject(new Error('划线价要大于售卖价!'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber disabled={canOnlyView} />
        </Form.Item></Col>}
        {(shopId == 2 || shopId == 3) && !IsAuction && <Col className="gutter-row" span={6}><Form.Item label={'划线价' + getShopName(shopId)} name={['proInfo', 'linePrice']}

          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                /* @ts-ignore */
                if (value && getFieldValue('proInfo').points >= value) {
                  return Promise.reject(new Error('划线价' + getShopName(shopId) + '要大于售卖价' + getShopName(shopId) + '!'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber disabled={canOnlyView} />
        </Form.Item></Col>}

        {isMaterial && <Col className="gutter-row" span={6}>
          <Form.Item
            label="重量(kg)"
            name={['proInfo', 'weight']}
          >
            <InputNumber style={{ width: '100%' }} disabled={canOnlyView} placeholder="请填写重量" />
          </Form.Item>
        </Col>}

        {(isShowGift && !isMaiyouli && shopId !== 5 && !IsAuction && !merchantDetail.isThirdCode) && <Col className="gutter-row" span={6}><Form.Item label="是否支持赠送" name={['proInfo', 'gift']}>
          <Select disabled={canOnlyView}>
            <Select.Option value={1}>否</Select.Option>
            <Select.Option value={2}>是</Select.Option>
          </Select>
        </Form.Item></Col>}
        {!isMaterial && <Col className="gutter-row" span={6}><Form.Item label="按核销餐厅开票" name={['proInfo', 'invByStore']}>
          <Select disabled={!allowInvByStore || canOnlyView}>
            <Select.Option value={0}>否</Select.Option>
            <Select.Option value={1}>是</Select.Option>
          </Select>
        </Form.Item></Col>}

        <Form.Item hidden={true} name={['proInfo', 'skuId']}>
          <InputNumber disabled={canOnlyView} />
        </Form.Item>
      </Row>

      {isMaterial && <Row gutter={32} className="form-block">
        <Col span={6}><Form.Item label={$t('发货方')} name={['proInfo', 'expressSite']}>
          <Select disabled={canOnlyView} placeholder={$t('请选择发货方')} >
            {expressSiteList}
          </Select>

        </Form.Item></Col>
        {merchantStockFour.proInfo?.expressSite !== 'MANUAL' && <Col className="gutter-row" span={6}>
          <Form.Item
            label="仓库商品编码"
            name={['proInfo', 'goodNo']}
            rules={[{ required: true, message: '请填写仓库商品编码' }]}
          >
            <Input placeholder="请填写仓库商品编码" />
          </Form.Item>
        </Col>}
        {merchantStockFour.proInfo?.expressSite === 'QIMEN' && <Col className="gutter-row" span={6}>
          <Form.Item
            label="发货仓库编码"
            name={['proInfo', 'warehouseCode']}
            rules={[{ required: true, message: '请填写发货仓库编码' }]}
          >
            <Select disabled={canOnlyView} placeholder={$t('请填写发货仓库编码')} >
              {warehouseCodeList}
            </Select>
          </Form.Item>
        </Col>}
        {merchantStockFour.proInfo?.expressSite === 'QIMEN' && <Col className="gutter-row" span={6}>
          <Form.Item
            label="优先快递"
            name={['proInfo', 'logisticsCode']}
            rules={[{ required: true, message: '请选择优先快递' }]}
          >
            <Select disabled={canOnlyView} placeholder={$t('请选择优先快递')} >
              {expressCompanyList}
            </Select>
          </Form.Item>
        </Col>}
      </Row>}

      <Row gutter={32} className="form-block">
        {/* 关联规格只有o麦金才有,28为虚拟目录下的o麦金，30为第三方下的o麦金 */}
        {(merchantDetail.isNeedExtType || (shopId === 10005 && merchantDetail.isThirdCode)) && (categoryId === 28 || categoryId === 30) && (
          <Col className="gutter-row" span={12}><Form.Item label='关联规格' className="connectCoupon require" >
            <Input.Group compact>
              <Button disabled={canOnlyView} type="link" onClick={() => { relate() }}>{'选择规格'}</Button>
              <Form.Item name='ext' className='hiddenInput' rules={[{ required: true, message: '请选择规格' }]} >
              </Form.Item>
              <Form.Item name='ext' className='hiddenInput'>
              </Form.Item>
              <Form.Item style={{ display: 'none' }} hidden={true} name='extName' >
                <Input />
              </Form.Item>
            </Input.Group>

            {merchantStockFour.selectCrmObj?.membershipSpecCode && <CrmSimpleTable
              data={[merchantStockFour.selectCrmObj]}
            />}
          </Form.Item>
          </Col>
        )}
      </Row>

      {(merchantDetail.isNeedExtType || (shopId === 10005 && merchantDetail.isThirdCode)) && categoryId !== 28 && categoryId !== 30 && <Row gutter={32} className="form-block">
        <Col className="gutter-row" span={12}>
          <Form.Item label='关联卡券' className="connectCoupon require">
            <Button disabled={canOnlyView} type="link" onClick={() => { relate() }}>{'关联卡券编号'}</Button>
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={6}>
          <Form.Item name='ext' rules={[{ required: true, message: '请关联卡券' }]} >
            <Input maxLength={200} disabled={true} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={6}>
          <Form.Item name='extName' rules={[{ required: true, message: '请关联卡券' }]} >
            <Input maxLength={200} disabled={true} />
          </Form.Item>
        </Col>
      </Row>}
      {(shopId === 1 && merchantDetail.isNeedExtTypeEqual3) && !IsAuction && <Row gutter={32} className="form-block">
        <Col className="gutter-row" span={6}>
          <Form.Item label={$t('支持自动续费')} className='expenditure' name={['proInfo', 'autoRenew']}>
            <Select onChange={autoRenew} disabled={canOnlyView}>
              <Select.Option value={1}>是</Select.Option>
              <Select.Option value={0}>否</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        {isExpenditure === 1 && <Col className="gutter-row" span={6}>
          <Form.Item name={['proInfo', 'renewFirstPrice']} label={$t('首次价格')} rules={[{ type: 'number', required: true, message: '请输入首次价格' }]} >
            <InputNumber disabled={canOnlyView} min={0} maxLength={7} />
          </Form.Item>
        </Col>}
        {isExpenditure === 1 && <Col className="gutter-row" span={6}>
          <Form.Item name={['proInfo', 'renewPrice']} label={$t('续费价格')} rules={[{ type: 'number', required: true, message: '请输入续费价格' }]}>
            <InputNumber disabled={canOnlyView} min={0} maxLength={7} />
          </Form.Item>
        </Col>}
        {isExpenditure === 1 && <Col className="gutter-row" span={6}>
          <Tooltip title="请联系支付网关IT同事确认续费模板编号">
            <Form.Item name={['proInfo', 'planId']} label={$t('续费模板编号')} rules={[{ type: 'string', required: true, message: '请输入续费模板编号' }]}>
              <Input disabled={canOnlyView} min={0} />
            </Form.Item>
          </Tooltip>
        </Col>}
      </Row>}
      {merchantDetail.isNeedExtTypeEqual3 && categoryId !== 28 && categoryId !== 30 && (shopId !== 2 && shopId !== 3) && <Row gutter={32} className="form-block">
        <Col className="gutter-row" span={6}>
          <Form.Item label={$t('维护权益详情')} className="connectCoupon" >
            <Button type="link" onClick={() => { relateRights() }}>维护权益详情</Button>
            <Form.Item name='rightsInfoList'>
            </Form.Item>
          </Form.Item>
        </Col>
      </Row>}
    </div>
  )
}));