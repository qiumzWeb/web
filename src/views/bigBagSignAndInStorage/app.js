import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, Table, Dialog, Card, AutoSubmit } from '@/component'
import { localStore, Cookie, codeRegExp } from 'assets/js/utils'
import { isTrue, isEmpty, _getName, isSame } from 'assets/js'
import Bus from 'assets/js/bus'
import {
  columns,
  setRowClass,
  getMark,
  lastPkgCountKey
} from './config'
import { getSearch } from './api'
import { getSubmit } from "@/views/smallPutin/api"

// 视频录制配置
import { checkJobCode, VideoRecordBox } from 'assets/js/videoRecord'
const _videoRecord = new VideoRecordBox();
const Message = Card.message
// 开始录制
function startVideoRecord(searchCode) {
  _videoRecord.startRecord(searchCode, Message)
}
// 打水印
function VideoRecordMakeTap(deliveryCode) {
  _videoRecord.makeTap(Message, deliveryCode)
}
// 结束录制
function finishVideoRecord() {
  _videoRecord.finishRecord()
}

const {useReset, useInput, useRefresh, useAction} = React
// 生成页面、
App.title = '签收入库';
const autoKey = 'BigBagSignAndInstorageAuto'
export default function App(props) {
    const [tableData, setTableData] = useState([])
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur} = useInput(['searchCode'])
    const [getScanStatus, setScanStatus] = useAction() // 扫描状态
    const [getCartCode, setCartCode] = useAction() // 大包号
    const [baseData, setBaseData] = useState({}) // 基本信息
    const [currentScanPackage, setCurrentScanPackage] = useState()
    // 异常包裹数量
    const [exceptionPackageCount, setExceptionPackageCount] = useState(0)
// 初始化数据
    useEffect(() => {
      getFocus('searchCode')
      // 检查是否启用视频录制 并校验桌号
      checkJobCode(onSearch)
      return () => {
        setScanStatus(false)
        setCartCode('')
        setBaseData({})
        setBtnLoading(false)
        setTableData([])
        setExceptionPackageCount(0)
        // 结束录制
        finishVideoRecord()
      }
    }, [])

// 重置页面
    useReset(() => {
      getFocus('searchCode')
      setScanStatus(false)
      setCartCode('')
      setBaseData({})
      setBtnLoading(false)
      setTableData([])
      setExceptionPackageCount(0)
      // 结束录制
      finishVideoRecord()
    }, [])


// 扫描校验数据
    function setScanData (data, value) {
        if (!data.some(d => {
            if (isSame(d.trackingNumber, value)) {
              getPackageInstore(value, d, data)
              return true
            }
            return false
        })) {
          const newMorePackage = {
            trackingNumber: value,
            logisticsOrderCode: '多件',
            exceptionStatus: '多票',
            exceptionDesc: '扫描的包裹不属于当前大包：',
          }
          getPackageInstore(value, newMorePackage, [newMorePackage, ...data])
        }
    }

// 包裹框号扫描
    async function onSearch(){
      Message.clear()
      try {
        const scanCode = getValue('searchCode')
        // 校验桌号
        await checkJobCode(onSearch)
        if (scanCode) {
          // 判断扫描状态， 是否是第一次扫描，第一次扫描为框号扫描，拉取包裹列表
          if (!getScanStatus()) {
            // 第一次扫描保存扫描状态和框号
            setScanStatus(true)
            // 保存框号
            setCartCode(scanCode)
            getList()
          } else {
            // 其它包裹（非第一次扫描），包裹校验
            setCurrentScanPackage(scanCode)
            getList(tableData)
          }
          
        } else {
          getFocus('searchCode')
        }
      } catch(e){
        Message.error(e.message || e)
      }
    }

    // 获取包裹列表数据
    function loadTableData(data) {
      // 异常包裹
      const abnormalList = data.filter(d => d.logisticsOrderCode == '多件');
      // 其它包裹
      const normalList = data.filter(d => d.logisticsOrderCode != '多件' && d.status != 10);
      // 已入库包裹 
      const instoreList = data.filter(d => d.status == 10 && d.logisticsOrderCode != '多件');

      setTableData([...abnormalList, ...normalList, ...instoreList])
    }
    async function getList(data) {
        const value = (getValue('searchCode') || '').trim()
        setValue('searchCode', '')
        getFocus('searchCode')
        try {
            if (data) {
              // 加载包裹信息
              ondeliveryCodeScan(value, data)
            } else {
              Message.info('数据获取中....')
              setBtnLoading(true)
              const res = await getSearch(value).then(data => {
                return data
              }).catch(getAbnormalExit)
              // 开启录制 
              startVideoRecord(value)
              // 加载包裹信息
              if (res && Array.isArray(res.packageInfoList)) {

                res.packageInfoList.forEach(f => {
                  // 已入库包裹自动标记
                  if (f.status == 10) {
                    getMark(f)
                  }
                })
                setExceptionPackageCount(res.packageInfoList.filter(f => f.exceptionStatus).length);
                ondeliveryCodeScan(null, res.packageInfoList)

              }
              // 缓存数据
              setBaseData(res || {})

              Message.success(' ')
            }
        } catch (e) {
            Message.error(e.message)
        }
        setBtnLoading(false)
    }

    // 异常退出，中断扫描
    function getAbnormalExit(e) {
      useRefresh()
      throw new Error(e.message || e)
    }

