import React, { useState } from 'react';
import SearchForm from '@/apps/openapi/components/app/SearchForm';
import SearchResult from '@/apps/openapi/components/app/SearchResult';
import './styles/App.less';
export default ({ }: any) => {
  const [searchConds, setSearchConds]: any = useState({ 
    currentPage: 1,
    pageSize: 10, 
  });
  const [searchResult, setSearchResult]: any = useState({});

  return (
    <div className="app-list table-container">
      <SearchForm searchConds={searchConds} onSearch={(searchResult: any) => {
        setSearchResult(searchResult);
      }} />
      <SearchResult dataSource={searchResult} searchConds={searchConds} onChangeSearchConds={(value: any) => setSearchConds(value)} />
    </div>
  )
}