import React, { useState } from 'react';
import SearchForm from '@/apps/btb/components/merchant/audit/SearchForm';
import SearchResult from '@/apps/btb/components/merchant/audit/SearchResult';
import './styles/Audits.less'

export default ({ }: any) => {
  const [searchConds, setSearchConds]: any = useState({ pageSize: 10, currentPage: 1 });
  const [searchResult, setSearchResult]: any = useState({});

  return (
    <div className="btb-merchant-audits table-container">
      <SearchForm searchConds={searchConds} onSearch={(searchResult: any) => {
        setSearchResult(searchResult);
      }} />
      <SearchResult dataSource={searchResult} searchConds={searchConds} onChangeSearchConds={(value: any) => setSearchConds(value)} />
    </div>
  )
}