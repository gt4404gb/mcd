import React, { useState, useEffect, useRef } from 'react'
import { Button, message, Upload, Modal, IconFont } from '@aurum/pfe-ui';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import config from './config';
import './ImageField.less';

export default ({ onChange = null, value = '', disabled = false, uploadPath = 'gallery', allowedMimes = [], maxBytes = 0, onUploaded = null, uploadType = 'singleImage', style = '' }: any) => {
  const [imageUrl, setImageUrl] = useState('');
  const actionRef: any = useRef();
  const actionConRef: any = useRef();
  const [previewVisible, setPreviewVisible] = React.useState(false)

  const $t: any = (window as any).$t ? (window as any).$t : (text: string) => text;

  useEffect(() => {
    setImageUrl(value);
  });

  const handleCancel = () => setPreviewVisible(false)

  const uploadButton: any = !disabled ? (
    <><div className="actions-con" ref={actionConRef}></div>
      <div className="actions" ref={actionRef}>
        <div className="button"
        onClick={(e: any) => {
          e.stopPropagation();
          setPreviewVisible(true)
        }}
        ><IconFont type="icon-fangda" /></div>
        <div className="button" onClick={(e: any) => {
          e.stopPropagation();
          setImageUrl('');
          if (onUploaded) {
            onUploaded({});
          } else {
            if (onChange) onChange('');
          }
        }}><IconFont type="icon-qingchu" /></div>
      </div></>

  )
    : '';

  const uploadButtonDefault: any = !disabled ? (
    <div>
      <IconFont type="icon-zhaopian" style={{ fontSize: '20px' }} />
      <div style={{ marginTop: 8, color: '#999999', fontSize: '14px' }} className='upload-desc'>点击上传图片</div>
    </div>
  ) : '';

  return (
    <div className="aurum-widegts-image-field" onMouseOver={() => {
      if (actionRef && actionRef.current) actionRef.current.style.display = 'flex';
      if (actionConRef && actionConRef.current) actionConRef.current.style.display = 'flex';
      
    }} onMouseOut={() => {
      if (actionRef && actionRef.current) actionRef.current.style.display = 'none';
      if (actionConRef && actionConRef.current) actionConRef.current.style.display = 'none';
    }}>
      <Upload
        disabled={disabled}
        listType="picture-card"
        className={imageUrl ? 'image-uploader image-uploader-has' : 'image-uploader'}
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
        {imageUrl ? <><img src={imageUrl} alt="上传的图片" style={ !!style ? style : { width: '100%', height: '100%' }}  />
          {uploadButton}
        </>
          : <div>{uploadButtonDefault}</div>
        }
      </Upload>

      <Modal
        visible={previewVisible}
        title='查看大图'
        footer={null}
        onCancel={handleCancel}
      >
        <img alt="example" style={{ width: '100%' }} src={imageUrl} />
      </Modal>
    </div>
  )
};