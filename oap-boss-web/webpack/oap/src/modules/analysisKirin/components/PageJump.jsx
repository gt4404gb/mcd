import React, { forwardRef,useState,useImperativeHandle, useEffect } from 'react';
// import {Button,Select} from '@mcd/portal-components';
// import {Button,Select} from 'antd';
import { Space,Button, Select } from '@aurum/pfe-ui';
import { IconTop } from '@aurum/icons';
// import {VerticalAlignTopOutlined,ArrowLeftOutlined,ArrowRightOutlined } from '@ant-design/icons';

const PageJump = forwardRef((props, ref) => {
  console.log('jump page = ', props)
  const pageSize = [10, 50, 100, 200, 500];
  const [curPage, setCurPage] = useState(props.pageOptions.curPage || 0);
  const [size, setSize] = useState(props.pageOptions.pageSize || 10);

  useImperativeHandle(ref, () => {
    tellFatherMyInfo
  })
  const tellFatherMyInfo = () => {
    props.onFetchList(size, curPage);
  }

  const goTop = () => {
    setCurPage(0);
    props.onFetchList(size, 0);
  }
  const goPre = () => {
    setCurPage((prev) => prev-1);
    props.onFetchList(size, curPage-1);
  }
  const goNext = () => {
    setCurPage((prev) => prev+1);
    props.onFetchList(size, curPage+1);
  }
  const handlePageSize = (val) => {
    setCurPage(0);
    setSize(val);
    props.onFetchList(val, 0);
  }
  useEffect(() => {
    // console.log('curPage = ', curPage)
    // tellFatherMyInfo();
    setCurPage(props.pageOptions.curPage);
    setSize(props.pageOptions.pageSize);
  }, [props.pageOptions])
  return (<div style={{
    position: 'relative',
    top: '20px',
    textAlign: 'right'
  }}>
    <Space>
      <span style={{marginRight: 20}}>当前第{curPage + 1}页</span>
      <Button onClick={goTop} size="middle" type="link" icon={<IconTop />}>首页</Button>
      {/* <Button onClick={goPre} size="middle" icon={<ArrowLeftOutlined />}>上一页</Button>
      <Button onClick={goNext} size="middle" icon={<ArrowRightOutlined />}>下一页</Button> */}
      <Button disabled={curPage <= 0} onClick={goPre} size="middle" icon={<IconTop style={{transform: 'rotate(-90deg)'}}/>}>上一页</Button>
      <Button disabled={!props.pageOptions.hasNext} onClick={goNext} size="middle" icon={<IconTop  style={{transform: 'rotate(90deg)'}}/>}>下一页</Button>
      <Select size="middle" 
        style={{width: 100}}
        onChange={handlePageSize}
        value={size}
      >
        {pageSize.map(size => (
          <Select.Option key={size}>{size}</Select.Option>
        ))}
      </Select>
    </Space>
  </div>)
})
export default PageJump; 