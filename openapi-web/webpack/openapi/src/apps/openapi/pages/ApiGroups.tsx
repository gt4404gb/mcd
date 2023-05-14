import React, { useState } from 'react';
import SearchForm from '@/apps/openapi/components/apiGroup/SearchForm';
import SearchResult from '@/apps/openapi/components/apiGroup/SearchResult';

export default ({ }: any) => {
  const [searchConds, setSearchConds]: any = useState({ pageSize: 15, currentPage: 1 });
  const [searchResult, setSearchResult]: any = useState({});

  return (
    <div className="app-group-list table-container">
      <SearchForm searchConds={searchConds} onSearch={(searchResult: any) => {
        setSearchResult(searchResult);
      }} />
      <SearchResult dataSource={searchResult} searchConds={searchConds} onChangeSearchConds={(value: any) => setSearchConds(value)} />
    </div>
  )
}