import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, Table, Dialog, Card, Select, RadioGroup, CheckBox, Row, AutoSubmit } from '@/component'
import { localStore, Cookie, isType, onEnter, codeRegExp, weightRegExp } from 'assets/js/utils'
import { isTrue, isEmpty, _getName, isJSON } from 'assets/js'
import {
  columns,
  setRowClass,
  lastPkgCountKey,
  getMark,
  POWWT,
  PrintLabel,
  getDeliveryCode,
  splitCodeReasonOptions,
  setDisabled,
} from './config'
import { getSearch, getSubmit, getSplitCode, getLogisticsCompany } from './api'

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



const {useReset, useInput, useRefresh, useAction} = React
// 生成页面、
App.title = '退货'
// 定时器
let timer = null
const autoKey = 'returnGoodsAuto'
let onWeightAutoSubmit = () => {}
export default function App(props) {
    const [tableData, setTableData] = useState([])
    const [btnLoading, setBtnLoading] = useState(false)
    const [isJOOMPackage, setIsJOOMPackage] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur} = useInput([
      'searchCode', 'weight', 'returnShipper', 'returnTrackingNumber'
    ])
    const [getScanStatus, setScanStatus] = useAction('returnGoodsScanFlag')
    const [getCartCode, setCartCode] = useAction('returnGoodsCode') // 退货框号
    const [getReturnShipper, setReturnShipper] = useAction('returnShipperCompany')// 退货快递公司
    const [returnShipperOptions, setReturnShipperOptions] = useState([])
    // 拆单
    const [splitCodeCount, setSplitCodeCount] = useState(0)
    onWeightAutoSubmit = getAutoSubmit
// 初始化数据
    useEffect(() => {
      getFocus('searchCode')
      checkJobCode()
      // 初始化默认设置快递公司为 顺丰 "SF"
      
      getLogisticsCompany().then(res => {
        if (Array.isArray(res)) {
          if (res[0] && res[0].value) {
            setReturnShipper(res[0].value)
          }
          setReturnShipperOptions(res);
        }
      })
      return () => {
        finishVideoRecord()
      }
    }, [])
    useEffect(() => {
      // 列表更新时触发自动提交
      getAutoSubmit()
    }, [tableData])
// 初始化页面配置
    function InitConfig() {
      // 实时获取称重
      POWWT.getWeight({
        onChange: val => setValue('weight', val),
        onCompleted: val => {
          log(`重量稳定： ${val}`)
          const isAuto = AutoSubmit.status()
          log(`检查自动提交状态： ${!isEmpty(isAuto)}`)
          if (isEmpty(isAuto)) return
          log(`触发自动提交==`)
          onWeightAutoSubmit()
        }
      })
    }
// 重置页面
    useReset(() => {
      getFocus('searchCode')
      setTableData([])
      setScanStatus(null)
      setCartCode(null)
      finishVideoRecord()
    }, [])
// 扫描校验数据
    const setScanData = (data, value) => {
        if (!data.some(d => {
            if (d.deliveryCode === value) {
              if (d.isActive == 1) {
                Message.success('已校验')
              } else {
                getMark(d)
                _videoRecord.makeTap(Message, value)
                // JOOM 仓单包裹退货
                if (data.intSign == '1') {
                  const address = typeof d.features === 'string' && d.features.replace(';return_address:', '') || '未知'
                  Message.success(<div>
                    校验成功
                    <div>
                   {address ? <pre style={{wordBreak:'break-all', whiteSpace: 'break-spaces'}}>
                   {"退件地址\n"}
                   {address}
                   </pre> : ''}
                    </div>
                  </div>)
                } else {
                  Message.success('校验成功')
                }
                
              }
              return true
            }
            return false
        })) {
            Message.error('扫描的运单号不是当前退货的包裹,运单号：' + value)
        }
    }

// 包裹框号扫描
    function onSearch () {
      Message.clear()
      const searchCode = getValue('searchCode')
      if (searchCode) {
        // 判断扫描状态， 是否是第一次扫描，第一次扫描为框号扫描，拉取包裹列表
        if (!getScanStatus()) {
          // 第一次扫描保存扫描状态和框号
          setScanStatus(true)
          setCartCode(searchCode)
          startVideoRecord(searchCode)
          getList()
        } else {
          // 其它包裹（非第一次扫描），包裹校验
          getList(tableData)
        }
      }
    }
    // 获取包裹列表数据
    const loadTableData = function(data) {
        setTableData(data)
    }
    const getList = async (data) => {
        const value = getValue('searchCode')
        setValue('searchCode', '')
        getFocus('searchCode')
        try {
            if (data) {
              // 加载包裹信息
              ondeliveryCodeScan(value, data)
            } else {
                Message.info('数据获取中....')
                const res = await getSearch(value).catch(getAbnormalExit);
                setIsJOOMPackage(res.intSign == '1');
                // 初始化配置信息
                InitConfig()
                // 加载包裹信息
                if (res && Array.isArray(res)) {
                  ondeliveryCodeScan(value, res)
                }
            }
        } catch (e) {
            Message.error(e.message)
        }
    }