// 包裹扫描
    async function ondeliveryCodeScan (value, data = tableData) {
      // 单个扫描
      value && setScanData(data, value);
      loadTableData([
        ...data
      ])
    }

// 判断是否自动完结
function isAutoSubmit() {
  const isAuto = AutoSubmit.status()
  log(`检查自动完结状态： ${isAuto}`)
  if (isEmpty(isAuto)) return false
  return true
}

// 包裹 入库 
    async function getPackageInstore(deliveryCode, d, listData = tableData) {
      return getSubmit({
        packageType: '2',
        deliveryCode,
      }).then(res => {
        // 录制打水印
        VideoRecordMakeTap(deliveryCode);
        const data = res.data || {}
        if (d) {
          getMark(d);
          loadTableData([...listData])
        }
        const showDesc = <div style={{display: 'flex', justifyContent: 'center',flexDirection: 'column'}}>
          {d.exceptionDesc || ""}
          <div>{deliveryCode}</div>
          {data.alertDivisionText && <div>国家：{data.alertDivisionText}</div>}
          {data.alertServiceText && <div>业务：{data.alertServiceText}</div>}
          {data.alertElectricText && <div>是否带电：{data.alertElectricText}</div>}
          {data.isTailText && <div style={{fontSize: px2rem(100)}}>{data.isTailText}</div>}
          {data.alertResultText && <div style={{fontSize: px2rem(100)}}>{data.alertResultText}</div>}
          <div style={{fontSize: px2rem(80)}}>入库成功</div>
        </div>
        if (d.exceptionDesc) {
          setExceptionPackageCount(1 + exceptionPackageCount)
          Message.error(showDesc);
        } else {
          Message.success(showDesc);
        }

        // 如果全部完成入库， 自动刷新页面
        if (tableData.every(t => t.isActive) && isAutoSubmit()) {
          useRefresh()
        }
      }).catch(e => {
        if (d.isActive == 1 && codeRegExp.test(deliveryCode)) {
          Message.error(<div>
            <div>重复扫描，包裹已入库</div>
            <div>{e.message}</div>
          </div>)
        } else {
          Message.error(e.message)
        }
      })
    }

    return <div className="mergeOrder">
        <Card audioType={1}>
        <div slot="content">
          <div style={{ display: 'flex' }}>
              <Input ref={refs['searchCode']} style={{ flex: 1 }} onEnter={onSearch} label="大包号/包裹号"></Input>
              <Button disabled={btnLoading} onClick={onSearch}>提交</Button>
          </div>
          <Table columns={columns} data={tableData} rowClass={setRowClass} mt="10" maxHeight={'calc(100vh - 380px)'}></Table>
        </div>
        <div slot="btnTools" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <div className="btnbox">
            </div>
            <div>
              <AutoSubmit autoKey={autoKey} isAuto>自动完结</AutoSubmit>
              <Button onClick={() => {
                useRefresh()
              }} disabled={btnLoading}>完结</Button>
            </div>
        </div>
        <div slot="info">
            <div style={{ background: "#d7d7d7", color: '#333', fontSize: '25px', padding: '10px', lineHeight: '50px',fontWeight: 'bold' }}>
                <div>大包号：{getCartCode() || ''}</div>
                <div>已扫/总数：{tableData.filter(t => t.isActive).length} / {tableData.length}</div>
                <div>当前扫描包裹号：{currentScanPackage || ''}</div>
                <div>预报数量：{baseData.packageCount || 0}</div>
                <div>异常包裹数：{exceptionPackageCount}</div>
            </div>
        </div>  
        </Card>
    </div>
}
