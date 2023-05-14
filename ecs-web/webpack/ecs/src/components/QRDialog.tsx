import React, { useState, useEffect } from "react";
import { Button, Modal, Tabs, message } from "antd";
// @ts-ignore
import { CopyToClipboard } from "react-copy-to-clipboard";
import QRCode from "qrcode";
import * as apis from '@/common/net/apis';
import '@/assets/styles/common.less'
import { IconFont } from "@aurum/pfe-ui";
import { getAppUrl, getAlipayUrl, getWeappUrl } from '@/common/helper';

export default ({ show = false, title, shopId = '', spuId = '', spuName = '', spuType = 0, onClose }: any) => {
  const [visible, setVisible]: any = useState(false);
  const [image, setImage]: any = useState(false);
  const [alipayImage, setAlipayImage]: any = useState(false);
  const [appUrl, setAppUrA]: any = useState('');
  const [aioUrl, setAioUrl]: any = useState('');
  const [alipayUrl, setAlipayUrl]: any = useState('');
  const [codeImg, setCodeImg] = useState('')
  const [environment, setEnvironment] = useState('MCDONALDS')
  const [showMore, setShowMore] = useState(false)
  const [currenTab, setCurrentTab]: any = useState('1');

  const MENUS = [{ name: 'APP', id: 1 }, { name: '微信小程序', id: 2 }, { name: '支付宝小程序', id: 3 }]

  useEffect(() => {
    setVisible(show);
    if (!show) {
      handleTabClick('1');
      setShowMore(false);
    }
  }, [show]);

  useEffect(() => {
    const hostname = window.location.hostname; let host = 'MCDONALDS';
    if (hostname && hostname.includes('.')) {
      let arr = window.location.hostname.split('.');
      host = arr?.[1] || 'MCDONALDS';
      setEnvironment(host.toUpperCase())
    }
  }, [])

  useEffect(() => {
    if (!spuId) return;
    const app = getAppUrl(shopId, spuId, spuType)
    setAppUrA(app);
    const linkParam = shopId != 4 ? 'shopId=' + shopId + '&spuId=' + spuId : 'activId=' + spuId;
    const encodeQuery = encodeURIComponent(linkParam);
    setAioUrl('mall/pages/detail/mallProductDetail?' + linkParam);
    const alipay = getAlipayUrl(shopId, spuId, spuType)

    setAlipayUrl(alipay)

    QRCode.toDataURL(app, function (err: any, url: string) {
      setImage(url);
    });
    QRCode.toDataURL(alipay, function (err: any, url: string) {
      setAlipayImage(url);
    });
    creatWeappCode(linkParam)
  }, [spuId]);

  const creatWeappCode = async (values: any) => {
    let pageUrl = getWeappUrl(shopId, spuId, spuType)
    let params = {
      pageUrl: pageUrl,
      width: 200,
      linkParam: values
    }
    let rst = await apis.getTranscodeService().generateCode(params)
    let base64Img = `data:image/png;base64,${rst.data.miniCode}`
    setCodeImg(base64Img)
  }

  const toShowMore = () => {
    setShowMore(true)
  }

  const handleTabClick = async (e: any) => {
    if (e) {
      if (e === currenTab) {
        return
      } else {
        setCurrentTab(e)
        setShowMore(false)
      }
    }
  };

  return (
    <Modal
      className="qrcode-container"
      visible={visible}
      title='扫码预览'
      onCancel={() => {
        setVisible(false);
        if (onClose) {
          onClose();
        }
      }}
      footer={null}
      style={{ textAlign: "center" }}
    >
      <div className="tabs-top">
        {MENUS.map((item: any, index: any) => (<div onClick={() => { handleTabClick(item.id) }} className={`tab-menu  ${currenTab == item.id ? 'active' : ''}`}>{item.name}</div>
        ))}
        <div className={`tabs-top-line-tag  tabs-top-line-tag${currenTab}`}></div>
      </div>
      <div className="tabs-content">
        <div className={`tabs-tabpane ${currenTab==1?'active':''}`}>
          <div>
            <a target="_blank" rel="noopener noreferrer" href={image}>
              <h2
                style={{ color: "#1890FF" }}
                dangerouslySetInnerHTML={{ __html: title }}
              ></h2>
            </a>
            <div className="img-con">
              {image && <img alt="" src={image} />}
            </div>
            <div className="code-name">{spuId} {spuName}</div>
            {environment !== 'MCDONALDS' && <div className="code-environment">当前环境: {environment}（APP、AIO 需切换对应环境后扫码访问）</div>}
            <div className="code-more" onClick={toShowMore}><IconFont type='icon-gengduo_heng' /></div>
            {showMore && currenTab == '1' && <div className="code-more-con">
              <div className="code-tip">以下链接仅供参考，对外投放需走CDP生成投放链接</div>
              <div className="code-des">
                {appUrl}
              </div>
              <CopyToClipboard
                text={appUrl}
                onCopy={() => {
                  message.success("二维码地址复制成功");
                }}
              >
                <Button>复制</Button>
              </CopyToClipboard>
            </div>}
          </div>
        </div>
        <div className={`tabs-tabpane ${currenTab==2?'active':''}`}>
          <div className="img-con">
            {codeImg && <img src={codeImg} className="code-img" />}
          </div>
          <div className="code-name">{spuId} {spuName}</div>
          {environment !== 'MCDONALDS' && <div className="code-environment">当前环境: {environment}（APP、AIO 需切换对应环境后扫码访问）</div>}
          <div className="code-more" onClick={toShowMore}><IconFont type='icon-gengduo_heng' /></div>
          {showMore && currenTab == '2' && <div className="code-more-con">
            <div className="code-tip">以下链接仅供参考，对外投放需走CDP生成投放链接</div>
            <div className="code-des">
              {aioUrl}
            </div>
            <CopyToClipboard
              text={aioUrl}
              onCopy={() => {
                message.success("微信地址复制成功");
              }}
            >
              <Button>复制</Button>
            </CopyToClipboard>
          </div>}
        </div>
        <div className={`tabs-tabpane ${currenTab==3?'active':''}`}>
          <div className="img-con">
            {alipayImage && <img alt="" src={alipayImage} className="qrcode-image" />}
          </div>
          <div className="code-name">{spuId} {spuName}</div>
          {environment !== 'MCDONALDS' && <div className="code-environment">当前环境: {environment}（APP、AIO 需切换对应环境后扫码访问）</div>}
          <div className="code-more" onClick={toShowMore}><IconFont type='icon-gengduo_heng' /></div>
          {showMore && currenTab == '3' && <div className="code-more-con">
            <div className="code-tip">以下链接仅供参考，对外投放需走CDP生成投放链接</div>
            <div className="code-des">
              {alipayUrl}
            </div>
            <CopyToClipboard
              text={alipayUrl}
              onCopy={() => {
                message.success("支付宝地址复制成功");
              }}
            >
              <Button>复制</Button>
            </CopyToClipboard>
          </div>}
        </div>
      </div>   
    </Modal>
  );
};