// 异常退出，中断扫描
    function getAbnormalExit(e) {
      // 包裹异常， 重置扫描状态和框号
      setScanStatus(null)
      setCartCode(null)
      throw new Error(e.message || e)
    }
// 包裹扫描
    function ondeliveryCodeScan (value, data = tableData) {
      setScanData(data, value)
      loadTableData([
          ...data
      ])
      // setTimeout(getAutoSubmit, 50)
    }
// 重量扫描
    function onWeightScan() {
      setTimeout(getAutoSubmit, 50)
    }
// 快递公司选择
    function onReturnShipperSelect(val) {
      console.log(val, '---------')
      setReturnShipper(val)
    }
// 快递单号扫描
    function onReturnTrackingNumberScan() {
      setTimeout(getAutoSubmit, 50)
    }
// 提交前检验必填参数
    function checkPackage(flag) {
      const isMsg = flag !== 'nomsg'
      log('开始校验参数')
      // 检查是否完成扫描, 未完成扫描无法提交
      log(`校验tableData`)
      log(tableData)
      if (isEmpty(tableData) || !tableData.every(t => t.isActive)) return false
      // 需要称重的时候 ，校验重量
      // log('校验重量')
      // if (!checkWeight(isMsg)) return false
      // JOOM 包裹 需要校验快递公司和快递单号
      console.log(isJOOMPackage, '====校验是否为JOOM包裹===')
      if (isJOOMPackage) {
        if(!checkReturnShipper(isMsg)) return false
        if(!checkReturnTrackingNumber(isMsg)) return false
      }
      return true
    }
// 校验快递公司
    function checkReturnShipper(isMsg) {
      // 需要快递公司的时候 ，校验快递公司
      const returnShipper = getReturnShipper()
      if (isEmpty(returnShipper)) {
        getFocus('returnTrackingNumber')
        log('快递公司有误，请选择快递公司')
        isMsg && Message.error('快递公司有误，请选择快递公司')
        return false
      }
      return true
    }
// 校验快递单号
    function checkReturnTrackingNumber(isMsg) {
      // 需要快递单号的时候 ，校验快递单号
      const ReturnTrackingNumber = getValue('returnTrackingNumber')
      if (isEmpty(ReturnTrackingNumber)) {
        getFocus('returnTrackingNumber')
        log('快递单号有误，请检查快递单号')
        isMsg && Message.error('快递单号有误，请检查快递单号')
        return false
      }
      return true
    }
// 校验重量
    function checkWeight(isMsg) {
      // 需要称重的时候 ，校验重量
      const weight = getValue('weight')
      if (isEmpty(weight) || !weightRegExp.test(weight)) {
        getFocus('weight')
        log('包裹重量有误，请检查重量')
        isMsg && Message.error('包裹重量有误，请检查重量')
        return false
      }
      return true
    }
// 自动提交
    function getAutoSubmit() {
      checkPackage('nomsg') && submit()
    }

// 校验JOOM 仓库异常不需要打印
    function checkNotNeedPrint(res) {
      return res.errCode == 'UN_PRINT_FOR_JOOM'
    }
// 提交退货
    async function submit ({dataList = tableData, weighVerifyFlag} = {}) {
        const deliveryCodes = getDeliveryCode(dataList)
        console.log()
        log('完成校验，正在提交====')
        try{
          setBtnLoading(true)
          Message.info('正在提交数据...')
          const res = await getSubmit({
            searchCode: getCartCode().trim(),
            deliveryCodeList: deliveryCodes.pass,
            weight: getValue('weight'),
            deliveryCodeTimeList: deliveryCodes.time,
            returnShipper: isJOOMPackage ? getReturnShipper() : undefined,
            returnTrackingNumber: isJOOMPackage ? getValue('returnTrackingNumber') : undefined,
          })
          Message.success('正在打印...')
          if (splitCodeCount) {
            setSplitCodeCount(splitCodeCount + 1)
          }
          Cookie.set(lastPkgCountKey, deliveryCodes.pass.length, {hour: 30 * 24})
          // 异常模式不走打印
          if (checkNotNeedPrint(res)) {
            Message.success(res.message || '操作成功')
            useRefresh()
          } else {
            PrintLabel(res).then((res) => {
              Message.success('操作成功')
              useRefresh()
            }).catch((err) => {
              finishVideoRecord()
              Message.error('打印失败,请检查打印组件')
            })
          }

        } catch(e) {
          // 异常模式不走打印
          if (checkNotNeedPrint(e)) {
            Message.success(e.message || '操作成功')
            useRefresh()
          } else {
            finishVideoRecord()
            Message.error(e.message)
          }
        } finally {
          setBtnLoading(false)
          if (splitCodeCount) {
            setSplitCodeCount(0)
          }
        }
    }
