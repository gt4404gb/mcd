import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { withRouter, useParams } from 'react-router-dom';
import { Form, Row, Col, message, Select, Radio, Button, Space, Input, InputNumber, Checkbox, IconFont, Tooltip } from '@aurum/pfe-ui';
import * as apis from '@/common/net/apis';
import * as apisEdit from '@/common/net/apis_edit';
import * as merchantAction from '@/redux/actions/merchantAction'
import { getMerchantChannelOptions, getB2bManager } from '@/common/helper';
import SelectCity from '@/components/SelectCity';
import SelectMerchants from '@/components/SelectMerchants';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';
import { sanitizeToInteger } from '@/common/helper';
const { Option } = Select;

const initialMerchantRule = {
  cityConfig: {
    flag: 1, // 0全国 1白名单 2黑名单
    cities: [],//售卖城市
  },
  channels: [],//售卖渠道
  deductType: 1,//库存扣减方式：1-拍下扣减；2-支付扣减
  orderCancel: 0,//售后服务支持取消订单：0：不支持；1：支持
  autoRefund: 0, //是否支持过期自动退：0:不支持 1:支持
  bossOrderCancel: 1,//后台售后服务支持取消订单：0：不支持；1：支持
  expressType: 0, //"类型:0-统一运费；1-运费模板"
  expressFee: '',  //快递运费
  expressTemplates: '', //运费模板
  deliveryCity: '',//发货城市
  deliveryTime: '', //发货时间
  merchants: [], //商户信息
  merchantsNum: -1, //商户信息用于计算
  merchantsList: [] //商户信息用于记录特定
}

const mapStateToProps = (state: any) => {
  return {
    executeAction: state.merchant.executeAction,
    currentStep: state.merchant.currentStep,
    merchantDetail: state.merchant.merchantDetail,
    shopId: state.merchant.shopId
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  resetExecuteAction: (payload: any) => dispatch({
    type: merchantAction.MERCHANT_EXECUTE_ACTION,
    payload
  }),
  gotoNexStep: (payload: any) => dispatch({
    type: merchantAction.MERCHANT_NEXT_STEP,
    payload
  }),
  putSaleCities: (payload: any) => dispatch({
    type: merchantAction.MERCHANT_SALE_CITYS,
    payload
  }),
  initThirdParties: (payload: any) => dispatch({
    type: merchantAction.MERCHANT_THIRDPARTIES,
    payload
  }),
});

