import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SearchForm, { initSearchObj } from '@/apps/btb/components/voucher/code/SearchForm';
import SearchResult from '@/apps/btb/components/voucher/code/SearchResult';
import './styles/Codes.less'

export default ({ }: any) => {
  const { orderId }: any = useParams();
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj, orderId });
  const [searchResult, setSearchResult]: any = useState({});

  // useEffect(() => {
  //   setSearchObj({...searchObj, orderId})
  // }, [orderId]);

  return (
    <div className="btb-voucher-codes-container table-container">
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