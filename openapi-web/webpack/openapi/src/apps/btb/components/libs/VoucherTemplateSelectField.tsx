import React, { useState, useEffect } from 'react';
import { Select } from '@aurum/pfe-ui';
import * as apis from '@/apps/btb/common/apis';
import constants from '@/apps/btb/common/constants';

let timer: any;
export default ({ value, onChange, ...rest }: any) => {
  const [options, setOptions]: any = useState([]);
  const [keyword, setKeyword]: any = useState('');

  const searchTemplates = async (searchValue: any) => {
    const opts: any = [];
    const { data }: any = await apis.getVoucherModule().templateQuery({
      templateName: searchValue,
      state: constants.btb.voucherTemplate.state.ONLINE.value,
      pageSize: 30
    });
    if (data?.list) {
      data.list.forEach((it: any) => {
        opts.push({
          value: it.templateCode,
          label: it.templateName
        })
      })
    }
    return opts;
  }

  const onItemChange: any = (selectedVal: any) => {
    onChange(selectedVal)
  }

  const onItemSearch: any = async (searchValue: any) => {
    setKeyword(searchValue);
  }

  useEffect(() => {
    let isUnloaded = false;

    clearTimeout(timer);

    timer = setTimeout(() => {
      (async () => {
        const opts: any = await searchTemplates(keyword);
        if (!isUnloaded) setOptions(opts);
      })();
    }, 500)

    return () => {
      isUnloaded = true;
    }
  }, [keyword]);

  // useEffect(() => {
  //   let isUnloaded = false;
  //   (async () => {
  //     const opts: any = await searchTemplates('');
  //     if (!isUnloaded) setOptions(opts);
  //   })();

  //   return () => {
  //     isUnloaded = true;
  //   }
  // }, []);

  useEffect(() => {
    if (value) {
      const hasValueInOptions: boolean = options.some((it: any) => { it.value === value });
      if (!hasValueInOptions) {
        (async () => {
          const { data }: any = await apis.getVoucherModule().templateDetail(value);
          setOptions([{
            value: data.templateCode,
            label: data.templateName,
          }]);
        })();
      }
    }
  }, [value]);
  return (<div className="merchant-auto-complete-field">
    {/* <AutoComplete
      options={options}
      onSelect={onItemSelect}
      onSearch={onItemSearch}
      showSearch
      {...rest}
    /> */}
    <Select
      options={options}
      showSearch
      allowClear
      value={value}
      placeholder="请选择一个模板"
      // showArrow={false}
      filterOption={false}
      onClear={()=> {
        (async () => {
          const opts: any = await searchTemplates(keyword);
          setOptions(opts);
        })();
      }}
      onSearch={onItemSearch}
      onChange={onItemChange}
      notFoundContent={null}
      {...rest}
    ></Select>
  </div>);
}