export default connect(mapStateToProps, mapDispatchToProps)((({ STEP, currentStep, onActionCompleted, executeAction, resetExecuteAction, merchantDetail, shopId, gotoNexStep, putSaleCities, initThirdParties }: any) => {
  const [merchantRule, setMerchantRule]: any = useState(initialMerchantRule);
  const [canEdit, setCanEdit]: any = useState(true);
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const { spuId, isShow }: any = useParams();
  const [cityOptions, setCityOptions]: any = useState([]);
  const [saleOptions, setSaleOptions]: any = useState([]);
  const [manager, setManager]: any = useState([]);
  const [queryCity, setQueryCity]: any = useState([]);
  const isCreated: any = useRef(true);
  const maxCityLen = useRef(0);
  const allCityCode: any = useRef([]);
  const [canOnlyView, setCanOnlyView] = useState(location.search === '?canOnlyView' ? true : false);
  const [isMaterial, setIsMaterial]: any = useState(false); //是否是实物品类
  const [checked, setChecked] = useState(false);
  const [showSelect, setShowSelect]: any = useState(1);

  useEffect(() => {
    //获取初始城市数据
    const options = queryCity && queryCity.map((c: any) => {
      return <Option key={c.cityCode} value={c.cityCode}>{c.acronym}{c.cityName}</Option>
    })
    setCityOptions(options);
  }, [queryCity]);

  useEffect(() => {
    return () => {
      setMerchantRule({ ...initialMerchantRule });
    }
  }, []);

  useEffect(() => {
    if (!shopId) {
      return
    }
    (async () => {
      const { data: filterObj } = await apis.getMerchantModule().filter({ shopId: shopId });
      if (filterObj?.cities?.length > 0) {
        setQueryCity(filterObj.cities);
        maxCityLen.current = filterObj.cities.length;
        filterObj.cities.forEach((item: any) => {
          allCityCode.current.push(item.cityCode);
        })
      }
      if (filterObj?.channel?.length > 0) {
        setSaleOptions(getMerchantChannelOptions(filterObj.channel));
      }
      if (filterObj?.thirdParties?.length) {
        initThirdParties(filterObj.thirdParties)
      }
    })()
  }, [shopId]);

  useEffect(() => {
    if (!merchantRule || merchantRule.shopType !== 2) {
      return
    }
    (async () => {
      const { data: result } = await apisEdit.getBMSModule().fetchMerchantList({});
      if (result?.length > 0) {
        setManager(getB2bManager(result));
      }
    })()
  }, [merchantRule]);

  useEffect(() => {
    if (spuId) {
      (async () => {
        let _merchantRule: any = merchantRule;
        try {
          const { data: proInfo }: any = await apisEdit.getMerchantModule().getCommodityRule({ spuId: spuId })
          if (isShow === 'isShow' || proInfo?.status === 3 || proInfo?.status === 5 || !checkMyPermission('ecs:ecsLego:productedit')) {
            //WAREHOUSE(1, "仓库中"),SELLING(2, "已上架"),SELL_OUT(3, "已售罄"),OFF_THE_SHELF(4, "已下架"),
            setCanOnlyView(true)
          } else {
            setCanOnlyView(false)
          }
          if (proInfo.commodityType == '2') { //"商品类型：1虚拟商品：2实体物品"
            setIsMaterial(true);
          }
          if (proInfo.autoRefund === 1) {
            setChecked(true)
          } else {
            setChecked(false)
          }

          if (proInfo?.channels?.length) {
            isCreated.current = false;
            //对城市‘无限’做匹配
            if(proInfo.cityConfig) {
              proInfo.cityConfig = JSON.parse(proInfo.cityConfig);
              if (proInfo.cityConfig.cities && proInfo.cityConfig.cities.length === 1 && proInfo.cityConfig.cities[0] == '-1') {
                proInfo.cityConfig.cities = ['全国可售']
              }
            } else {
              proInfo.cityConfig = {flag: 1, cities: []};
            }
            setShowSelect(proInfo.cityConfig?.flag)
            //对商户全部做匹配
            if (proInfo.merchants && proInfo.merchants.length === 1 && proInfo.merchants[0] == '-1') {
              proInfo.merchantsNum = -1
            } else {
              proInfo.merchantsNum = 1;
              proInfo.merchantsList = proInfo.merchants;
            }

          } else {
            isCreated.current = true;
            proInfo.cityConfig = {flag: 1, cities: []};
            proInfo.merchantsNum = -1
            proInfo.deductType = 1;
          }

          _merchantRule = proInfo;
        } catch { }
        if (_merchantRule) {
          setMerchantRule({ ..._merchantRule });
        }
      })();
    }
  }, [spuId]);

  useEffect(() => {
    form.resetFields(Object.keys(merchantRule));
  }, [merchantRule]);

  useEffect(() => {
    if (executeAction && currentStep === STEP) {
      resetExecuteAction(false);
      form.submit();
    }
  }, [executeAction])

  const onChange = (e: any) => {
    setChecked(e.target.checked);
    let _merchantRule = form.getFieldsValue(merchantRule);
    _merchantRule.autoRefund = e.target.checked ? 1 : 0;
    form.setFieldsValue({
      merchantRule: _merchantRule,
    });
    setMerchantRule({ ...merchantRule, ..._merchantRule });
  };

  const renderTextErea: any = () => {
    if(!form.getFieldValue('cityConfig') || showSelect == 0) {
      return
    };
    return <Col className="gutter-row" span={12} style={{ padding: 0 }}>
    <Form.Item label={$t('售卖城市')} name={['cityConfig', 'cities']} rules={[{ required: true }]}>
      <SelectCity disabled={canOnlyView} cityOptions={cityOptions} mode='multiple' />
    </Form.Item>
  </Col>
  }

  return (
    <div className={currentStep === STEP ? 'edit-rule' : 'hide'}>
      <Form
        ref={formEl}
        layout="vertical"
        initialValues={merchantRule}
        form={form}
        onFinishFailed={(values) => {
          onActionCompleted(false);
        }}
        onFinish={(values) => {
          if(values.cityConfig.flag == 0) {
            values.cityConfig.cities = ['-1']
          } else {
            if ((values.cityConfig.cities?.length === maxCityLen.current) || (values.cityConfig.cities?.length === 1 && values.cityConfig.cities?.[0] == '全国可售')) {
              values.cityConfig.cities = ['-1']
              if(values.cityConfig.flag == 1) values.cityConfig.flag = 0 
            }
          } 
          let cities = values.cityConfig.cities
          values.cityConfig = JSON.stringify(values.cityConfig);
          if (values.merchantsNum === -1) {
            values.merchants = ['-1']
          } else {
            values.merchants = values.merchantsList;
          }
          values.spuId = spuId;
          values.categoryId = merchantDetail.basicInfo.categoryId;
          values.shopId = shopId;
          (async function () {
            const updatedeMerchantRule = values;
            if (canEdit) {
              const resp = await apisEdit.getMerchantModule().saveCommodityRule(updatedeMerchantRule, isCreated.current);
              if (!resp.success) {
                onActionCompleted(false);
                message.error(resp.message);
              } else {
                onActionCompleted(true);
                if (shopId === 5) {
                  putSaleCities(cities)
                }
                message.success('商品售卖信息保存成功');
              }
            } else {
              if (shopId === 5) {
                putSaleCities(cities)
              }
              onActionCompleted(true);
            }
          })();
        }}
        onValuesChange={(chgValues: any, values: any) => {
          if(chgValues?.cityConfig?.flag || chgValues?.cityConfig?.flag === 0) {
            let cityConfig = {
              flag: chgValues?.cityConfig?.flag,
              cities: []
            }
            setShowSelect(chgValues?.cityConfig?.flag)
            if (chgValues?.cityConfig?.flag) {
              form.setFieldsValue({...merchantRule, cityConfig: {
                flag: chgValues?.cityConfig?.flag, 
                cities: []
              }})
            }
          }
          const keysToUpdateActivityDetail: any = ['merchantsNum'];
          keysToUpdateActivityDetail.map((key: string) => {
            if (values?.[key] !== undefined) {
              merchantRule[key] = values[key];
              setMerchantRule({ ...merchantRule, ...values });
            }
          })
        }}
      >
        <Row><Col span={12}><div className="section-header">上架基本信息</div></Col></Row>
        <Row gutter={32} className="form-block">
          <Col className="gutter-row" span={4}>
            <Form.Item label={$t('限制售卖城市')} name={['cityConfig', 'flag']} rules={[{ required: true }]} extra={shopId == 5 ? '售卖城市修改可能会影响之前的场次配置信息' : ''}>
              <Radio.Group disabled={canOnlyView}>
                <Radio value={0}>全国可售</Radio>
                <Radio value={1}>白名单</Radio>
                <Radio value={2}>黑名单</Radio>
              </Radio.Group>
            </Form.Item>
            {renderTextErea()}
          </Col>
          <Col className="gutter-row" span={4}>
            <Form.Item label={$t('售卖渠道')} name='channels' rules={[{ required: true }]}>
              <Select allowClear mode="multiple" disabled={canOnlyView} placeholder={$t('请选择售卖渠道,可多选')} options={saleOptions} />
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={4}>
            <Form.Item className="composite-required-field" name='deductType' label={$t('库存扣减方式')}>
              <Radio.Group>
                <Radio className="radioStyle" value={1} disabled={canOnlyView}>
                  <Tooltip title="提交订单就扣减库存数量，可能存在恶意占用库存风险">
                    拍下减库存<IconFont type="icon-wenti" style={{color:'#999', marginLeft:'4px'}} />
                  </Tooltip>
                </Radio>
                <Radio className="radioStyle" value={2} disabled={true}>
                  <Tooltip title="付款完成再扣减库存数量，可减少恶拍，存在超卖风险，超卖订单系统会自动退款">
                    付款减库存<IconFont type="icon-wenti" style={{color:'#999', marginLeft:'4px'}} />
                  </Tooltip>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={4}>
            <Form.Item className="composite-required-field" name='bossOrderCancel' label={$t('退改规则')}>
              <Radio.Group>
                <Radio className="radioStyle" value={1} disabled={canOnlyView}>
                  发放后可退
                </Radio>
                <Radio className="radioStyle" value={0} disabled={canOnlyView}>
                  发放后不可退
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={4}>
            <Form.Item label={$t('用户取消')} name='orderCancel'>
              <Radio.Group>
                <Radio className="radioStyle" value={0} disabled={canOnlyView}>
                  <Tooltip title="用户付款后，无法主动取消订单，如需取消只能主动联系客服">
                    不支持退款<IconFont type="icon-wenti" style={{color:'#999', marginLeft:'4px'}} />
                  </Tooltip>
                </Radio>
                <Radio className="radioStyle" value={1} disabled={!merchantRule.allowUserRefundAny || canOnlyView}>
                  <Tooltip title="用户付款后，如未使用/部分使用，可随时申请取消退款。已完成订单不可取消">
                    随时退<IconFont type="icon-wenti" style={{color:'#999', marginLeft:'4px'}} />
                  </Tooltip>
                </Radio>
                <Radio className="radioStyle" value={2} disabled={!merchantRule.allowUserRefundExp || canOnlyView}>
                  <Tooltip title="用户付款后，仅订单券码过期后，可申请取消退款。已完成订单不可取消">
                    过期可退<IconFont type="icon-wenti" style={{color:'#999', marginLeft:'4px'}} />
                  </Tooltip>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={4}>
            <Form.Item name='autoRefund' label={$t('自动退')} extra='订单内券码如未使用或部分使用，则在过期后（T+1 凌晨），自动取消退款，关闭交易。'>
              <Checkbox checked={checked} onChange={onChange} disabled={!merchantRule.allowAutoRefund || canOnlyView}>过期自动退</Checkbox>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={4}>
            {merchantRule.shopType == 2 && <Form.Item className="composite-required-field" label={$t('关联商户')} style={{ marginBottom: 0 }}>
              <Input.Group compact>
                <Form.Item name='merchantsNum' rules={[{ required: true }]} >
                  <Radio.Group disabled={canOnlyView}>
                    <Radio value={-1}>全部</Radio>
                    <Radio value={1}>特定</Radio>
                  </Radio.Group>
                </Form.Item>
              </Input.Group>
            </Form.Item>}
          </Col>
          <Col className="gutter-row" span={4}>
            {merchantRule.shopType == 2 && merchantRule.merchantsNum === 1 && <Form.Item label={$t('选择商户')} name='merchantsList'>
              <SelectMerchants disabled={canOnlyView} cityOptions={manager} mode='multiple' />
            </Form.Item>}
          </Col>
        </Row>

        {isMaterial && <Row>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header">物流信息</div></Col></Row>
            <Row gutter={32} className="form-block">
              <Col className="gutter-row" span={4}>
                <Form.Item name="deliveryTime" label="发货时间" tooltip="小时（限正整数）">
                  <InputNumber style={{ width: '100%' }} placeholder="请填写发货时间" min={1} maxLength={7}
                    formatter={(value: any) => sanitizeToInteger(value)}
                    parser={value => sanitizeToInteger(value) || ''}
                    disabled={canOnlyView}
                  />
                </Form.Item>
              </Col>
              <Col className="gutter-row" span={4}>
                <Form.Item label={$t('发货城市')} name='deliveryCity'>
                  <SelectCity disabled={canOnlyView} cityOptions={cityOptions} showAll={false} labelInValue={true} />
                </Form.Item>
              </Col>
              {/* <Col className="gutter-row" span={4}>
                <Form.Item className="composite-required-field" label={$t('快递运费')} style={{ marginBottom: 0 }}>
                  <Input.Group style={{ width: '100%' }} className='express-fee'>
                    <Form.Item name="expressType" rules={[{ required: true }]} >
                      <Radio.Group disabled={canOnlyView}>
                        <Input.Group>
                          <Radio value={0}>统一邮费（符号¥）</Radio>
                          <Form.Item name="expressFee" rules={[{ type: 'number', required: true, message: '请输入统一邮费' }]} style={{ display: 'block' }} >
                            <InputNumber style={{ width: '100%' }} className="mail-rate" disabled={canOnlyView} placeholder="请输入统一邮费" />
                          </Form.Item>
                        </Input.Group>
                        <Input.Group>
                          <Radio value={1} disabled>运费模板</Radio>
                          <Form.Item name="expressTemplates" style={{ display: 'block' }} >
                            <Select disabled placeholder={$t('请选择限购周期')} />
                          </Form.Item>
                        </Input.Group>
                      </Radio.Group>
                    </Form.Item>
                  </Input.Group>
                </Form.Item>
              </Col> */}

              <Col className="gutter-row" span={4}>
              
                    <Form.Item className="composite-required-field" label={$t('快递运费')} name="expressType" rules={[{ required: true }]} >
                      <Radio.Group disabled={canOnlyView}>
                        <Input.Group style={{display:'flex'}}>
                          <Radio value={0}>统一邮费（符号¥）</Radio>
                          <Form.Item name="expressFee" rules={[{ type: 'number', required: true, message: '请输入统一邮费' }]} style={{ display: 'block' }} >
                            <InputNumber style={{ width: '100%' }} className="mail-rate" disabled={canOnlyView} placeholder="请输入统一邮费" />
                          </Form.Item>
                        </Input.Group>
                        {/* <Input.Group>
                          <Radio value={1} disabled>运费模板</Radio>
                          <Form.Item name="expressTemplates" style={{ display: 'block' }} >
                            <Select disabled placeholder={$t('请选择限购周期')} />
                          </Form.Item>
                        </Input.Group> */}
                      </Radio.Group>
                    </Form.Item>
            
             
              </Col>
              <Col className="gutter-row" span={4}>
                
              </Col>

            </Row>
          </Col>
        </Row>}

        <Row gutter={32} className="form-block">
          <Col style={{ paddingTop: '20px', paddingBottom: '24px', display: 'flex', width: '100%' }}>
            {spuId && canOnlyView && <Button type="primary" onClick={() => onActionCompleted(true)}>{$t('下一步')}</Button>}
            {!canOnlyView && spuId &&
              <Button type="primary" htmlType="submit" >{$t('下一步')}</Button>
            }
            <Button style={{ marginLeft: '8px' }} onClick={() => gotoNexStep(-1)}>{$t('返回上一步')}</Button>
          </Col>
        </Row>
      </Form>
    </div >
  )
}));