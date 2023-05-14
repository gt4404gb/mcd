import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader, Anchor, Menu, Descriptions, Affix, Tag, Form, Input, Button, Row, Col, Radio, Popconfirm, message, Tooltip, InputNumber, Select, notification } from '@aurum/pfe-ui';
import { Base64 } from 'js-base64';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import moment from 'moment';
import { DateRangePicker } from '@omc/boss-widgets';
import PictureWall from '@/compoments/picture-wall/PictureWall';
import constants from '@/apps/douyin/common/constants';
import common from '@omc/common';
import * as apis from '@/apps/douyin/common/apis'
import PayItemGroups from '../../components/groupon/PayItemGroups';
import PriceInput from '../../components/libs/PriceInput';
import StockInput from '../../components/groupon/StockInput';
import IdsInput from '../../components/libs/IdsInput';
import CustomerReservedInfoInput from '../../components/groupon/CustomerReservedInfoInput';
import QRDialog from '../../components/groupon/QRDialog';
import helper from '../../common/helper';
import './styles/Edit.less';

const { getEntityColumnLabel, getEntityColumnColor, getEntityColumnOptions } = common.helpers;
const helpMsg: string = '该字段信息来自草稿箱';

export default ({ history }: any) => {
  const [loading, setLoading]: any = useState(false);
  const [qrDialogVisible, setQrDialogVisible]: any = useState(false);
  const [h5url4Qr, setH5url4Qr]: any = useState(null);
  const [helpers, setHelpers]: any = useState({});

  const [entity, setEntity]: any = useState({
    stock: 999,
    order_limit: 999,
    cover_images: [],
    detail_images: [],
    category_id: '1017001',
    sale_valid_moment: [],
    order_valid_moment: [],
    valid_time_type: constants.groupon.valid_time_type.TIME_RANGE.value,
    merchant_name: '金拱门（中国）有限公司',
    service_number: '4009200205',
    customer_reserved_info: {
      allow: true,
      allow_tel: true,
    }
  });
  const [categorOptions, setCategorOptions]: any = useState([]);

  const [form] = Form.useForm();
  const { grouponId }: any = useParams();

  const fetchDetail: any = async (grouponId: any) => {
    if (!grouponId) return;
    const { data: detail }: any = await apis.getDouyinModule().getGroupon(grouponId);
    if (detail.data?.groupons?.[0]) {
      const groupon: any = detail.data.groupons[0];

      groupon.sale_valid_moment = [
        moment(groupon.start_time * 1000),
        moment(groupon.end_time * 1000),
      ];
      if (groupon.valid_time_type === constants.groupon.valid_time_type.TIME_RANGE.value) {
        groupon.order_valid_moment = [
          moment(groupon.order_valid_start_time * 1000),
          moment(groupon.order_valid_end_time * 1000),
        ];
      }

      const { data: draft }: any = await apis.getDouyinModule().getGrouponDraft(groupon.groupon_id);
      if (draft?.groupon) {
        if (draft.groupon.out_id) {
          groupon.out_id = draft.groupon.out_id;
          helpers.out_id = true;
        }
        if (draft.groupon.category_id) {
          groupon.category_id = draft.groupon.category_id;
          helpers.category_id = true;
        }
        if (draft.groupon.detail_images) {
          groupon.detail_images = draft.groupon.detail_images;
          helpers.detail_images = true;
        }
        if (draft.groupon.poi_ids) {
          groupon.poi_ids = draft.groupon.poi_ids;
          helpers.poi_ids = true;
        }
        setHelpers({ ...helpers });
      }
      groupon.cover_images = groupon.cover_images || [];
      groupon.detail_images = groupon.detail_images || [];

      groupon.customer_reserved_info = {
        allow: true,
        allow_tel: true,
      };
      setEntity(groupon);
    }
  }

  const save: any = async (formData: any) => {
    setLoading(true);
    if (formData.sale_valid_moment) {
      if (formData.sale_valid_moment[0]) formData.start_time = parseInt(formData.sale_valid_moment[0].format('X'));
      if (formData.sale_valid_moment[1]) formData.end_time = parseInt(formData.sale_valid_moment[1].format('X'));
    }
    if (formData.order_valid_moment) {
      if (formData.order_valid_moment[0]) formData.order_valid_start_time = parseInt(formData.order_valid_moment[0].format('X'));
      if (formData.order_valid_moment[1]) formData.order_valid_end_time = parseInt(formData.order_valid_moment[1].format('X'));
    }

    formData.cover_images = formData.cover_images?.map((img: any) => img.url || img);
    formData.detail_images = formData.detail_images?.map((img: any) => img.url || img);

    const resp: any = await apis.getDouyinModule().saveGroupon({ ...entity, ...formData });
    helper.handleMessage(resp, '团购商品保存成功', () => {
      history.push('/openapi/douyin/groupons');
    })
    setLoading(false);
  }

  useEffect(() => {
    setCategorOptions(getEntityColumnOptions(constants.groupon.category_id));

    if (grouponId) {
      fetchDetail(encodeURIComponent(Base64.decode(grouponId)));
    }
    return () => {
      setEntity({});
    }
  }, [grouponId]);

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  return (<div className="douyin-groupon-edit">
    <div className="edit-info-wrapper">
      {qrDialogVisible && <QRDialog url={h5url4Qr} show={qrDialogVisible}
        title="抖音H5地址"
        onClose={() => {
          setQrDialogVisible(false);
          setH5url4Qr(null);
        }} />}
      <Form
        form={form}
        layout="vertical"
        className="edit-form"
        initialValues={entity}
        onFinish={(values: any) => {
          save(values);
        }}
        onValuesChange={(chgValues: any, values: any) => {
          if ('valid_time_type' in chgValues) {
            setEntity({ ...entity, ...values });
          }
        }}>

        <PageHeader
          ghost={false}
          title="团购商品详情编辑"
          // subTitle={(entity.status !== constants.groupon.status.AUDIT_IN_PROGRESS.value && entity.audit_msg) ? entity.audit_msg : null}
          tags={grouponId ? <div><Tag
            color={getEntityColumnColor(constants.groupon.status, entity.status)}>
            {getEntityColumnLabel(constants.groupon.status, entity.status)}
          </Tag>
          </div> : []}
          extra={[
            <Button loading={loading} key="save" type="primary" htmlType="button" onClick={() => {
              form.submit();
            }}>保存</Button>,
            <Popconfirm key="cancel" onConfirm={() => {
              history.push('/openapi/douyin/groupons');
            }} title={`取消后所有编辑的数据将丢失，确认要取消吗？`} okText="确认" cancelText="取消" >
              <Button >取消</Button>
            </Popconfirm>
          ]}
        >
          <Anchor>
            <Anchor.Link href="#groupon-summary" title="基础信息" />
            <Anchor.Link href="#groupon-detail" title="图文信息" />
            <Anchor.Link href="#groupon-price-and-stock" title="价格库存" />
            <Anchor.Link href="#groupon-service" title="服务履约" />
            <Anchor.Link href="#groupon-others" title="其他设置" />
          </Anchor>
        </PageHeader>

        <div className="main-body">
          <Form.Item labelCol={{ span: 4 }} hidden={true} name="groupon_id"><Input /></Form.Item>

          {(entity.status === constants.groupon.status.AUDIT_REJECTED.value && entity.audit_msg) &&
            <div className="page-block" id="faild-reason" >
              <div className="title">审核失败原因</div>
              <Row gutter={20}>
                <Col span="24">
                  <div>{entity.audit_msg}</div>
                </Col>
              </Row>
            </div>}

          <div className="page-block" id="groupon-summary" >
            <div className="title">基础信息</div>
            <Row gutter={20}>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('商品分类')} name="category_id" help={helpers.category_id ? helpMsg : null}>
                  <Select options={categorOptions} placeholder="请选择商品分类" />
                </Form.Item>
              </Col>
              {entity.actual_groupon_id && <Col span="4"><Form.Item labelCol={{ span: 4 }} label={$t('团购编号')} className="vertical-center" >
                {entity.actual_groupon_id}&nbsp;&nbsp;
                <CopyToClipboard key="cpoy-paste-id" text={entity.actual_groupon_id} onCopy={() => { message.success('团购编号成功复制到剪贴板'); }}>
                  <Button type="link">复制</Button>
                </CopyToClipboard>
              </Form.Item></Col>}
              <Col span="4"><Form.Item labelCol={{ span: 4 }} label={$t('团购标题')} name="title" rules={[{ required: true }]}>
                <Input maxLength={30} placeholder="请输入团购标题" />
              </Form.Item></Col>
              {entity.h5_url && <Col span="4"><Form.Item labelCol={{ span: 4 }} label={$t('H5地址')} className="h5-url-field">
                <div className="content">
                  <a target="_blank" href={entity.h5_url} className="col-link" >{entity.h5_url}</a>

                  <div className="actions">
                    <Button type="link" onClick={() => {
                      setQrDialogVisible(true);
                      setH5url4Qr(entity.h5_url);
                    }}>二维码</Button>
                    <CopyToClipboard key="cpoy-paste-h5" text={entity.h5_url} onCopy={() => { message.success('H5地址成功复制到剪贴板'); }}>
                      <Button type="link">复制</Button>
                    </CopyToClipboard>
                  </div>
                </div>
              </Form.Item></Col>}
              <Col span="4"><Form.Item className="moment-field" labelCol={{ span: 4 }} label={$t('售卖起止时间')} name="sale_valid_moment" rules={[{ required: true }]}>
                <DateRangePicker
                  showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                  format="YYYY-MM-DD HH:mm:ss"
                  disabledDate={(current: any) => current && current < moment().startOf('day')}
                  placeholder={[
                    '售卖开始时间', '售卖结束时间'
                  ]} />
              </Form.Item></Col>
            </Row>
          </div>

          <section className="page-block">
            <div id="groupon-detail" className="title">图文信息</div>
            <Row gutter={20}>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('封面图')} name="cover_images"
                  extra='单张图片不大于5M, 分辨率不低于 640*360px'
                  rules={[{ required: true, message: '请上传封面图' }]}>
                  <PictureWall
                    maxLength={5}
                    minWidth={640}
                    minHeight={360}
                    maxBytes={5 * 1024 * 1024}
                    allowedMimes={['png', 'jpg', 'jpeg']}
                  />
                </Form.Item>
              </Col>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('团购须知')} name="notification" rules={[{ required: true }]}>
                  <Input.TextArea maxLength={500} placeholder="请输入团购须知" rows={6} showCount />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={20}>
              <Col span="12">
                <Form.Item labelCol={{ span: 4 }} label={$t('商品组')} name="pay_item_groups"
                  rules={[
                    {
                      validator: async (_: any, groups: any) => {
                        if (!groups) return;
                        let isError: boolean = false;
                        groups = groups || [];
                        if (groups.length < 1) return;
                        const firstGroup: any = groups[0] || {};

                        if (!isError) {
                          if (!firstGroup.group_name) throw new Error('请输入商品组名称')
                        }

                        if (!isError) {
                          firstGroup.item_list = firstGroup.item_list || [];
                          if (firstGroup.item_list < 1) {
                            isError = true;
                          }
                        }
                        if (isError) {
                          throw new Error(`请至少输入一个商品组`);
                        }
                        groups.forEach((g: any) => {
                          g.item_list.forEach((item: any) => {
                            if (!item.price) {
                              throw new Error('商品项价格不能为空');
                            } else {
                              if (item.price > 200000) {
                                throw new Error('商品项价格不能大于2000元');
                              }
                            }
                          })
                        });
                      }
                    }
                  ]}>
                  <PayItemGroups />
                </Form.Item>
              </Col>

            </Row>
          </section>

          <section className="page-block">
            <div id="groupon-price-and-stock" className="title">价格库存</div>
            <Row gutter={20}>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('价格')} name="actual_amount" rules={[
                  {
                    required: true
                  },
                  {
                    validator: async (_: any, value: any) => {
                      let v: any = parseFloat(value);
                      const MAX_PRICE_CENT = 200000;
                      if (!isNaN(v)) {
                        if (v > MAX_PRICE_CENT) {
                          throw new Error(`价格不能超过 ${MAX_PRICE_CENT / 100} 元`);
                        }
                      }
                    }
                  }
                ]}>
                  <PriceInput originalValue={entity.original_amount} maxLength={7} />
                </Form.Item>
              </Col>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('总库存')} name="stock" rules={[{ required: true }]}>
                  <StockInput countSold={entity.sold_count} />
                </Form.Item>
              </Col>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('单用户购买上限')} name="order_limit" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={1} max={99999} maxLength={5} />
                </Form.Item>
              </Col>
            </Row>
          </section>

          <section className="page-block">
            <div id="groupon-service" className="title">服务履约</div>
            <Row gutter={20}>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('券码使用方式')} >{getEntityColumnLabel(constants.groupon.use_type, entity.use_type || constants.groupon.use_type.VERIFIED_IN_STORE.value)}</Form.Item>
              </Col>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('券码生成方式')} >{getEntityColumnLabel(constants.groupon.code_type, entity.code_type || constants.groupon.code_type.THIRD.value)}</Form.Item>
              </Col>
              <Col span="4">
               
              </Col>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('ECS SKU ID')} name="out_id" help={helpers.out_id ? helpMsg : null}>
                  <Input maxLength={32} placeholder="请输入 ECS SKU ID" />
                </Form.Item>
              </Col>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('券码有效类型')} name="valid_time_type">
                  <Radio.Group options={getEntityColumnOptions(constants.groupon.valid_time_type)} />
                </Form.Item>
              </Col>
              {entity.valid_time_type === constants.groupon.valid_time_type.TIME_RANGE.value ?
                <Col span="4"><Form.Item className="moment-field" labelCol={{ span: 4 }} label={$t('券码有效时间')} name="order_valid_moment">
                  <DateRangePicker
                    showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                    format="YYYY-MM-DD HH:mm:ss"
                    placeholder={['券码有效开始时间', '券码有效结束时间']} />
                </Form.Item></Col>
                :
                <Col span="4"><Form.Item labelCol={{ span: 4 }} label={$t('有效天数')} name="post_purchase_day">
                  <InputNumber min={1} max={180} maxLength={3} />
                </Form.Item></Col>
              }
            </Row>
          </section>

          <section className="page-block">
            <div id="groupon-others" className="title">其他信息</div>
            <Row gutter={20}>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('使用门店')} name="supplier_ext_id_list">
                  <IdsInput addonBefore='个门店' placeholder="多个门店请使用英文逗号分割，示例：1990262,1450997,3330455" />
                </Form.Item>
              </Col>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('POI编号列表')} name="poi_ids" help={helpers.poi_ids ? helpMsg : null}>
                  <IdsInput placeholder="多个编号请使用英文逗号分割，示例：0352366,7345667,9241132" />
                </Form.Item>
              </Col>
              <Col span="4">
                
              </Col>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('商家名称')} name="merchant_name" rules={[{ required: true }]}>
                  <Input maxLength={50} placeholder="请输入商家名称" />
                </Form.Item>
              </Col>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('联系方式')} name="service_number" rules={[{ required: true }]}>
                  <Input maxLength={20} placeholder="请输入联系方式" />
                </Form.Item>
              </Col>
              <Col span="4">
                <Form.Item labelCol={{ span: 4 }} label={$t('留资信息')} name="customer_reserved_info">
                  <CustomerReservedInfoInput disabled />
                </Form.Item>
              </Col>
            </Row>
          </section>
        </div>
      </Form>
    </div>
  </div>);
}