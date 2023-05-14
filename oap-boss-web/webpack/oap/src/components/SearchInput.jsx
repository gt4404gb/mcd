import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import {
  Button,
  Input
} from '@aurum/pfe-ui';
import { IconSearch } from '@aurum/icons';
const SearchInput = forwardRef((props, ref) => {
  const queryKeyWords = useRef();
  // const btnWidth = props?.btnWidth || 56;
  const [btnWidth, setBtnWidth] = useState(props?.btnWidth || 56);
  const btnDis = props?.disabled || false;
  const inputPlaceholder = props?.placeholder || '请输入'
  const handleSearch = () => {
    let keyWords = queryKeyWords.current.input.value.toLowerCase().trim();
    props.onSearch(keyWords)
  }
  useEffect(() => {
    console.log('40？', btnWidth);
    setBtnWidth(props.btnWidth);
  }, [props.btnWidth])
  useImperativeHandle(ref, () => ({
    handleSearch
  }))
  return (
    <>
      <Input.Group compact className="oap-analysis-localSearch" style={{ display: 'flex' }}>
        <Input
          ref={queryKeyWords}
          style={{ width: `calc(100% - ${btnWidth}px)`, background: '#fff', opacity: btnDis ? 0.3 : 1 }}
          placeholder={inputPlaceholder}
          allowClear
          disabled={btnDis}
          onPressEnter={handleSearch} />
        <span className='operator-btn-span' style={{ display: 'inline-flex', width: `${btnWidth}px` }}>
          <Button
            style={{ padding: 0, margin: 0, minWidth: `${btnWidth}px`, borderLeft: 'none', borderRadius: '0 4px 4px 0', borderColor: '#e1e1e1' }}
            icon={<IconSearch />}
            disabled={btnDis}
            onClick={handleSearch}>
          </Button>
        </span>
      </Input.Group>
    </>
  )
});

export default SearchInput;