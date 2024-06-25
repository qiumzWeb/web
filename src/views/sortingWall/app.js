import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, Dialog, Card, Select } from '@/component'
import {onEnter, Cookie} from 'assets/js/utils'
import { isTrue, isEmpty, _getName } from 'assets/js'
import {
  PrintLabel,
  warehouseId
} from './config'
import {getSubmit, getSortWall, getSortPlan, getSortSlotList, getBestSlot} from './api'

// 视频录制配置
import { checkJobCode, VideoRecordBox } from 'assets/js/videoRecord'
const _videoRecord = new VideoRecordBox();
const Message = Card.message
// 开始录制
function startVideoRecord(searchCode) {
  _videoRecord.startRecord(searchCode, Message)
}
// 结束录制
function finishVideoRecord() {
  _videoRecord.finishRecord()
}


require('./index.scss')
const {useReset, useInput, useRefresh, useAction} = React
// 生成页面、
App.title = '分拣墙'
export default function App(props) {
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur} = useInput(['deliveryCode', 'wallCode'])
    const [wallCode, setWallCode] = useState('')
    const [planCode, setPlanCode] = useState('')
    // 墙配置
    const [wallOptions, setWallOptions] = useState([])
    // 计划配置
    const [planOptions, setPlanOptions] = useState([])
    // 当前墙
    const [wallOption, setWallOption] = useState({})
    // 当前计划
    const [planOption, setPlanOption] = useState({})
    // 格口列表
    const [sortSlotList, setSortSlotList] = useState([])
    // 当前选择格口
    const [selectSlot, setSelectSlot] = useState({})
    //  开始扫描时间
    const [getStartScanTime, setStartScanTime] = useAction('sortintWallStartTime')
    const [scanBestSlot, setScanBeatSlot] = useState({})
    // 当前扫描包裹号
    const [getCurrentSearchCode, setCurrentSearchCode] = useAction('sortingWallCurrentCode')
    // 推荐格口提示语
    const [bestSlotTips, setBestSlotTips] = useState('推荐格口')
// 初始化数据
    useEffect(() => {
      getFocus('wallCode')
      checkJobCode()
      // 加载分拣墙
      getSortWall().then(data => {
        data && Array.isArray(data.data) && setWallOptions(data.data.map(d => ({
          ...d,
          disabled: !d.enableStatus,
          value: d.sortingWallCode,
          label: d.sortingWallName
        })))
      })
      // 加载分拣计划
      getSortPlan().then(data => {
        data && Array.isArray(data.data) && setPlanOptions(data.data.map(d => ({
          ...d,
          value: d.id,
          label: d.solutionName
        })))
      })
      return () => {
        finishVideoRecord()
      }
    }, [])
// 重置页面
    function reset() {
      getFocus('deliveryCode')
      setValue('deliveryCode', '')
      finishVideoRecord()
      const newList = sortSlotList.map(s => {
        if (s.slot == selectSlot.slot) {
          s.deliveries = []
          if (s.slot == scanBestSlot.slot) {
            setScanBeatSlot({})
          }
        }
        return s
      })
      setSortSlotList(newList)
      setSelectSlot({})
      // 若全部完结，则清空缓存数据
      if (newList.every(l => isEmpty(l.deliveries))) {
        window.dbStore.remove(getDbKey())
      } else {
        window.dbStore.set(getDbKey(), newList)
      }
    }
// 分拣墙选择
    function onWallSelect(val) {
      setWallCode(val)
      setValue('wallCode', val)
      const currentWall = wallOptions.find(w => w.value == val) || {}
      setWallOption(currentWall)
      if (val && !planCode) {
        Message.error('请选择分拣计划')
      }
      if (val && planCode) {
        getSortingWallList(planCode, currentWall.sortingWallId)
        getFocus('deliveryCode')
      }
    }
// 分拣计划选择
    function onPlanSelect(val) {
      setPlanCode(val)
      if (val && !wallCode) {
        Message.error('请选择分拣墙')
      }
      setPlanOption(planOptions.find(p => p.value == val) || {})
      if (val && wallCode) {
        getSortingWallList(val, wallOption.sortingWallId)
        getFocus('deliveryCode')
      }
    }
