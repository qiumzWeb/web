import React, {useEffect, useState, useRef } from 'react'
import { Icon, FullSreen, Select, Dialog, VideoRecord, Input } from '@/component'
import { logout, setWid, getWid, currentPrintDataKey, localStore, isJSON } from 'assets/js'
import SelectWarehouse from '../selectwarehouse'
import Api from 'assets/api'
import SetRegion from './setRegion'
import SetPrintAssign from './setPrintAssign'
import SetPkgType from './setPkgType'
import SetElectrifyParams from './setElectrifyParams'
import SetJobPlaceCode from './setJobPlaceCode'
import SetAllotWallCode from './setAllotWallCode'
import SetAutoSubmitTimes from './setAutoSubmitTimes'
import Tools from './tools'

import { Print } from 'assets/js/utils'
// 打印面单 
function PrintLabel(data) {
  return new Print(data).send()
}


export default function App(props) {
    const warehouseRef = useRef()
    const regionRef = useRef()
    const printRef = useRef()
    const pkgTypeRef = useRef()
    const electrifyRef = useRef()
    const jobPlaceCodeRef = useRef()
    const allotWallCodeRef = useRef()
    const autoSubmitTimesRef = useRef()
    // 部分设备 lemoCode 设备不支持，将不做显示
  const setConfig = [
    // 此全屏模式仅支持 PC 设备， lemoCode 请使用lemoCode 内部全屏按钮
    {label: <FullSreen node={document.documentElement}></FullSreen>, show: !isPow()},
    {label: '设置入库地区', onClick: () => {regionRef.current.open()}},
    // PC 云打印组件专用设置， lemoCode 设备无需设置
    {label: '设置打印机', onClick: () => {printRef.current.open()}, show: !isPow()},
    {label: '设置作业包裹类型', onClick: () => {pkgTypeRef.current.open()}},
    {label: '设置带电参数', onClick: () => {electrifyRef.current.open()}},
    {label: '设置作业台号', onClick: () => {jobPlaceCodeRef.current.open()}},
    // 自动提交时间设置，仅开启自动提交生效，默认长期缓存永不过期，lemoCode设备强制断电时会丢失缓存需要重新设置
    {label: '设置自动提交时间', onClick: () => {autoSubmitTimesRef.current.open()}},
    // {label: '设置播种墙号', onClick:  () => {allotWallCodeRef.current.open()}},
    {label: '切换仓库', value: '', onClick: () => {warehouseRef.current.open()}},
    {label: () => window.debugStatus ? '关闭Debug模式' : '开启Debug模式', onClick: Tools.openDebug},
    {label: () => window.debugStatus ? '打印测试' : '', onClick: Tools.openPrintTest},
    {label: <VideoRecord></VideoRecord>, show: !isPow()},
    {label: '退出登录', onClick: () => {
      Dialog.confirm({
        title: '退出登录',
        content: '确认退出当前登录账户？',
        onOk: () => logout('exit')
      })
    }}
  ]
  return <span>
    <Select
      dataSource={setConfig}
    >
      <Icon title='操作设置' type="settings" style={{cursor: 'pointer'}}></Icon>
    </Select>
    <SelectWarehouse ref={warehouseRef}></SelectWarehouse>
    <SetRegion ref={regionRef}></SetRegion>
    <SetPrintAssign ref={printRef}></SetPrintAssign>
    <SetPkgType ref={pkgTypeRef}></SetPkgType>
    <SetElectrifyParams ref={electrifyRef}></SetElectrifyParams>
    <SetJobPlaceCode ref={jobPlaceCodeRef}></SetJobPlaceCode>
    <SetAllotWallCode ref={allotWallCodeRef}></SetAllotWallCode>
    <SetAutoSubmitTimes ref={autoSubmitTimesRef}></SetAutoSubmitTimes>
    </span>
}