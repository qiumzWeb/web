import React, {useEffect, useState} from 'react'
import { Icon, Dialog } from '@/component'
// import AES from 'assets/js/aes'
import Setting from '../setting'
import Bus from 'assets/js/bus'
import { pageRefreshName, Cookie } from 'assets/js'
import $http from '@/assets/js/ajax'
let timer = null
export default function Action(props) {
  // const getUser = async() => {
  //   const hosts = ['pcs-admin.wt.cainiao.com', 'pcs-web.wt.cainiao.com']
  //   if(hosts.includes(location.hostname)) {
  //     // 开启监控
  //     AES.open()
  //   }
  // }
  // useEffect(() => {
  //   getUser()
  // }, [])
  const [callLoading, setCallLoading] = useState(false)
  async function callGroupMange(status) {
    if (
      !Cookie.get('jobPlaceCode')
    ) {
      if (!status) {
        Bus.$emit('setJobPlaceCode', () => callGroupMange(1))
      }
    } else {
      try {
        setCallLoading(true)
        await $http({
          url: '/web/andon/call',
          method: 'get',
          data: {
            warehouseId: Cookie.get('warehouseId'),
            barCode: Cookie.get('jobPlaceCode')
          }
        })
        Dialog.confirm({
          title: '呼叫成功',
          content: '已向组长发送异常呼叫，请耐心等待'
        })
      } catch(e) {
        Dialog.confirm({
          title: '呼叫失败',
          content: <div className='warn-color'>呼叫发送失败：{e.message}</div>
        })
      } finally {
        setCallLoading(false)
      }
    }
  }

  return <div style={{display: 'flex', width: 260, justifyContent: 'flex-end', alignItems: 'center'}}>
    {callLoading ? <div style={{marginRight: 20, color: '#666'}}>呼叫中...</div> : <div style={{marginRight: 20, cursor: 'pointer'}} onClick={() => callGroupMange()}>呼叫组长</div>}
    <Icon title="刷新" type="refresh" mr="30" style={{cursor: 'pointer'}} onClick={() => {
      const pageRefresh = Bus.getState(pageRefreshName)
      if (pageRefresh && typeof pageRefresh === 'function') {
        pageRefresh()
      } else {
        window.location.reload()
      }
    }}></Icon>
    <Setting></Setting>
  </div>
}