// 拆单
    async function setSplitCode() {
      // 校验重量
      if (!checkWeight(true)) return
      let redioRef = ''
      Dialog.confirm({
        autoKey,
        title: '退货拆单原因选择',
        content: <div>
          <RadioGroup ref={ref => redioRef = ref} value={['returnOverWeightSeparte']} dataSource={splitCodeReasonOptions}></RadioGroup>
        </div>,
        okLoadingText: '正在提交...',
        onOk: async () => {
          try {
            if (isEmpty(redioRef.value)) {
              return '请选择拆单原因'
            }
            const deliveryCodes = getDeliveryCode(tableData)
            const res = await getSplitCode({
              searchCode: getCartCode().trim(),
              deliveryCodeList: deliveryCodes.pass,
              weight: getValue('weight'),
              deliveryCodeTimeList: deliveryCodes.time,
              separteType: redioRef.value[0],
              returnShipper: isJOOMPackage ? getReturnShipper() : undefined,
              returnTrackingNumber: isJOOMPackage ? getValue('returnTrackingNumber') : undefined,
            })
            Message.success('拆单成功，正在打印...', 0)
            setSplitCodeCount(splitCodeCount + 1)
            useRefresh()
            // 异常模式不走打印
            if (checkNotNeedPrint(res)) {
              Message.success(res.message || '操作成功')
            } else {
              PrintLabel(res).then((r) => {
                Message.success('拆单打印成功', 0)
              }).catch((e) => {
                Message.error('打印失败,请检查打印组件')
              })
            }

          } catch(e) {
            // 异常模式不走打印
            if (checkNotNeedPrint(e)) {
              Message.success(e.message || '操作成功')
              useRefresh()
            } else {
              Message.error(e.message)
            }
          }
        }
      })

    }
    console.log(isJOOMPackage, '-------------')
    return <div className="return-goods">
        <Card>
        <div slot="content">
            <div style={{ display: 'flex' }}>
                <Input ref={refs['searchCode']} style={{ flex: 1 }} onEnter={onSearch} label="框号/包裹号"></Input>
                <Button onClick={onSearch}>提交</Button>
            </div>
            <Table columns={columns} data={tableData} rowClass={setRowClass} mt="10" maxHeight={'calc(100vh - 380px)'}></Table>

            {isJOOMPackage && <Select dataSource={returnShipperOptions} label="快递公司" value={getReturnShipper()}
              style={{width: '100%', marginTop: 10}} onChange={onReturnShipperSelect}>
            </Select> || null}
            
            <Input show={isJOOMPackage} label="快递单号" mt='10' ref={refs['returnTrackingNumber']} onEnter={onReturnTrackingNumberScan}></Input>

            <Input label="包裹重量(KG)" mt='10' ref={refs['weight']} onEnter={onWeightScan}></Input>
        </div>
        <div slot="btnTools" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <div className="btnbox">
                <Button disabled={isEmpty(getDeliveryCode(tableData).pass)} onClick={setSplitCode}>拆单</Button>
            </div>
            <div>
                <AutoSubmit autoKey={autoKey}></AutoSubmit>
                <Button onClick={() => {
                  checkPackage() && submit()
                }} disabled={btnLoading}>提交</Button>
            </div>
        </div>
        <div slot="info">
            <div style={{ background: "#d7d7d7", color: '#333', fontSize: '25px', padding: '10px', lineHeight: '50px',fontWeight: 'bold' }}>
                <div>包裹总数：{tableData.length}</div>
                <div>已校验数：{tableData.filter(t => t.isActive).length} / {tableData.length}</div>
                {splitCodeCount ? <div>拆单操作：{splitCodeCount}</div> : ''}
                <div>上一单数量：{Cookie.get(lastPkgCountKey) || 0}</div>
            </div>
        </div>  
        </Card>
    </div>
}
