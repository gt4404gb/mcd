import React, { useEffect, useRef, useState } from 'react';
import config from '@/common/config/config';
import E from 'wangeditor';

export default ({ onChange = null, value = '', disabled = false, detail = '', placeholder = '', height = 500, menus = [] }: any) => {
  const editorRef: any = useRef(null);
  const lastHtml = useRef(detail);
  const wangeditorRef: any = useRef(null);
  const isShow: any = useRef(false);
  useEffect(() => {
    wangeditorRef.current = initEditor();
  }, []);

  useEffect(() => {
    if (disabled) {
      wangeditorRef.current.disable()
    }
    if (!detail) return;

    wangeditorRef.current.txt.html(detail);
  }, [detail]);

  const initEditor = () => {
    lastHtml.current = detail;
    let editor = null;
    editor = new E(editorRef.current);
    editor.config.height = height ? height : 500;
    editor.config.zIndex = 500;
    editor.config.menus = [...menus, 'bold', 'image']

    editor.config.placeholder = placeholder ? placeholder : '建议商品详情仅维护图片形式以保证对客页面的规整、美观，宽度大于1000';
    editor.config.uploadImgServer = config.BACKEND_CMS_API_BASE_URL + '/cms/file/upload/rich';
    editor.config.uploadFileName = 'files'
    editor.config.uploadImgParams = {
      path: 'ecs/images'
    }
    let authorization = '';
    document.cookie.split(';').forEach((item) => {
      if (item.includes('Authorization')) {
        authorization = item.replace('Authorization=', '');
      }
    })
    editor.config.uploadImgHeaders = {
      Authorization: authorization
    }

    editor.config.onchange = (newHtml: any) => {
    	const newReplaceHtml1 = newHtml.replace(/<a\s+[^>]*?href\s*=\s*['"][^'"]*?['"][^>]*>/g, '')
    	const newReplaceHtml2 = newReplaceHtml1.replace(/<\/a>/g, '')
    	const newReplaceHtml = newReplaceHtml2.replace(/style="[^\"]*?"/g, ($1: any, $2: any) => {
    		$1 = $1.split('"')[1];
    		const str = 'width:100vw; display:block" mode="widthFix"';
    		if($1.includes(str)) {
    			return `style="${$1} `
    		} else {
    			return `style="${$1} ${str} `
    		}
    	})
    	if ((onChange && isShow.current) || Boolean(detail)) {
    		onChange(newReplaceHtml.trim());
    	} else {
    		isShow.current = true
    	}
      isShow.current = true 
    }

    editor.create();
    editor.txt.html(lastHtml.current);
    if (disabled) {
      editor.disable()
    }

    return editor;
  };

  return (
    <div>
      <div ref={editorRef}></div>
    </div>
  )
};