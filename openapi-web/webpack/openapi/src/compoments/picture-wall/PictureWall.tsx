import React, { useState, useEffect } from 'react';
import { ConfigProvider, Upload, Modal, message } from '@aurum/pfe-ui';
import { PlusOutlined } from '@ant-design/icons';
import config from './config';

import './PictureWall.less';

function getBase64(file: any) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

export default ({
  onChange = null,
  onUploaded = null,
  value = '',
  disabled = false,
  action = null,
  uploadPath = 'gallery',
  allowedMimes = [],
  minWidth = 0,
  minHeight = 0,
  maxWidth = 0,
  maxHeight = 0,
  maxBytes = 0,
  maxLength = 0,
  uploadType = '',
  listType = 'picture-card',
  ...rest }: any) => {
  const [previewVisible, setPreviewVisible]: any = useState(false);
  const [previewImage, setPreviewImage]: any = useState('');
  const [previewTitle, setPreviewTitle]: any = useState('');
  const [fileList, setFileList]: any = useState([]);
  const [maxLimit, setMaxLimit]: any = useState(0);

  useEffect(() => {
    if (value) {
      let _files: any = value;
      if (typeof value === 'string' || !value) {
        _files = [{ url: value }];
        setMaxLimit(1);
      }
      if (Array.isArray(_files)) {
        setFileList(normalizeFileList(_files));
      }
    } else {
      setFileList([]);
    }
  }, [value]);

  useEffect(() => {
    if (Array.isArray(value)) {
      setMaxLimit(maxLength);
    }
  }, [maxLength]);

  const normalizeFileList: any = (files: any) => {
    const normalizedFiles: any = files.map((file: any, key: number) => {
      let _file = file;
      if (typeof file === 'string') _file = { url: file }
      return {
        uid: _file.uid || key,
        name: _file.name || '图片',
        filename: _file.filename || _file.name,
        url: _file.url,
        width: _file.width || null,
        height: _file.width || null,
        status: 'done',
      };
    });
    return normalizedFiles;
  }

  const handleCancel = () => setPreviewVisible(false);

  const handlePreview = async (file: any) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
  };

  const handleChange = (fileList: any, file: any = null) => {
    if (onChange) {
      if (typeof value === 'string' || !value) {
        onChange(fileList?.[0]?.url || '');
      } else {
        onChange(fileList);
      }
    } else {
      setFileList(fileList);
    }
  };

  const addToFileList = (newFile: any) => {
    let isNewFile: boolean = true;
    let _newFiles: any = fileList.map((f: any, key: any) => {
      if (f.uid === newFile.uid) isNewFile = false;
      return (f.uid === newFile.uid) ? newFile : f;
    });
    if (isNewFile) _newFiles.push(newFile);
    _newFiles = normalizeFileList(_newFiles);

    if (onUploaded) onUploaded(_newFiles);
    handleChange(_newFiles);
  }

  const removeFromFileList = (file: any) => {
    const _newFiles: any = fileList.filter((_file: any) => file.uid !== _file.uid);
    handleChange(_newFiles);
  }

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  return (

    <div className="omc-pictural-wall">
      <Upload
        uploadType={uploadType}
        listType={listType}
        fileList={fileList}
        disabled={disabled}
        onPreview={handlePreview}
        {...config.getUploadProps({
          action,
          uploadPath,
          allowedMimes,
          minWidth,
          minHeight,
          maxWidth,
          maxHeight,
          maxBytes,
          onUploaded: addToFileList,
          onRemoved: (file: any) => {
            removeFromFileList(file);
          },
          onMessage: (msg: any, type: any) => {
            if (type === 'error') {
              message.error(msg);
            } else {
              message.info(msg);
            }
          },
          handleChange,
          setFileList
        })}

        {...rest}
      >
        {(disabled || (maxLimit > 0 && fileList.length >= maxLimit)) ? null : uploadButton}
      </Upload>
      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
      >
        <img alt="预览" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>

  );
}