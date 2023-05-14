import React, { useEffect, useRef, useState, useMemo } from 'react';
import { withRouter, useParams } from 'react-router-dom';
import { Select, Spin } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/common/net/apis_edit';
/* @ts-ignore */
import debounce from 'lodash/debounce';
const { filterEmptyFields } = common.helpers;

export default ({ onChange = null, value = '', disabled = false, mode = '', showAll = true, labelInValue = false, originTemplateOptions = [] }: any) => {
  const [currValue, setcurrValue]: any = useState([]);
  const [templateOptions, setTemplateOptions] = useState(originTemplateOptions);

  const [fetching, setFetching] = useState(false);
  const fetchRef = useRef(0);

  useEffect(() => {
    if(value) {
      setcurrValue(value);
    }
  }, [value]);


  const fetchList: any = async (searchObj: any) => {
    const resp: any = await apis.getVoucherModule().templateQuery(filterEmptyFields(searchObj));
    if (resp && resp.data && resp.data.list) {
      let listArr = resp.data.list;
      listArr.map((item: any, index: any) => {
        if (item) {
          item.label = item.templateCode + item.templateName;
          item.value = item.templateCode;
        }
      })
      setTemplateOptions(listArr);
      setFetching(false);
    } else {
      setTemplateOptions([]);
      setFetching(false);
    }
};

const debounceFetcher = useMemo(() => {
  const loadOptions = (currValue: string) => {
    fetchRef.current += 1;
    setTemplateOptions([]);
    setFetching(true);
    fetchList({pageSize: 50, pageNo:1, platform: 1, templateName:currValue})
  };
  return debounce(loadOptions, 800);
}, [currValue]);

const handleChange = (value1: any) => {
  setcurrValue(value1);
  if (onChange) onChange(value1);
}

const onClear = () => {
  setcurrValue('');
  fetchList({pageSize: 50, pageNo:1, templateName:''})
}

return (
  <div className="city_select">
    <Select
      disabled={disabled}
      showSearch
      allowClear
      onClear= {onClear}
      filterOption={false}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      onSearch={debounceFetcher}
      placeholder={$t('请选择关联资源')}
      value={currValue}
      onChange={handleChange}
      options={templateOptions}
    >
    </Select>
  </div>
)
};