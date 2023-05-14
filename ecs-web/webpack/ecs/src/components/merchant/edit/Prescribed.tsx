import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { Row, Col, Form, Input, Button, Space, Select, Checkbox, message, Upload } from '@aurum/pfe-ui';
import { MinusCircleOutlined } from '@ant-design/icons';
import ImageField from '@/components/widgetImageField/ImageField';
import PrescribedChange from './prescribedChange/Index';
const { Option } = Select;

export default ({ form, skuModels, field, specsOption = [], disabled, onChange = null, createSkuList = null, changeIsUpdataPic = null, shopId = '', refreshMerchantStock, isMaiyouli }: any) => {
  const [currentSelected, setCurrentSelected] = useState([]);
  const [isUpdataPic, setIsUpdataPic] = useState(false);
  const [skuNum, setSkuNum]: any = useState(0);
  const [maxNum, setMaxNum]: any = useState(0);
  const [changeModalVisble, mackChangeModalVisble] = useState(false);
  const [list, setList] = useState([]);
  let currentIndex = useRef(0);

  useEffect(() => {
    if (isMaiyouli) {
      setIsUpdataPic(true);
      setSkuNum(skuModels.length);
    } else {
      if (!skuModels || !skuModels.length) {
        setIsUpdataPic(false);
        changeIsUpdataPic && changeIsUpdataPic(false);
      } else {
        setSkuNum(skuModels.length);
        let some = skuModels[0].models.some((obj: any) => {
          return obj.specImage;
        })
        let obj: any = {};
        skuModels.forEach((item: any, index: any) => {
          const colKey: string = `spec${index}`;
          obj[colKey] = item.specMain;
        })
        setCurrentSelected(obj);
        setIsUpdataPic(some);
        changeIsUpdataPic && changeIsUpdataPic(some);
      }
    }
  }, [skuModels, isMaiyouli])

  useEffect(() => {
    if (!specsOption || !specsOption.length) {
      return
    }
    setMaxNum(specsOption.length > 3 ? 3 : specsOption.length);
  }, [specsOption])


  const filteredOptions: any = specsOption.filter((o: any) => {
    return !Object.values(currentSelected).includes(o.name as never)
  });

  const handleChange = (value: any, index: any) => {
    const colKey: string = `spec${index}`;
    let obj: any = { ...currentSelected };
    obj[colKey] = value;
    setCurrentSelected(obj);
  };

  const changePic = (e: any) => {
    if (isMaiyouli) {
      return;
    }
    setIsUpdataPic(e.target.checked);
    changeIsUpdataPic && changeIsUpdataPic(e.target.checked);
  }

  const toCreateSkuList = () => {
    //如果点击了添加图片，就要全部都添加
    if (createSkuList) {
      createSkuList(isUpdataPic);
    }
  }

  return (
    <div className="skuList">
      <Form.List name={field}>
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => (
              <div key={field.key} className={disabled ? 'specList specListNoshow' : 'specList'} >
                <Col className="gutter-row" span={2}>
                <Form.Item
                  {...field}
                  className="specName"
                  name={[field.name, 'specMain']}
                  label={$t('规格名')}
                  rules={[{ required: true }]}
                >

                  <Select
                    disabled={disabled}
                    onChange={(e) => { handleChange(e, index) }}
                  >
                    {(filteredOptions.map((item: any) => (
                      <Option key={item.id} value={item.name}>
                        {item.name}
                      </Option>
                    )))}
                  </Select>
                </Form.Item>
                </Col>
                {index === 0 && <div className="changePic"><Checkbox checked={isUpdataPic} onChange={changePic} disabled={disabled} >添加图片</Checkbox>(<span className="tip">图片必须全规格值都添加，或者都不添加，规格图：建议尺寸300x300像素</span>)</div>}
                <Form.Item label={$t('规格值')} className="models">
                  <Form.List name={[field.name, 'models']}>
                    {(fields2, { add: add2, remove: remove2 }) => (
                      <>
                        <div className={disabled ? 'namename namenameNoshow' : 'namename'}>
                            <Row gutter={16}>
                              {fields2.map(({ key, name, ...restField }) => (
                                <Col className="gutter-row" span={2}>
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'specItem']}
                                    rules={[{ required: true, message: '请输入规格值' }]}
                                  >
                                    <Input disabled={disabled} maxLength={12} placeholder='请输入规格值中文' />
                                  </Form.Item>
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'specItemEn']}
                                  >
                                    <Input disabled={disabled} maxLength={24} placeholder='请输入规格值英文' />
                                  </Form.Item>

                                  {index === 0 && isUpdataPic && <Form.Item name={[name, 'specImage']}>
                                    <ImageField uploadPath="ecs" disabled={disabled} />
                                  </Form.Item>}
                                  <Form.Item style={{ display: 'none' }} hidden={true} name={[name, 'specMainId']}>
                                    <Input disabled={disabled} />
                                  </Form.Item>

                                  <MinusCircleOutlined onClick={() => remove2(name)} />
                                </Col>
                              ))}
                            </Row>
                          
                        </div>
                        <div style={{marginTop:'16px', display:'flex'}}>
                          <Space>
                          <Button onClick={() => add2()} disabled={disabled}>添加规格值</Button>
                          {form.getFieldValue('skuModels') && form.getFieldValue('skuModels')[index]?.models?.length > 1 && <p><Button onClick={() => {
                            let _skuModels = form.getFieldValue('skuModels');
                            let _models = _skuModels[index]?.models;
                            if (_models.length) {
                              let res = _models.some((item: any) => {
                                return !item
                              })
                              if (res) {
                                message.error('请上传规格值或删除占位!');
                                return
                              }
                            }
                            setList(_skuModels[index]?.models);
                            mackChangeModalVisble(true);
                            currentIndex.current = index;
                          }}
                          disabled={disabled}
                          >修改规格值顺序</Button></p>}
                          </Space>
                        </div>
                      </>
                    )}
                  </Form.List>
                </Form.Item>
                <MinusCircleOutlined onClick={() => {
                  remove(field.name);
                  let num = JSON.parse(JSON.stringify(skuNum));
                  setSkuNum(num - 1);
                  let obj: any = { ...currentSelected };
                  if (obj[`spec${index}`]) {
                    delete obj[`spec${index}`]
                  }
                  let obj2: any = {};
                  Object.values(obj).forEach((i: any, k: any) => {
                    obj2[`spec${k}`] = i;
                  })
                  setCurrentSelected(obj2);
                  setTimeout(() => {
                    //toCreateSkuList();
                  }, 50)

                }} />
              </div>
            ))}
            {skuNum < maxNum && <div style={{borderTop:'1px solid #ccc', paddingTop:'16px'}}>
              <Button onClick={() => {
                let num = JSON.parse(JSON.stringify(skuNum));
                setSkuNum(num + 1);
                add()
              }} disabled={disabled}>添加规格项目</Button>
            </div>}
          </>
        )}
      </Form.List>

      <PrescribedChange
        visible={changeModalVisble}
        preList={list}
        onClose={(data: any) => {
          if (data.length) {
            let _skuModels = form.getFieldValue('skuModels');
            _skuModels[currentIndex.current].models = data;

            form.setFieldsValue({
              skuModels: _skuModels,
            });
            refreshMerchantStock(_skuModels)
          }
          mackChangeModalVisble(false);
        }}
      />

    </div>
  )
};