import React, { useEffect, useRef, useState } from 'react';
import { withRouter, useParams } from 'react-router-dom';
import { Select } from '@aurum/pfe-ui';
import * as apisEdit from '@/common/net/apis_edit';
const { Option } = Select;

export default ({ onChange = null, disabled = false, value = [], labelInValue = false }: any) => {
  const [value1, setValue1]: any = useState('');
  const [options, setOptions]: any = useState([]);
  let timeout: any = useRef(null);
  let currentValue: any = useRef('');

  const fetch = async (value: any) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    currentValue.current = value;
    timeout.current = setTimeout(fake, 500);
  }

  useEffect(() => {
    if (!labelInValue) {
      setValue1(value);
    } else {
      setValue1({ value: value })
    }

  }, [value]);

  const fake = (value1: any) => {
    (async () => {
      const { data: storeData } = await apisEdit.getMerchantModule().partyFilterStoreList({ storeName: currentValue.current });
      if (storeData && storeData.storeInfos) {
        const options1 = storeData?.storeInfos.map((d: any) => <Option key={d.storeCode} value={d.storeCode}>{d.storeNameCn}</Option>);
        setOptions(options1)
      }
    })()
  }

  const handleChange = (value2: any) => {
    if(value2) {
      setValue1({
        label: value2.label,
        value: value2.value
      });
    } else {
      setValue1({
        label: '',
        value: ''
      });
    }
    
    onChange && onChange(value2 || '');
  };

  const handleSearch = (value2: any) => {
    if (value2) {
      fetch(value2);
    } else {
      setOptions([]);
    }
  };

  return (
    <div className="city_select">
      <Select
        labelInValue={true}
        disabled={disabled}
        showSearch
        allowClear
        placeholder={$t('请选择门店')}
        value={value1}
        onChange={handleChange}
        onSearch={handleSearch}
        optionFilterProp={'children'}
        defaultActiveFirstOption={false}
      >
        {options}
      </Select>
    </div>
  )
};