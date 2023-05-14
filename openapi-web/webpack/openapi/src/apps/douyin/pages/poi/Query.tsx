import React, { useState, useEffect } from 'react';
import { Button, Table, Input, message } from "@aurum/pfe-ui";
import * as apis from '@/apps/douyin/common/apis'
import './styles/Query.less'


export default ({ }: any) => {
  const [dailyLimit, setDailyLimit]: any = useState(5); // 每日几次
  const [taskList, setTaskList]: any = useState([]); //存放操作列表，包括时间，任务ID

  const columns: any = [{
    title: '操作时间',
    dataIndex: 'createdTime',
    align: 'center',
    width: 216
  },
  {
    title: '任务id',
    dataIndex: 'taskId',
    align: 'center',
    width: 387
  },
  {
    title: '操作',
    align: 'center',
    width: 150,
    render: (val: any, record: any) => <a type='link' onClick={() => downloadFile(val.taskId)}>下载</a>
  }];

  const downloadFile: any = async (taskId: any) => {
    const resp: any = apis.getDouyinModule().onDownLoad(taskId);
    resp.then((resp: any) => {
      const data: any = resp.data.data;
      if(data.error_code){
        message.destroy();
        message.error(data.description);
      }else{
        switch (data.task_status) {
          case 0:
            message.destroy();
            message.success('任务正在进行中');
            break;
          case 1:
            window.open(data.result_uri, '_target')
            break;
          case 2:
            message.destroy();
            message.error('导出任务失败');
            break;
        }}
    })
  }

  const fetchTaskList: any = async () => {
    const resp: any = await apis.getDouyinModule().fetchTaskList();
    setTaskList(resp.data)
  }

  const fetchNewTask: any = async () => {
    const resp: any = await apis.getDouyinModule().fetchNewTask();
    const data: any = resp.data?.data || {};
    const currentTime: any = formatCurrentTime();
    const task: any = {
      createdTime: currentTime,
      taskId: data.task_id
    }
    if(data.error_code){
      message.destroy();
      message.error(data.description)
    }else{
      setTaskList([task, ...taskList])
    }
  }

  const formatCurrentTime: any = () => {
    const dateTime: any = new Date();
    const currentTime: any = dateTime.getFullYear() + '-' + dateTime.getMonth() + '-' + dateTime.getDate() + ' ' +
      dateTime.getHours() + ':' + dateTime.getMinutes() + ':' + dateTime.getSeconds();
    return currentTime;
  }

  useEffect(() => {
    fetchTaskList()

  }, [])

  return (
    <div className="douyin-shop-export-query-container">
      <div className='export-container'>
        <div className='export-header header'>导出全量门店</div>
        <div className='export-body detail'>
          <Button type='primary' disabled={taskList.length >= dailyLimit} className='action' onClick={fetchNewTask}>导出</Button>
          <div className='export-detail'>
            导出抖音全量已关联的门店POI信息，抖音限制
            <span className='daily-limit'>每日{dailyLimit}次</span>，
            已操作{taskList.length}次。
          </div>
        </div>
        {taskList.length !== 0 && <div className='task-table-wrap'>
          <Table
            columns={columns}
            dataSource={taskList}
            rowKey='taskId'
            bordered={true}
            pagination={false}
          >
          </Table>
        </div>}
      </div>
    </div>
  )
}