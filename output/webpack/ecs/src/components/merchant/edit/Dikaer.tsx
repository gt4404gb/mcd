import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { withRouter, useParams } from 'react-router-dom';
/* @ts-ignore */
import { Form, Input, Row, Col, message, Select, Button, Space } from '@aurum/pfe-ui';
import * as apisEdit from '@/common/net/apis_edit';
import * as merchantAction from '@/redux/actions/merchantAction'
import Prescribed from '@/components/merchant/edit/Prescribed';
import { skuListToShopType } from '@/common/helper';
import descartes from "@/common/dikaerji";
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';
import { dikaerTip } from '@/common/helper';

const initialMerchantStock: any = {
  proInfo: {
    price: '',//SPU商品价格
    stock: '',//SPU库存
  },
  ext: '',
  skuList: [],
  skuModels: [
  ],
  skuImageChecked: false
};

const mapStateToProps = (state: any) => {
  return {
    executeAction: state.merchant.executeAction,
    currentStep: state.merchant.currentStep,
    rewardDependedFields: state.merchant.rewardDependedFields,
    merchantDetail: state.merchant.merchantDetail,
    shopId: state.merchant.shopId,
    isMaiyouli: state.merchant.merchantDetail?.basicInfo?.showPosition?.includes('5')? true: false,
    IsAuction: state.merchant.IsAuction   //是否是拍卖商品
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
});

