import React, { useState, useEffect, useRef } from 'react'
import { Button, message, Upload, Modal, IconFont } from '@aurum/pfe-ui';
import config from './config.js';
import './ImageField.css';

export default ({ onChange = null, value = '', disabled = false, uploadPath = 'gallery', allowedMimes = [], maxBytes = 0, onUploaded = null }: any) => {
  const [imageUrl, setImageUrl] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false)
  const actionRef: any = useRef();

  const $t: any = (window as any).$t ? (window as any).$t : (text: string) => text;

  useEffect(() => {
    setImageUrl(value);
  });

  const uploadButton: any = !disabled ? (
    <div className="actions" ref={actionRef} >
      <div className="button" onClick={(e: any) => {
        e.stopPropagation();
        setPreviewVisible(true)
      }}
      ><IconFont type="icon-kejian" /> </div>
      <div className="button" onClick={(e: any) => {
        e.stopPropagation();
        setImageUrl('');
        if (onUploaded) {
          onUploaded({});
        } else {
          if (onChange) onChange('');
        }
      }}><IconFont type="icon-qingchu" /></div>
    </div>
  )
    : '';

  const uploadButtonDefault: any = !disabled ? (
    <div>
      <IconFont type="icon-zhaopian" style={{ fontSize: '18px' }} />
      <div style={{ marginTop: 8 }}>{$t('点击上传图片')}</div>
    </div>
  ) : '';

  const handleCancel = () => {setPreviewVisible(false)}

  return (
    <div className="omc-widegts-image-field" onMouseOver={() => {
      if (actionRef && actionRef.current) actionRef.current.style.display = 'flex';
    }} onMouseOut={() => {
      if (actionRef && actionRef.current) actionRef.current.style.display = 'none';
    }}>
      <Upload
        className="image-uploader"
        listType="picture-card"
        {...config.getUploadProps({
          uploadPath,
          allowedMimes,
          maxBytes,
          onUploadCompleted: (imageObj: any) => {
            setImageUrl(imageObj.imageUrl);
            if (onUploaded) {
              onUploaded(imageObj);
            } else {
              if (onChange) onChange(imageObj.imageUrl);
            }
          },
          onMessage: (msg: any, type: any) => {
            if (type === 'error') {
              message.error(msg);
            } else {
              message.info(msg);
            }
          }
        })}>
        {imageUrl ? <><img src={imageUrl} alt="上传的图片" style={{ width: '100%' }} onClick={(e: any) => {
          e.stopPropagation();
          setPreviewVisible(true)
          // Modal.info({
          //   icon: null,
          //   maskClosable: true,          
          //   content: <img alt="" src={imageUrl} className="img-large"/>,
          //   closable: true,
          //   okText: '关闭',
          //   width: 480,
          // });
        }} />
          {uploadButton}
        </>
          : <div>{uploadButtonDefault}</div>
        }
      </Upload>   


      <Modal
        visible={previewVisible}
        title={''}
        footer={null}
        onCancel={handleCancel}
      >
        <img alt="example" style={{ width: '100%' }} src={imageUrl} />
      </Modal>
    </div>
  )
};