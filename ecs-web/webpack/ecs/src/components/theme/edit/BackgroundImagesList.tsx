import React, { useState, useEffect } from 'react'
import { Form, Button, message, IconFont } from '@aurum/pfe-ui';
// @ts-ignore
import ImageField from '@/components/imagesSingleNew/ImageField';
import { MinusCircleOutlined } from '@ant-design/icons';
import ImagesSelector from '@/components/imagesSingleNew/ImagesSelector';

export default ({ form, basicImages, onChange = null, refreshMerchantDetail, value = [], disabled = false, field, style = '', maxLength=20 }: any) => {
  const [imagesNum, setImagesNum]: any = useState(0);
  const [couponModalVisble, makeCouponModalVisble] = useState(false);
  const [list, setList] = useState(basicImages);
  useEffect(() => {
    setImagesNum(basicImages?.length);
  }, [basicImages]);

  return (
    <div className="aurum-widegts-image-field">
      <div className="info_imagesList">
        <Form.List name={field}>
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <div key={field.key} className='info_imagesList_card'
                >

                  {style === 'en' ?
                    <Form.Item name={[field.name, 'obj']}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            /* @ts-ignore */
                            let index = _.field.slice(20, 21);
                            if (!value || (value && !getFieldValue('enBackgroundImgList')[index].obj || !getFieldValue('enBackgroundImgList')[index].obj.url)) {
                              return Promise.reject(new Error('请上传商品图或删除图片占位!'));
                            }
                            return Promise.resolve();
                          },
                        }),
                      ]}
                    >
                      <ImageField uploadPath="ecs" disabled={disabled} />
                    </Form.Item> :
                    <Form.Item name={[field.name, 'obj']}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            /* @ts-ignore */
                            let index = _.field.slice(18, 19);
                            if (!value || (value && !getFieldValue('backgroundImgList')[index].obj || !getFieldValue('backgroundImgList')[index].obj.url)) {
                              return Promise.reject(new Error('请上传商品图或删除图片占位!'));
                            }
                            return Promise.resolve();
                          },
                        }),
                      ]}
                    >
                      <ImageField uploadPath="ecs" disabled={disabled} />
                    </Form.Item>}
                  {!disabled && <MinusCircleOutlined onClick={() => {
                    remove(field.name);
                    let num = JSON.parse(JSON.stringify(imagesNum));
                    setImagesNum(num - 1);
                  }}
                  />}
                </div>
              ))}
              {imagesNum < maxLength && <div>
                <Button type="primary" onClick={() => {
                  let num = JSON.parse(JSON.stringify(imagesNum));
                  setImagesNum(num + 1);
                  add()
                }} disabled={disabled}>添加图片</Button>
              </div>}
            </>
          )}
        </Form.List>
        {imagesNum > 1 && <div className="change-pic">
          <Button type="link" onClick={() => {
            let images = style === 'en' ? form.getFieldValue('enBackgroundImgList') : form.getFieldValue('backgroundImgList');
            let res = images.some((item: any) => {
              return !item || !item.obj || !item.obj.url
            })
            if (res) {
              message.error('请上传商品图或删除图片占位!');
              return
            }
            setList(images);
            makeCouponModalVisble(true)
          }} disabled={disabled}>修改顺序</Button>
        </div>}
      </div>
      <ImagesSelector
        visible={couponModalVisble}
        basicImages={list}
        onClose={(data: any) => {
          if (data.length) {
            style === 'en' ?
              form.setFieldsValue({
                enBackgroundImgList: data,
              }) :
              form.setFieldsValue({
                backgroundImgList: data,
              });
            refreshMerchantDetail(data)
          }
          makeCouponModalVisble(false);
        }}
      />
    </div>
  )
};