export default connect(mapStateToProps, mapDispatchToProps)((({ history, STEP, currentStep, onActionCompleted, executeAction, resetExecuteAction, rewardDependedFields, merchantDetail, shopId, gotoNexStep, IsAuction, isMaiyouli }: any) => {
  const [merchantStock, setMerchantStock]: any = useState(JSON.parse(JSON.stringify(initialMerchantStock)));
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const { spuId, isShow }: any = useParams();
  const [specsOption, setSpecsOption] = useState([]);
  const [canOnlyView, setCanOnlyView] = useState(false);
  const isUpdataPicState: any = useRef(false);

  useEffect(() => {
    return () => {
      setMerchantStock({ ...initialMerchantStock });
      gotoNexStep(-STEP);
    }
  }, []);

  const modifyCategoriesData = async (data: any) => {
    if (data && data.length > 0) {
      data.map((item: any) => {
        item.key = item.parentId + item.id;
        item.value = item.parentId + item.id;
        item.title = item.name;
        if (item.subCategories && item.subCategories.length > 0) {
          modifyCategoriesData(item.subCategories);
          item.children = item.subCategories
        }
      });
    }
  };

  useEffect(() => {
    if (spuId) {
      if (!merchantDetail.basicInfo.categoryId) return;
      //查询分类的规格
      (async () => {
        try {
          const { data: specsList }: any = await apisEdit.getMerchantModule().categorySpecs({ categoryId: merchantDetail.basicInfo.categoryId });
          if (specsList) {
            setSpecsOption(specsList);
          } else {
            setSpecsOption([]);
          }
        } catch {
          setSpecsOption([]);
        }
      })();
    }

  }, [spuId, merchantDetail.basicInfo.categoryId])

  useEffect(() => {
    if (spuId) {
      //第三部详情接口
      (async () => {
        let _merchantStock: any = merchantStock;
        try {
          const { data: proInfo }: any = await apisEdit.getMerchantModule().getCommodityStock({ spuId: spuId })
          if (isShow === 'isShow' || proInfo?.status === 2 || proInfo?.status === 3 || proInfo?.status === 5 || !checkMyPermission('ecs:ecsLego:productedit')) {
            //WAREHOUSE(1, "仓库中"),SELLING(2, "已上架"),SELL_OUT(3, "已售罄"),OFF_THE_SHELF(4, "已下架"),
            setCanOnlyView(true)
          } else {
            setCanOnlyView(false)
          }
          if (proInfo?.skuList?.length > 0) {
            const toUpdatedActivityDetail: any = {
              proInfo
            };
            toUpdatedActivityDetail.skuList = [];
            if (proInfo.skuList?.length > 0) {
              proInfo.skuList.forEach((item: any) => {
                if (item.linePrice === 0) {
                  item.linePrice = '';
                }
              })
              toUpdatedActivityDetail.skuList = proInfo.skuList;
              toUpdatedActivityDetail.skuModels = skuListToShopType(toUpdatedActivityDetail.skuList) || [];
              //有规格就不展示配置商品的价格和库存
            }
            _merchantStock = toUpdatedActivityDetail;
          }
        } catch { }
        if (_merchantStock) {
          updataMerchantStock(_merchantStock)
        }
      })();
    }
  }, [spuId]);

  useEffect(() => {
    form.resetFields(Object.keys(merchantStock));
  }, [merchantStock]);

  useEffect(() => {
    if (executeAction && currentStep === STEP) {
      resetExecuteAction(false);
      form.submit();
    }
  }, [executeAction])

  const updataMerchantStock = (merchantStock: any) => {
    setMerchantStock({ ...merchantStock });
  }

  const changeIsUpdataPic = (isUpdataPic: any) => {
    isUpdataPicState.current = isUpdataPic;
  }

  //*******规格相关的操作
  const createSkuList = () => {
    let isUpdataPic = isMaiyouli ? true : isUpdataPicState.current;
    let skuModelsNew = JSON.parse(JSON.stringify(form.getFieldsValue(merchantStock).skuModels));
    console.log('skuModelsNew', skuModelsNew)
    //空规格
    if (skuModelsNew?.length === 0) {
      form.setFieldsValue({
        skuList: []
      });
      let merchantStock1 = form.getFieldsValue(merchantStock);
      merchantStock1.skuModels = [];
      merchantStock1.skuList = [];
      updataMerchantStock(merchantStock1)
      toSubmit(merchantStock1);
      return;
    }

    //1. 对规格名做判空处理
    let some = skuModelsNew.some((obj: any) => {  //some  一真即真
      return !obj.specMain || !obj.models || !obj.models.length
    })
    if (some) {
      message.error('请将商品规格填写完整或者删除此项！');
      return;
    }
    //2. 对规格值大于20个做处理
    let isMoreThen20 = false;
    isMoreThen20 = skuModelsNew.some((item: any) => { return item.models?.length > 20 });
    if (isMoreThen20) {
      message.error('规格值最多可添加20个！');
      return;
    }

    //3.对规格值做判空处理
    let isNullSpecItem = false;
    skuModelsNew.forEach((acc: any) => {
      let arr: any = [];
      acc.models.map((k: any, i: any) => {
        if (!k.specItem) {
          isNullSpecItem = true;
          return;
        }
      })
    })

    if (isNullSpecItem) {
      message.error('请将商品规格值填写完整！');
      return;
    }

    //4 对规格值重复校验
    let isRepeat = false;
    skuModelsNew.forEach((acc: any) => {
      let arr: any = [];
      acc.models.map((k: any, i: any) => {
        arr.push(k.specItem);
        /* @ts-ignore */
        const uniqueArr = [...new Set(arr)];
        if (arr.length != uniqueArr.length) {
          isRepeat = true;
          return;
        }
      })
    })

    if (isRepeat) {
      message.error('商品规格值不能重复，请修改！');
      return;
    }


    //5. 对第一个规格有图片属性，特殊处理
    let skuModelsNewItem: any = skuModelsNew[0];
    let models = skuModelsNewItem?.models || [];
    if (models?.length) {
      if (isUpdataPic) {
        //需要上传图片
        let some = models.some((obj: any) => {  //some  一真即真
          return !obj.specImage;
        })
        if (some) {
          message.error('请上传第一条规格的所有图片！');
          return;
        }
      } else {
        models.map((k: any, i: any) => {
          k.specImage = '';
        })
      }
    }

    // 6. 后续数据转换和操作
    let modelsList: any = [], columnList: any = [], skuObj = {};
    if (skuModelsNew.length > 0) {
      skuModelsNew.forEach((acc: any) => {
        if (acc.models?.length) {
          acc.models.map((k: any, i: any) => {
            if (!k.specItem) {
              delete acc.models[i]
            }
            if (k.specItem) {
              k.specMain = acc.specMain;
              specsOption.forEach((option: any) => {
                if (k.specMain === option.name) {
                  k.specMainId = option.id;
                }
              })
            }
          })
          modelsList.push(acc.models);
        }
      })
    } else {
      //全部删掉，为空数组
      skuModelsNew = []
    }
    merchantStock.skuModels = skuModelsNew;
    form.setFieldsValue({
      skuModels: skuModelsNew
    });
    //做规格明细数据的转换
    getList(modelsList);
  }

  //转换数据
  const getList = (modelsList: any) => {
    let skuList = descartes(modelsList);
    let changeList: any = [];
    if (skuList.length) {
      skuList.map((item: any, index: any) => {
        if (Array.isArray(item)) {
          changeList.push({
            //...defaultPrizeItem,
            specList: item
          });

        } else {
          changeList.push({
            //...defaultPrizeItem,
            specList: [item]
          });
        }
      })
    }

    let merchantStock2 = form.getFieldsValue(merchantStock);


    let preSkuList = merchantStock2.skuList || merchantStock.skuList;
    if (preSkuList.length < 1) {
      preSkuList = changeList;
    }

    //***去做匹配，是为了在更新时，不改变规格名的前提下保留之前的价格，库存等操作
    changeList.forEach((item: any) => {
      let length = item.specList.length;
      item.specList.forEach((spec: any, key: number) => {
        const colKey: string = `spec${key}`;
        item[colKey] = spec.specItem;
      });
    });


    merchantStock2.skuList = changeList;
    form.setFieldsValue({
      skuList: changeList
    });
    updataMerchantStock(merchantStock2)
    toSubmit(merchantStock2);
  }

  const toSubmit = async (merchantStock: any) => {
    let params: any = {
      spuId: spuId,
      categoryId: merchantDetail.basicInfo.categoryId,
      shopId: shopId,
      skuList: merchantStock.skuList || []
    }
    const resp = await apisEdit.getMerchantModule().saveCommodityStock(params);
    if (!resp.success) {
      onActionCompleted(false);
      message.error(resp.message);
    } else {
      onActionCompleted(true);
      message.success('商品规格信息保存成功');
    }
  }

  return (
    <div className={currentStep === STEP ? 'edit-rule' : 'hide'}>
      <Form
        ref={formEl}
        layout="vertical"
        initialValues={merchantStock}
        form={form}
        onFinishFailed={(values) => {
          onActionCompleted(false);
        }}
        onFinish={(values) => {
        }}
      >
        <Row><Col span={12}><div className="section-header">添加规格</div></Col></Row>
        <Row className="form-block">
          <Col span={12}>
            <Form.Item style={{ display: 'none' }} hidden={true} name={['proInfo', 'spuId']} >
              <Input disabled={canOnlyView} />
            </Form.Item>
            {!IsAuction && <Form.Item hidden={specsOption.length > 0 ? false : true} extra={dikaerTip(shopId)}>
              <Prescribed skuModels={merchantStock.skuModels} field="skuModels"
                form={form}
                specsOption={specsOption}
                createSkuList={createSkuList}
                changeIsUpdataPic={changeIsUpdataPic}
                shopId={shopId}
                isMaiyouli={isMaiyouli}
                disabled={canOnlyView}
                refreshMerchantStock={(data: any) => {
                  let _merchantStock = form.getFieldsValue(merchantStock);
                  _merchantStock.skuModels = data;
                }}
              />

            </Form.Item>}
          </Col>
          <Col>
            {specsOption.length <= 0 && <div style={{ fontSize: '16px', margin: '0 0 16px' }}>暂无规格信息</div>}
          </Col>
          <Col>
            {IsAuction && <div style={{ fontSize: '16px', margin: '0 0 16px' }}>当前为拍卖商品，不支持维护规格，请直接下一步</div>}
          </Col>
          <Col style={{ paddingBottom: 40, display: 'flex', width: '100%' }}>
            {spuId && (canOnlyView || IsAuction) && <Button type="primary" onClick={() => onActionCompleted(true)}>{$t('下一步')}</Button>}
            {!canOnlyView && !IsAuction && spuId &&
              <Button type="primary" onClick={createSkuList} >{$t('下一步')}</Button>
            }
            <Button style={{ marginLeft: '8px' }} onClick={() => gotoNexStep(-1)}>{$t('返回上一步')}</Button>
          </Col>
        </Row>
      </Form>
    </div >
  )
}));