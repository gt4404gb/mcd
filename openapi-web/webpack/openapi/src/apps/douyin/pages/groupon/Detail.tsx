import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader, Anchor, Menu, Descriptions, Affix, Tag, Form, Input, Button, Row, Col, Popconfirm, message } from '@aurum/pfe-ui';
import { Base64 } from 'js-base64';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import moment from 'moment';
// import { PictureWall } from '@omc/boss-widgets';
import PictureWall from '@/compoments/picture-wall/PictureWall';
import constants from '@/apps/douyin/common/constants';
import common from '@omc/common';
import * as apis from '@/apps/douyin/common/apis';
import CustomerReservedInfoInput from '../../components/groupon/CustomerReservedInfoInput';
import QRDialog from '../../components/groupon/QRDialog';
import './styles/Detail.less';

const { getEntityColumnLabel, getEntityColumnColor } = common.helpers;
const helpMsg: string = '该字段信息来自草稿箱';
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

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

    category_id: constants.groupon.category_id.FAST_FOOD_AND_SNACK.value,
    sale_valid_moment: [],
    order_valid_moment: [],
    valid_time_type: constants.groupon.valid_time_type.TIME_RANGE.value,
  });

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
        if (draft.groupon.detail_images && draft.groupon.detail_images.length > 1) {
          groupon.detail_images = draft.groupon.detail_images;
          helpers.detail_images = true;
        }
        if (draft.groupon.poi_ids && draft.groupon.poi_ids.length > 1) {
          groupon.poi_ids = draft.groupon.poi_ids;
          helpers.poi_ids = true;
        }
        setHelpers({ ...helpers });
      }
      groupon.cover_images = groupon.cover_images || [];
      groupon.detail_images = groupon.detail_images || [];
      setEntity(groupon);
    }
  }

  useEffect(() => {
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

  return (<div className="douyin-groupon-detail">
    <div className="detail-info-wrapper">
      {qrDialogVisible && <QRDialog url={h5url4Qr} show={qrDialogVisible}
        title="抖音H5地址"
        onClose={() => {
          setQrDialogVisible(false);
          setH5url4Qr(null);
        }} />}
      {/* <Affix offsetTop={90}>
        <Anchor>
          <Anchor.Link href="#groupon-summary" title="基础信息" />
          <Anchor.Link href="#groupon-price-and-stock" title="价格库存" />
          <Anchor.Link href="#API" title="API">
            <Anchor.Link href="#Anchor-Props" title="Anchor Props" />
            <Anchor.Link href="#Link-Props" title="Link Props" />
          </Anchor.Link>
        </Anchor>
      </Affix> */}

      <PageHeader
        ghost={false}
        title="团购商品详情查看"
        // subTitle={(entity.status !== constants.groupon.status.AUDIT_IN_PROGRESS.value && entity.audit_msg) ? entity.audit_msg : null}
        tags={grouponId ? <div><Tag
          color={getEntityColumnColor(constants.groupon.status, entity.status)}>
          {getEntityColumnLabel(constants.groupon.status, entity.status)}
        </Tag>
        </div> : []}
      >
        {/* <Menu mode="horizontal">
          <a href="#groupon-summary"><Menu.Item key="summary" icon={<MailOutlined />}>
            基础信息
          </Menu.Item></a>
          <Menu.Item key="description" icon={<MailOutlined />}>
            图文信息
          </Menu.Item>
          <a href="#groupon-price-and-stock"><Menu.Item key="stock_and_price" icon={<MailOutlined />}>
            价格库存
          </Menu.Item></a>
          <Menu.Item key="service" icon={<MailOutlined />}>
            服务履约
          </Menu.Item>
          <Menu.Item key="others" icon={<MailOutlined />}>
            其他设置
          </Menu.Item>
        </Menu> */}
        <Anchor>
          <Anchor.Link href="#groupon-summary" title="基础信息" />
          <Anchor.Link href="#groupon-detail" title="图文信息" />
          <Anchor.Link href="#groupon-price-and-stock" title="价格库存" />
          <Anchor.Link href="#groupon-service" title="服务履约" />
          <Anchor.Link href="#groupon-others" title="其他设置" />
        </Anchor>
      </PageHeader>

      <div className="main-body">
        <Form
          form={form}
          initialValues={entity}
        >
          <Form.Item labelCol={{ span: 4 }} hidden={true} name="groupon_id"><Input /></Form.Item>

          {(entity.status === constants.groupon.status.AUDIT_REJECTED.value && entity.audit_msg) &&
            <div className="page-block" id="faild-reason" >
              <div className="title">审核失败原因</div>
              <Row gutter={20}>
                <Col span="7">
                  <div>{entity.audit_msg}</div>
                </Col>
              </Row>
            </div>}

          <div className="page-block" id="groupon-summary" >
            <div className="title">基础信息</div>
            <Row gutter={20}>
              <Col span="7">
                <Form.Item labelCol={{ span: 4 }} label={$t('商品分类')} name="category_id" >
                  {getEntityColumnLabel(constants.groupon.category_id, entity.category_id)}  {helpers.category_id && <span className="notice">({helpMsg})</span>}
                </Form.Item>
                {entity.actual_groupon_id && <Form.Item labelCol={{ span: 4 }} label={$t('团购编号')} className="vertical-center" >
                  {entity.actual_groupon_id}&nbsp;&nbsp;
                  <CopyToClipboard key="cpoy-paste-id" text={entity.actual_groupon_id} onCopy={() => { message.success('团购编号成功复制到剪贴板'); }}>
                    <Button type="link">复制</Button>
                  </CopyToClipboard>
                </Form.Item>}
                <Form.Item labelCol={{ span: 4 }} label={$t('团购标题')} >
                  {entity.title}
                </Form.Item>
                {entity.h5_url && <Form.Item labelCol={{ span: 4 }} label={$t('H5地址')} className="h5-url-field">
                  <div className="content">
                    <a target="_blank" href={entity.h5_url} className="col-link" >{entity.h5_url}</a>
                    <div className="col-action">
                      <Button type="link" onClick={() => {
                        setQrDialogVisible(true);
                        setH5url4Qr(entity.h5_url);
                      }}>二维码</Button>
                    </div>
                    <div className="col-action">
                      <CopyToClipboard key="cpoy-paste-h5" text={entity.h5_url} onCopy={() => { message.success('H5地址成功复制到剪贴板'); }}>
                        <Button type="link">复制</Button>
                      </CopyToClipboard>
                    </div>
                  </div>
                </Form.Item>}
                <Form.Item labelCol={{ span: 4 }} label={$t('售卖起止时间')} >
                  {entity.sale_valid_moment.length == 2 &&
                    <div>{entity.sale_valid_moment[0].format(DATE_FORMAT)} ~ {entity.sale_valid_moment[1].format(DATE_FORMAT)}</div>
                  }
                </Form.Item>
              </Col>
            </Row>
          </div>

          <section className="page-block">
            <div id="groupon-detail" className="title">图文信息</div>
            <Row gutter={20}>
              <Col span="7">
                <Form.Item labelCol={{ span: 4 }} label={$t('封面图')} name="cover_images">
                  <PictureWall
                    disabled
                  />
                </Form.Item>
                <Form.Item labelCol={{ span: 4 }} label={$t('团购须知')} >
                  {entity.notification}
                </Form.Item>
                <Form.Item labelCol={{ span: 4 }} label={$t('商品组')}>
                  {entity.pay_item_groups?.map((group: any, key: number) => {
                    return <div key={key}>
                      <div className="group-row">
                        <span>{group.group_name}</span>
                        <span>任选 {group.option_count} 项</span>
                      </div>
                      {group.item_list.length > 0 && <table className="items-row">
                        <thead>
                          <tr>
                            <th>名字</th>
                            <th>单价（元）</th>
                            <th>数量</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.item_list.map((item: any, itemKey: number) => {
                            return <tr className="item-row" key={itemKey}>
                              <td>{item.name}</td>
                              <td>{(item.price / 100).toFixed(2)}</td>
                              <td>{item.count}</td>
                            </tr>
                          })}
                        </tbody>
                      </table>}
                    </div>
                  })}
                </Form.Item>
              </Col>
            </Row>
          </section>

          <section className="page-block">
            <div id="groupon-price-and-stock" className="title">价格库存</div>
            <Row gutter={20}>
              <Col span="7">
                <Form.Item labelCol={{ span: 4 }} label={$t('价格')}>
                  {(entity.actual_amount / 100).toFixed(2)}
                </Form.Item>
                <Form.Item labelCol={{ span: 4 }} label={$t('总库存')}>
                  {entity.stock}
                </Form.Item>
                <Form.Item labelCol={{ span: 4 }} label={$t('单用户购买上限')} >
                  {entity.order_limit}
                </Form.Item>
              </Col>
            </Row>
          </section>

          <section className="page-block">
            <div id="groupon-service" className="title">服务履约</div>
            <Row gutter={20}>
              <Col span="7">
                <Form.Item labelCol={{ span: 4 }} label={$t('券码使用方式')} >{getEntityColumnLabel(constants.groupon.use_type, entity.use_type || constants.groupon.use_type.VERIFIED_IN_STORE.value)}</Form.Item>
                <Form.Item labelCol={{ span: 4 }} label={$t('券码生成方式')} >{getEntityColumnLabel(constants.groupon.code_type, entity.code_type || constants.groupon.code_type.THIRD.value)}</Form.Item>
                <Form.Item labelCol={{ span: 4 }} label={$t('ECS SKU ID')}>
                  {entity.out_id} {helpers.out_id && <span className="notice">({helpMsg})</span>}
                </Form.Item>
                <Form.Item labelCol={{ span: 4 }} label={$t('券码有效类型')} >
                  {getEntityColumnLabel(constants.groupon.valid_time_type, entity.valid_time_type)}
                </Form.Item>
                {entity.valid_time_type === constants.groupon.valid_time_type.TIME_RANGE.value ?
                  <Form.Item labelCol={{ span: 4 }} label={$t('券码有效时间')} >
                    {entity.order_valid_moment.length == 2 &&
                      <div>{entity.order_valid_moment[0].format(DATE_FORMAT)} ~ {entity.order_valid_moment[1].format(DATE_FORMAT)}</div>
                    }
                  </Form.Item>
                  :
                  <Form.Item labelCol={{ span: 4 }} label={$t('有效天数')}>
                    {entity.post_purchase_day} 天
                  </Form.Item>
                }
              </Col>
            </Row>
          </section>

          <section className="page-block">
            <div id="groupon-others" className="title">其他信息</div>
            <Row gutter={20}>
              <Col span="7">
                <Form.Item labelCol={{ span: 4 }} label={$t('使用门店')}>
                  {entity.supplier_ext_id_list && entity.supplier_ext_id_list.join(',')}
                </Form.Item>
                <Form.Item labelCol={{ span: 4 }} label={$t('POI编号列表')} >
                  {entity.poi_ids && entity.poi_ids.join(',')} {helpers.poi_ids && <span className="notice">({helpMsg})</span>}
                </Form.Item>
                <Form.Item labelCol={{ span: 4 }} label={$t('商家名称')} >
                  {entity.merchant_name}
                </Form.Item>
                <Form.Item labelCol={{ span: 4 }} label={$t('联系方式')}>
                  {entity.service_number}
                </Form.Item>
                <Form.Item labelCol={{ span: 4 }} label={$t('留资信息')} name="customer_reserved_info">
                  <CustomerReservedInfoInput disabled />
                </Form.Item>
              </Col>
            </Row>
          </section>
        </Form>
      </div>
    </div>
  </div>);
}