import React, { useState } from 'react';
import SearchForm from '@/apps/btb/components/order/SearchForm';
import SearchResult from '@/apps/btb/components/order/SearchResult';
import './styles/List.less';

export default ({ }: any) => {
  const [searchConds, setSearchConds]: any = useState({ pageSize: 50, currentPage: 1 });
  const [searchResult, setSearchResult]: any = useState({});

  return (
    <div className="btb-orders-container table-container">
      <SearchForm searchConds={searchConds} onSearch={(searchResult: any) => {
        setSearchResult(searchResult);
      }} />
      <SearchResult dataSource={searchResult} searchConds={searchConds} onChangeSearchConds={(value: any) => setSearchConds(value)} />
    </div>
  )
}