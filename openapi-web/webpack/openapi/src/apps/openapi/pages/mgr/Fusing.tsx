import React, { useState } from 'react';
import SearchForm from '@/apps/openapi/components/mgr/fusing/SearchForm';
import SearchResult from '@/apps/openapi/components/mgr/fusing/SearchResult';
import './styles/Fusing.less';

export default ({ }: any) => {
  const [searchConds, setSearchConds]: any = useState({ pageSize: 10, currentPage: 1 });
  const [searchResult, setSearchResult]: any = useState({});

  return (
    <div className="mgr-fusing-list table-container">
      <SearchForm searchConds={searchConds} onSearch={(searchResult: any) => {
        setSearchResult(searchResult);
      }} />
      <SearchResult dataSource={searchResult} searchConds={searchConds} onChangeSearchConds={(value: any) => setSearchConds(value)} />
    </div>
  )
}