// 扫描分拣墙
    function onScanWall() {
      const code = getValue('wallCode')
      setWallCode(code)
      const currentWall = wallOptions.find(w => w.value == code) || {}
      setWallOption(currentWall)
      document.body.click()
      if (code && !planCode) {
        Message.error('请选择分拣计划')
      }
      if (code && planCode) {
        getSortingWallList(planCode, currentWall.sortingWallId)
        getFocus('deliveryCode')
      }
    }
// 获取缓存dbkey
    function getDbKey(planId, wallId) {
      return `${warehouseId}${wallId || wallOption.sortingWallId}${planId || planOption.id}`
    }
// 获取墙格口列表
    async function getSortingWallList(id, wallId) {
      Message.clear()
      startVideoRecord('' + id + wallId)
      try {
        const res = await getSortSlotList(id)
        const dbKey = getDbKey(id, wallId)
        const dbCache = await window.dbStore.get(dbKey).then(e => e || [])
        if (isEmpty(dbCache)) {
          setCurrentSearchCode(null)
        } else {
          const lastBestSlot = dbCache.reduce((a, b) => {
            if ((a.scanEndTime || 0) > (b.scanEndTime || 0)) {
              return a
            }
            return b
          })
          setScanBeatSlot(lastBestSlot)
        }
        if (Array.isArray(res)) {
          const newList = res.map(r => {
            const data = dbCache.find(d => d.slot == r.slot)
            if (data) {
              Object.assign(r, data)
            }
            return {...r}
          })
          Message.success('onlyAudio')
          setSortSlotList(newList)
          window.dbStore.set(dbKey, newList)
        } else {
          setSortSlotList([])
        }
      } catch(e) {
        Message.error(e.message)
      }
    }
// 包裹号扫描
    function onSearch () {
      if(!checkPackage()) return
      Message.clear()
      setBestSlotTips('正在获取推荐格口...')
      const dbKey = getDbKey()
      const deliveryCode = getValue('deliveryCode')
      _videoRecord.makeTap(Message, deliveryCode)
      setCurrentSearchCode(deliveryCode)
      setValue('deliveryCode', '')
      getFocus('deliveryCode')
      getBestSlot({
        deliveryCode: deliveryCode,
        solutionId: planOption.id,
        wallCode: wallOption.sortingWallCode
      }).then(data => {
        if (!data) return
        if (!getStartScanTime()) {
          setStartScanTime(Date.now())
        }
        const newList = sortSlotList.map(s => {
          if (!Array.isArray(s.deliveries)) {
            s.deliveries = []
          }
          if (s.slot == data.slotNo) {
            Object.assign(s, data, {
              deliveries: [...s.deliveries, ...data.deliveries],
              scanStartTime: getStartScanTime(),
              scanEndTime: Date.now()
            })
          }
          return {...s}
        })
        setScanBeatSlot(data)
        setSortSlotList(newList)
        window.dbStore.set(dbKey, newList)
        Message.success('onlyAudio')
      }).catch(e => {
        Message.error(<div>
          <div>包裹号：{deliveryCode}</div>
          <div>{e.message}</div>
        </div>)
      }).finally(e => {
        setBestSlotTips('推荐格口')
      })
    }
// 提交前检验必填参数
    function checkPackage(flag) {
      const isMsg = flag !== 'nomsg'
      log('开始校验参数')
      log('校验墙号')
      if (!checkWallCode(isMsg)) return false
      log('校验分拣计划')
      if (!checkPlanCode(isMsg)) return false
      log('校验运单号')
      if (!checkSearchCode(isMsg)) return false
      return true
    }
// 校验墙号
    function checkWallCode(isMsg) {
      if (isEmpty(wallCode)) {
        log('请选择墙号')
        isMsg && Message.error('请选择墙号')
        return false
      }
      return true
    }
// 校验分拣计划
    function checkPlanCode(isMsg) {
      if (isEmpty(planCode)) {
        log('请选择分拣计划')
        isMsg && Message.error('请选择分拣计划')
        return false
      }
      return true
    }
