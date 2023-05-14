import React, { useState, useEffect } from 'react';
import { Select } from '@aurum/pfe-ui';
import * as apis from '@/apps/btb/common/apis';
import constants from '@/apps/btb/common/constants';

export default ({ value, onChange, type, ...rest }: any) => {
  const [options, setOptions]: any = useState([]);
  useEffect(() => {
    let isLoaded: boolean = true;
    const params: any = {
      availableFlag: 1,
      limit: 999
    }
    if (type || type === 0) params.merchantType = type;
    (async () => {
      const { data }: any = await apis.getBMSModule().fetchMerchantList(params);
      if (data?.rows) {
        const opts: any = data.rows.map(((item: any) => ({ value: item.merchantId, label: item.companyName })));
        if (isLoaded) setOptions(opts);
      }
    })();

    return () => {
      isLoaded = false;
    }
  }, []);
  return (<div className="merchant-select-field">
    <Select
      value={value}
      showSearch
      allowClear
      options={options}
      placeholder="请选择商户名称"
      optionFilterProp="label"
      onChange={(value: any) => {
        onChange(value);
      }}
      {...rest}
    />
  </div>);
}