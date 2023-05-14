import React, { useState } from 'react';
import SearchForm, { initSearchObj } from '@/apps/btb/components/voucher/order/SearchForm';
import SearchResult from '@/apps/btb/components/voucher/order/SearchResult';
import './styles/Orders.less'

export default ({ }: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [searchResult, setSearchResult]: any = useState({});

  return (
    <div className="btb-voucher-order-container table-container">
      <SearchForm searchObj={searchObj}
        onChangeSearchObj={(_updSearchObj: any) => {
          setSearchObj({ ..._updSearchObj });
        }} onSearch={(searchResult: any) => {
          setSearchResult(searchResult);
        }} />
      <SearchResult searchObj={searchObj} dataSource={searchResult}
        onChangePartialSearchObj={(value: any) => {
          setSearchObj({ ...searchObj, ...value });
        }} />
    </div>
  )
}