// 校验运单号
    function checkSearchCode(isMsg) {
      const searchCode = getValue('deliveryCode')
      if (isEmpty(searchCode)) {
        getFocus('deliveryCode')
        log('请输入包裹运单号')
        isMsg && Message.error('请输入包裹运单号')
        return false
      }
      return true
    }
// 提交
    function submit () {
        if(isEmpty(selectSlot)){
          return Message.error('请选择需要完结的格口')
        }
        if(isEmpty(selectSlot.deliveries)) {
          return Message.error('格口暂无包裹，请先扫描包裹')
        }
        let rfidRef = {value: ''}
        Dialog.confirm({
          title: '提示',
          content: <div>
            是否完结{selectSlot.slot}格口？
            {selectSlot.bindingContainerNo && <div>
              <Input style={{color: '#333'}} placeholder="请输入RFID" mt="10" label='RFID' ref={ref => rfidRef = ref}></Input>
            </div> || ''}
          </div>,
          onOk: async() => {
            if (selectSlot.bindingContainerNo && !rfidRef.value) return '请输入RFID'
            try{
              setBtnLoading(true)
              Message.info('正在提交数据...')
              const res = await getSubmit({
                wallId: wallOption.sortingWallId, // 墙id
                solutionId: planOption.id, // 计划Id
                packageDeliveries: selectSlot.deliveries, // 包裹列表
                containerNo: rfidRef.value, // RFID
                slotNo: selectSlot.slot, // 格口号
                areaNo: selectSlot.matchedAreaNo, // 库区
                tail: selectSlot.isTail, // 是否尾包
                singleTail: selectSlot.isSingleTail, // 是否单包
                taskStartDate: selectSlot.scanStartTime, // 开始扫描时间
              })
              Message.success(<div>
                <div>格口完结成功</div>
                格口：{selectSlot.slot}
              </div>)
              reset()
            } catch(e) {
              finishVideoRecord()
              Message.error(e.message)
            } finally {
              setBtnLoading(false)
            }
          }
        })
    }
    return <div className="sortint-wall">
        <Card>
        <div slot="content">
          <div style={{display: 'flex'}}>
            <Select dataSource={wallOptions} style={{flex: 1}} mr="10" value={wallCode} onChange={onWallSelect} hasClear>
              <Input label="分拣墙" placeholder="请扫描或选择墙号" ref={refs['wallCode']} onEnter={onScanWall}></Input>
            </Select>
            <Select dataSource={planOptions} style={{flex: 1}} value={planCode} onChange={onPlanSelect} label="分拣计划" hasClear></Select>
          </div>
          <Input mt="10" ref={refs['deliveryCode']} onEnter={onSearch} label="包裹运单号"></Input>
          {sortSlotList.length && <div className="sort-wall-list">
            {sortSlotList.map((s, index) => {
              return <div className={`sortCell ${selectSlot.slot == s.slot ? "select" : ''} ${scanBestSlot.slotNo == s.slot ? 'active' : ''}`}
                onClick={() => setSelectSlot(s)} key={index}
                style={{width: `${100 / ( wallOption.cols || 5)}%`}}
              >
                <div className='sortCount'>{Array.isArray(s.deliveries) && s.deliveries.length || 0}</div>
                <div className='sortSlot'>{s.slot || ''}</div>
              </div>
            })}
          </div> || ''}
        </div>
        <div slot="btnTools" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <div className="btnbox"></div>
            <div>
                {sortSlotList.some(s => s.deliveries && s.deliveries.length) && <Button onClick={submit} disabled={btnLoading}>完结格口</Button>}
            </div>
        </div>
        <div slot="info">
          {sortSlotList.length && <div>
            <div className='warn-title'>{bestSlotTips || '推荐格口'}</div>
            <div className='best-slot'>{scanBestSlot.slotNo || '无'}</div>
            <div className="scan-record">
              {sortSlotList.map((s) => {
                return <div key={s.slot}>
                  {Array.isArray(s.deliveries) && s.deliveries.map(m => {
                    return <div key={m} className={`scan-record-cell ${getCurrentSearchCode() == m ? 'active' : ''}`}>
                      {m}{' => '}格口：{s.slot}
                    </div>
                  })}
                </div>
              })}
            </div>
          </div> || ''}
        </div>  
        </Card>
    </div>
}
