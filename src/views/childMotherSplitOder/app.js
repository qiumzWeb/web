import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, Table, Dialog, KeyBoard, Card, RadioGroup, CheckBox, Row } from '@/component'
import { localStore, Cookie, isType, onEnter, codeRegExp, weightRegExp } from 'assets/js/utils'
import { isTrue, isEmpty, _getName, isSame } from 'assets/js'
import { checkBillIsFail, checkVolumeMergeCode } from '@/views/mergeOrder/config'
import Bus from 'assets/js/bus'
import {
  warehouseId,
  isCOE,
  columns,
  _getExceptionDesc,
  setRowClass,
  getMark,
  POWWT,
  PrintLabel,
  _startRecord,
  _stopRecord,
  getVideoMakeTap,
  getDeliveryCode,
  splitCodeReasonOptions,
  setDisabled,
  checkJobCode
} from './config'
import { getSearch, getSubmit, getEyeVideoConfig, getMorePackage, getConfirmCancel, getNotifyServer, getLessCode, getSplitCode, getChangeCodeLabel, getVolumeTagPrint } from './api'
const {useReset, useInput, useRefresh, useAction, useRouterEffect} = React
const Message = Card.message
// 生成页面、
App.title = '子母件拆单'
// 定时器
let timer = null
const VolumsConf = {
  width: 'boxWidth',
  height: 'boxHeight',
  length: 'boxLength'
}
const inputGroup = ['boxCode', 'packingMaterialCode', 'weight', 'splitCount']

export default function App(props) {
  // 获取参数
    const [tableData, setTableData] = useState([])
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur, getSelect} = useInput([
      'searchCode', 'changeCode', ...inputGroup, ...Object.values(VolumsConf)
    ])
    const [getScanStatus, setScanStatus] = useAction('splitScanFlag')
    const [getCartCode, setCartCode] = useAction('splitCode') // 合箱框号
    const [getTagCode, setTagCode] = useAction('splitTagCode') // 合箱小票单号
    const [getDialogStatus, setDialogStatus] = useAction('splitDialogFlag')
    const [baseData, setBaseData] = useState({}) // 基本信息
    const [getBaseBata, setBaseDataCache] = useAction() // 缓存基本信息
    const [isScanGiftService, setIsScanGiftService] = useState(false) // 是否扫描赠品
    const [goBackFrom, setGoBackFrom] = useState() // 返回路由地址
    // 拆单
    const [splitCodeCount, setSplitCodeCount] = useState(0)
    const [splitType, setSplitType] = useState(['mergeOverVolumeSeparte'])
    // 输入框显示逻辑
    const isNeedBox = baseData.isNeedBox === true // 是否需要箱号
    const isWeigh = baseData.isWeigh !== false // 是否需要称重
    const needScanPackingMaterial = !!(!baseData.singleParcel ? baseData.needScanPackingMaterial : baseData.singleParcelNeedScanPackingMaterial)// 是否需要包材
    // 是否为大小件或者大大件
    const getPackType = data => {
      return {
        bs: data.isAddNum,
        bb: data.isAutoSeparate,
        all: data.isAddNum || data.isAutoSeparate
      }
    }
    // 是否需要测量体积
    const isVolumeVerify = baseData.isVolumeVerify == '1' 
    // 是否需要打小票
    const isPrinTicket  = baseData.isPrinTicket
    // 合箱重量累加值
    const [getMergeWeightTotal, setMergeWeightTotal] = useAction('splitMergeWeightTotal')
    setBaseDataCache(baseData)
// 初始化数据
    useEffect(() => {
      getFocus('searchCode')
      checkJobCode(onSearch)
      return () => {
        setScanStatus(null)
        setCartCode(null)
        setDialogStatus(null)
        setMergeWeightTotal(0)
        _stopRecord({...getBaseBata(), cartCode: getCartCode()})
      }
    }, [])
// 路由初始化
    useRouterEffect(({state}) => {
      // 设置路由返回路径
      if (state && state.from) {setGoBackFrom(state.from)}
      // 路由state 存在包裹 code 时，执行自动扫描
      if (state && state.code) {
        setValue('searchCode', state.code)
        onSearch()
        // 用完code 立即清除 code
        // return Object 用于更新 Router 状态
        return {
          state: {
            ...state,
            code: undefined
          }
        }
      }
    })
// 列表更新
    useEffect(() => {
      // 列表更新时触发自动提交
      getAutoSubmit()
    }, [tableData])
// 初始化页面配置
    function InitConfig(data = baseData) {
      // 设置合箱包裹总重量
      data.oneMore && data.totalWeight && setValue('weight', data.totalWeight)
      // 是否显示合箱重量
      // 实时获取称重
      if (data.isWeigh !== false) {
        POWWT.getWeight({
          onChange: val => setValue('weight', val),
        })
      }
    }
// 重置页面
    useReset(() => {
      getFocus('searchCode')
      _stopRecord({...getBaseBata(), cartCode: getCartCode()})
      setTableData([])
      setScanStatus(null)
      setCartCode(null)
      setTagCode(null)
      setBaseData({})
      setDialogStatus(null)
      setMergeWeightTotal(0)
      setIsScanGiftService(false)
    }, [])
// 扫描校验数据
    const setScanData = (data, value, packData) => {
      const isNeedVolume = isVolumeVerify || (packData && packData.isVolumeVerify == 1);
      const isNeedPrintTag = isPrinTicket || (packData && packData.isPrinTicket);
        if (!data.some(d => {
            if (isSame(d.deliveryCode, value)) {
              if (d.isActive == 1) {
                // Message.error(`该包裹:${value}已经扫描过了`)
                Message.success('已校验')
                // 触发小票测体积检测
                if (isNeedVolume && value == getTagCode()) {
                  onVolumeScan({target: {value}})
                }
              } else {
                // 累加重量
                setMergeWeightTotal(getMergeWeightTotal() + d.weight)
                getMark(d)
                // COE 扫描通知后台
                getNotifyServer(value, Message)
                Message.success(<div style={{display: 'flex', justifyContent: 'center',flexDirection: 'column'}}>
                  <div>校验成功</div>
                  {packData && packData.giftService && `赠品：${packData.giftService}`}
                </div>)

                // 天猫海外美加业务保存小票单号，用于测量体积
                if ((isNeedPrintTag || isNeedVolume) && !getTagCode()) {
                  setTagCodeAndPrint(value)
                }
              }
              return true
            }
            if (baseData.giftService && value == Cookie.get('warehouseId')) {
              Message.success('校验成功：赠品码')
              setIsScanGiftService(true)
              return true
            }
            return false
        })) {
            Message.error('扫描的运单号不是当前合箱的包裹,运单号：' + value)
            // 多票包裹接口验证
            getMorePackage({deliveryCode: value, searchCode: getCartCode()}).then(msg  => {
              getBlur('searchCode')
              setDialogStatus('open')
              const onClose = () => {
                getFocus('searchCode')
                setDialogStatus(null)
                Message.clear()
              }
              Dialog.confirm({
                title: '警告!',
                content: msg,
                onCancel: onClose,
                onClose: onClose,
                onOk: onClose,
              })
            }).catch(e => Message.error(e.message))
        }
    }

// 包裹框号扫描
    async function onSearch () {
      Message.clear()
      try {
        // 校验桌号
        await checkJobCode(onSearch)
        if (getValue('searchCode')) {
          // 判断扫描状态， 是否是第一次扫描，第一次扫描为框号扫描，拉取包裹列表
          if (!getScanStatus()) {
            // 第一次扫描保存扫描状态和框号
            setScanStatus(true)
            setCartCode(getValue('searchCode'))
            getList()
          } else {
            // 其它包裹（非第一次扫描），包裹校验
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
    const loadTableData = function(data) {
        setTableData(data)
    }
    const getList = async (data) => {
        const value = (getValue('searchCode') || '').trim()
        setValue('searchCode', '')
        getFocus('searchCode')
        try {
            if (data) {
              // 加载包裹信息
              ondeliveryCodeScan(value, data)
            } else {
                Message.info('数据获取中....')
                const res = await getSearch(value).then(data => {
                  if (data.allowSubSeparate !== true) {
                    throw new Error(`当前包裹无法进行拆单操作,请联系管理员配置国家白名单`)
                  }
                  if (data.pickUpAllowSubSeparate === false) {
                    throw new Error(`该订单为自提订单，暂不支持子母件拆单`)
                  }
                  if(data && Array.isArray(data.voList)) {
                    data.voList.some(v => {
                      if (isTrue(v.exceptionType) && parseInt(v.exceptionType) > 0) {
                        if (parseInt(v.exceptionType) == 200) { // 已取消包裹发送确认请求
                          getConfirmCancel(v.deliveryCode).catch(e => Message.error(e.message || '拦截取消包裹失败'))
                        }
                        loadTableData(data.voList)
                        // 异常包裹终止合箱扫描
                        throw new Error(_getExceptionDesc(v.exceptionType, v.deliveryCode))
                      }
                    })
                  } else {
                    throw new Error('服务器无响应')
                  }

                  // 新加坡流包裹未完税提示
                  if(data.isGstPaid) {
                    getBlur('searchCode')
                    setDialogStatus('open')
                    const onClose = () => {
                      getFocus('searchCode')
                      setDialogStatus(null)
                    }
                    Dialog.confirm({
                      title: '提示',
                      content: `此二段订单存在未完成税的包裹， 是否继续子母件拆单？`,
                      cancelText: '不拆单',
                      okText: '继续拆单',
                      onOk: onClose,
                      onClose: onClose,
                      onCancel: useRefresh,
                    })
                  }

                  return data
                }).catch(getAbnormalExit)
                // 缓存数据
                setBaseData(res || {})
                // 初始化配置信息
                InitConfig(res || {})
                // 录制视频 ，只有core设备才会开启
                _startRecord({...(res || {}), cartCode: getCartCode()})
                // 加载包裹信息
                if (res && Array.isArray(res.voList)) {
                  ondeliveryCodeScan(
                    value,
                    res.voList,
                    // 合箱白名单 是否为单个批量扫描
                    res.scanSinglePackageMerge && res.isWhiteList,
                    res
                  )
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
    async function ondeliveryCodeScan (value, data = tableData, isAutoScan, packData) {
      if (isAutoScan) { // 是否开启批量自动扫描
        data.forEach(d => {
          getMark(d)
          // 打水印
          getVideoMakeTap(d.deliveryCode)
        })
        Message.success(<div style={{display: 'flex', justifyContent: 'center',flexDirection: 'column'}}>
        <div>校验成功</div>
        {packData && packData.giftService && `赠品：${packData.giftService}`}
      </div>)
      } else { 
        if (baseData.mergeSplitLimitWeight) {
          const currentPackage = data.find(d => isSame(d.deliveryCode, value) && !d.isActive)
          if (currentPackage && getMergeWeightTotal() + currentPackage.weight > baseData.mergeSplitLimitWeight) {
            getBlur('searchCode')
            setDialogStatus('open')
            const onClose = () => {
              getFocus('searchCode')
              setDialogStatus(null)
              Message.clear()
            }
            await Dialog.confirm({
              title: '提示',
              content: `此订单为小小合单，扫描包裹将超过限制重量${baseData.mergeSplitLimitWeight}KG， 是否继续扫描？`,
              cancelText: '放弃扫描',
              okText: '继续扫描',
              onOk: onClose,
              onClose: onClose,
              onCancel: onClose
            })
          }
        }
        // 单个扫描
        setScanData(data, value, packData)
        // 打水印
        getVideoMakeTap(value)
      }
      loadTableData([
          ...data
      ])
    }
// 箱号扫描
    function onBoxCodeScan() {
      setTimeout(getAutoSubmit, 50)
    }
// 包材编号
    function onPackingMaterialCodeScan() {
      setTimeout(getAutoSubmit, 50)
    }
// 重量扫描
    function onWeightScan() {
      setTimeout(getAutoSubmit, 50)
    }
// 体积扫描
    function onVolumeScan(event) {
      const tagCode = (getTagCode() || "").toLowerCase()
      const value = (event.target.value || '').toLowerCase()
      // 若扫描的单 == 小票单号 ，则触发拉取体积
      if (tagCode === value) {
        getPackagesVolumes(getTagCode())
        event.target.value = ''; // 清空小票单号
      } else {
        setTimeout(getAutoSubmit, 50)
      }
    }
// 提交前检验必填参数
    function checkPackage(flag) {
      const isMsg = flag !== 'nomsg'
      log('开始校验参数')
      if (getDialogStatus()) return
      // 需要箱号的的时候 ，校验箱号
      log('校验箱号')
      if (!checkBoxCode(isMsg)) return false
      // 是否需要包材， 包材校验
      log('校验包材')
      if (!checkPackingMaterialCode(isMsg)) return false
      log('校验预估拆单数')
      if (!checkSplitCount(isMsg)) return false
      // 需要称重的时候 ，校验重量
      log('校验重量')
      if (!checkWeight(isMsg)) return false
      // 有赠品的时候 ，校验赠品
      log('校验赠品')
      if (!checkGift()) return false
      // 有体积时， 校验体积
      if (!checkVolume(isMsg)) return false
      return true
    }
// 校验是否完成扫描
    function checkPackageIsComplate() {
      log(`校验tableData`)
      log(tableData)
      if (isEmpty(tableData) || !tableData.every(t => t.isActive)) return false
      return true
    }
// 已校验，但未完完成所有校验
    function checkPackageIsActive() {
      return !isEmpty(tableData) && tableData.some(t => t.isActive && !t.disabled)
    }
// 校验箱号
    function checkBoxCode(isMsg) {
      // 需要箱号的的时候 ，校验箱号
      const boxCode = getValue('boxCode')
      if (isNeedBox && isEmpty(boxCode)) {
        getFocus('boxCode')
        log('请输入箱号')
        isMsg && Message.error('请输入箱号')
        return false
      }
      return true
    }
// 校验包材
    function checkPackingMaterialCode(isMsg) {
      // 是否需要包材， 包材校验
      if (needScanPackingMaterial && isEmpty(getValue('packingMaterialCode'))) {
        getFocus('packingMaterialCode')
        log('请输入包材')
        isMsg && Message.error('请输入包材')
        return false
      }
      return true
    }  
// 校验重量
    function checkWeight(isMsg) {
      // 需要称重的时候 ，校验重量
      const weight = getValue('weight')
      if (!isWeigh) return true
      if (isEmpty(weight) || !(weightRegExp.test(weight) && Number(weight) < 1000)) {
        getFocus('weight')
        log('包裹重量有误，请检查重量')
        isMsg && Message.error('包裹重量有误，请检查重量')
        return false
      } else if ((+weight * 1000 < 5)) {
        getBlur('searchCode')
        setDialogStatus('open')
        const onClose = () => {
          getFocus('searchCode')
          setDialogStatus(null)
        }
        Dialog.confirm({
          title: '警告',
          content: `包裹重量为：${weight}kg, 当前包裹小于0.005kg, 是否确认合箱？`,
          onOk: async() => {submit()},
          onClose: onClose,
          onCancel: onClose,
        })
        return false
      }
      return true
    }
// 预估数校验
    function checkSplitCount(isMsg) {
      const count = getValue('splitCount')
      if (isEmpty(count) || !/^\d*$/.test(count)) {
        getFocus('splitCount')
        log('输入预估数')
        isMsg && Message.error('预估拆单数输入有误，请检查')
        return false
      }
      // else if (!getPackType(baseData).bs && count < 2) {
      //   getFocus('splitCount')
      //   log('预估数不能小于2')
      //   Message.error('预估拆单数最小值不能小于2')
      //   return false
      // }
      return true
    }
// 校验赠品
  function checkGift() {
    if (baseData.giftService && !isScanGiftService) {
      getFocus('searchCode')
      log('包裹包含赠品，请扫描赠品')
      Message.error('包裹包含赠品，请扫描赠品')
      return false
    }
    return true
  }
// 校验体积
  function checkVolume(isMsg) {
    if (!isVolumeVerify) return true
    const length = getValue('boxLength')
    const width = getValue('boxWidth')
    const height = getValue('boxHeight')
    const checkValue = value => isEmpty(value) || !weightRegExp.test(value)
    if (checkValue(length)) {
      getFocus('boxLength')
      log('体积：长度有误，请检查长度')
      isMsg && Message.error('体积：长度有误，请检查长度')
      return false
    } else if (checkValue(width)) {
      getFocus('boxWidth')
      log('体积：宽度有误，请检查宽度')
      isMsg && Message.error('体积：宽度有误，请检查宽度')
      return false
    } else if (checkValue(height)) {
      getFocus('boxHeight')
      log('体积：高度有误，请检查高度')
      isMsg && Message.error('体积：高度有误，请检查高度')
      return false
    }
    return true
  }
// 天机设备获取体积
  function getPackagesVolumes(value) {
    // 天机设备获取体积重量
    POWWT.getVolumeAndWeight(value, function(data) {
      if (data) {
        Object.entries(VolumsConf).forEach(([key, realKey]) => {
          setValue(realKey, data[key])
        })
      }
    }, Message)
  }
// 设置小票单号并异步打印小票单
  function setTagCodeAndPrint(tagCode) {
    // 保存小票号
    setTagCode(tagCode)
    // 打印小票
    setTimeout(() => {
      getVolumeTagPrint(tagCode).then(res => {
        PrintLabel(res).catch((err) => {
          Message.error('小票打印失败,请检查打印组件')
        })
      }).catch(e => {
        e.message != '内部错误' && Message.error(`小票获取失败：${e.message}`)
      })
    }, 500)
  }
// 自动提交
    function getAutoSubmit() {
      // 完成扫描，走合箱打单提交
      const isBigPackage = getPackType(baseData).bb
      if (isBigPackage) {
        setValue('splitCount', baseData.subOrderQuantity)
      }
      if (checkPackageIsComplate()) {
        checkPackage('nomsg') && getMergeSubmit()
      } else if (
        // 全部为大件时，自动拆单
        isBigPackage
      ) {
        checkPackage('nomsg') && setSplitCode()
      }
    }
// 提交
    async function submit () {
      if (checkPackageIsComplate()) {
        // 完成扫描走合箱操作
        checkPackage() && getMergeSubmit()
      } else if (checkPackageIsActive()) {
        // 未完成扫描，走拆单逻辑
        checkPackage() && setSplitCode()
      } else {
        getFocus('searchCode')
      }
    }
// 合箱称重异常校验
    function _mergeCheckWeight(data) {
      setDialogStatus('open')
      Dialog.confirm({
        title: data.failureMessage,
        content: <div>
          <p>实际称量重量：<b style={{fontWeight: 'bold'}} className="warn-color">{data.actualWeight}kg</b></p>
          <p>系统记录重量：<b style={{fontWeight: 'bold'}} className="warn-color">{data.theoreticalTotalWeight}kg</b></p>
          <p>重量差异：<b style={{fontWeight: 'bold', color: 'red'}}>{data.weightDeviation}kg</b></p>
        </div>,
        okText: data.menuFlag ? '确认提交' : false,
        onOk: () => {
          getMergeSubmit({weighVerifyFlag: true})
          setDialogStatus(null)
        },
        onCancel: () => {useRefresh()},
        onClose: () => {setDialogStatus(null)}
      })
    }
// 少票
    async function setLessCode() {
      Message.info('正在提交数据...')
      try {
        const deliveryCodes = getDeliveryCode(tableData)
        await getLessCode({
          searchCode: getCartCode().trim(),
          deliveryCodeList: deliveryCodes.pass,
          missingDeliveryCodeList: deliveryCodes.miss,
          deliveryCodeTimeList: deliveryCodes.time
        })
        Message.success('操作成功')
        useRefresh()
      } catch(e) {
        console.log(e)
        Message.error('操作失败')
      }
    }
// 合箱
    async function getMergeSubmit ({dataList = tableData, weighVerifyFlag} = {}) {
      const deliveryCodes = getDeliveryCode(dataList)
      // 天猫子母件小小合箱，超重拦截
      if(baseData.mergeSplitLimitWeight && deliveryCodes.pass.length > 1) {
        if (baseData.mergeSplitLimitWeight < getMergeWeightTotal()) {
          await Dialog.confirm({
            title: '提示',
            content: `此订单为小小合单，超过${baseData.mergeSplitLimitWeight}KG， 是否继续合箱？`,
            cancelText: '不合箱',
            okText: '继续合箱',
            onClose: useRefresh,
            onCancel: useRefresh,
          })
        }
      }
      // 开始合箱
      
      log('完成校验，正在提交====')
      try{
        setBtnLoading(true)
        Message.info('正在提交数据...')
        const res = await getSubmit({
          searchCode: getCartCode().trim(),
          deliveryCodeList: deliveryCodes.pass,
          weight: isWeigh ? getValue('weight') : '',
          jobPlaceCode: Cookie.get('jobPlaceCode'),
          boxCode: getValue('boxCode'),
          packingMaterialCode: getValue('packingMaterialCode'),
          deliveryCodeTimeList: deliveryCodes.time,
          weighVerifyFlag: !weighVerifyFlag,
          separteType: splitType[0],
          boxLength: isVolumeVerify ? getValue('boxLength') : undefined,
          boxWidth: isVolumeVerify ? getValue('boxWidth') : undefined,
          boxHeight: isVolumeVerify ? getValue('boxHeight') : undefined,
          // 大小件拆单时， 预估拆单数需要 加上 大包数
          subOrderQuantity: getPackType(baseData).bs ? +getValue('splitCount') + baseData.bigPackageQty : getValue('splitCount')
        })
        
        if (splitCodeCount) {
          setSplitCodeCount(splitCodeCount + 1)
        }
        if (res && res.data) {
          Message.success('合箱成功，正在打印...', 0)
          PrintLabel(res).then((res) => {
            Message.success('合箱打印成功', 2)
            useRefresh()
          }).catch((err) => {
            Message.error('打印失败,请检查打印组件')
          })
        } else {
          Message.success('合箱成功', 0)
          setTimeout(() => {
            useRefresh()
          }, 1000)
        }

      } catch(e) {
        // 合箱出面单失败
        // 判断是否为 4px-pcs 合箱逻辑 
        const isCheckBill = checkBillIsFail(e)
        const isCheckVolumeMerge = checkVolumeMergeCode(e)
        if (
          isCheckBill ||
          isCheckVolumeMerge
        ) {
          const msgConfig = {
            [isCheckVolumeMerge]: null,
            [isCheckBill]: <div className='warn-color'>面单生成失败，稍后请在换面单界面使用小票单号进行重试，重打面单</div>
          }
          Message.success(<div>
            <div>合箱成功</div>
            {msgConfig[true]}
          </div>, 2);
          useRefresh()
        } else {
          Message.error(e.message)
          // 合箱重量异常 校验
          if (e.errCode === 'error_weight_verify_001') {
            _mergeCheckWeight(e.data)
          }
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
      const deliveryCodes = getDeliveryCode(tableData)
      // 天猫子母件小小合箱，超重拦截
      if(baseData.mergeSplitLimitWeight && deliveryCodes.pass.length > 1) {
        if (baseData.mergeSplitLimitWeight < getMergeWeightTotal()) {
          await Dialog.confirm({
            title: '提示',
            content: `此订单超过${baseData.mergeSplitLimitWeight}KG， 是否继续拆单？`,
            cancelText: '不拆单',
            okText: '继续拆单',
            onClose: useRefresh,
            onCancel: useRefresh,
          })
        }
      }
      // 开始拆单
      const currentSplitTimes = splitCodeCount + 1
      if (currentSplitTimes > (getValue('splitCount') || 0)) {
        return Message.error('拆单失败，拆单次数已达上限，请检查预估拆单数')
      }
      try {
        if (isEmpty(deliveryCodes.pass)) return
        setBtnLoading(true)
        Message.info('正在提交拆单...')
        const res = await getSplitCode({
          searchCode: getCartCode().trim(),
          deliveryCodeList: deliveryCodes.pass,
          weight: isWeigh ? getValue('weight') : '',
          jobPlaceCode: Cookie.get('jobPlaceCode'),
          boxCode: getValue('boxCode'),
          packingMaterialCode: getValue('packingMaterialCode'),
          deliveryCodeTimeList: deliveryCodes.time,
          separteType: splitType[0],
          boxLength: isVolumeVerify ? getValue('boxLength') : undefined,
          boxWidth: isVolumeVerify ? getValue('boxWidth') : undefined,
          boxHeight: isVolumeVerify ? getValue('boxHeight') : undefined,
          // 大小件拆单时， 预估拆单数需要 加上 大包数
          subOrderQuantity: getPackType(baseData).bs ? +getValue('splitCount') + baseData.bigPackageQty : getValue('splitCount')
        })
        
        
        // 更新拆单数
        setSplitCodeCount(currentSplitTimes)
        const newTableData = [...tableData]
        // 更新拆单状态
        deliveryCodes.pass.forEach(v => {
          setDisabled(newTableData, v)
        })
        setTableData(newTableData)
        // 清空累加重量
        setMergeWeightTotal(0)
        getFocus('searchCode')

        // 小票单号置空，下次扫描重新生成小票单号
        setTagCode(null)
        if (res && res.data) {
          Message.success('拆单成功，正在打印...', 0)
          PrintLabel(res).then((r) => {
            Message.success('拆单打印成功', 0)
          }).catch((e) => {
            Message.error('打印失败,请检查打印组件')
          })
        } else {
          Message.success('拆单成功', 0)
        }

      } catch(e) {
        Message.error(e.message)
      } finally {
        setBtnLoading(false)
      }
    }
// 换单
    async function getChangeCode() {
      const searchCode = (getValue('changeCode') || '').trim()
      const predictSeparateNum = getValue('splitCount')
      if (isEmpty(searchCode)) {
        getFocus('changeCode')
        return Message.error('换单单号输入有误')
      }
      if (!checkSplitCount()) return false
      try {
        const res = await getChangeCodeLabel({searchCode, predictSeparateNum})
        setValue('changeCode', '')
        getFocus('changeCode')
        
        if (res && res.data) {
          Message.success('正在打印...', 0)
          PrintLabel(res).then((r) => {
            Message.success('换单成功', 0)
          }).catch((e) => {
            Message.error('打印失败,请检查打印组件')
          })
        } else {
          Message.success('换单成功', 0)
        }

      } catch(e) {
        getSelect('changeCode')
        Message.error(e.message)
      }
    }
    return <div className="mergeOrder">
        <Card audioType={1}>
        <div slot="content">
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input ref={refs['searchCode']} placeholder="扫描/输入拆单单号" style={{ flex: 1 }} onEnter={onSearch} label="框号/包裹号"></Input>
                <Button onClick={onSearch}>提交</Button>
            </div>
            <Table columns={columns} data={tableData} rowClass={setRowClass} mt="10" mb="10" maxHeight={'calc(100vh - 380px)'}></Table>

            <Input label="装箱箱号" mb="10" show={isNeedBox} ref={refs['boxCode']}
            onEnter={onBoxCodeScan}></Input>
            <Input label="包材编号" show={needScanPackingMaterial}
            mb="10" ref={refs['packingMaterialCode']} onEnter={onPackingMaterialCodeScan}></Input>
            <Input type="number" label="包裹重量(KG)" mb='10' show={isWeigh} ref={refs['weight']} onEnter={onWeightScan}></Input>
            <Row>
              {isVolumeVerify && <div style={{width: 140, background: '#d9d9d9', padding: "12px 0 12px 8px",marginBottom: 10}}>合箱体积</div>}
              <Input type="number" label="长(CM)" style={{flex: 1}} show={isVolumeVerify} width="80px"  mb='10' ref={refs['boxLength']} onEnter={onVolumeScan}></Input>
              <Input type="number" label="宽(CM)" style={{flex: 1}} show={isVolumeVerify} width="80px"  mb='10' ref={refs['boxWidth']} onEnter={onVolumeScan}></Input>
              <Input type="number" label="高(CM)" style={{flex: 1}} show={isVolumeVerify} width="80px"  mb='10' ref={refs['boxHeight']} onEnter={onVolumeScan}></Input>
            </Row>


            <Input label="预估拆单数" mb='10' ref={refs['splitCount']}></Input>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <Input ref={refs['changeCode']} style={{ flex: 1 }} placeholder="扫描/输入换单单号" onEnter={getChangeCode} label="面单号/包裹号"></Input>
                <Button onClick={getChangeCode}>换面单</Button>
            </div>
        </div>
        <div slot="btnTools" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <div className="btnbox">
                <Button disabled={isEmpty(getDeliveryCode(tableData).scanned)} onClick={setLessCode}>少票</Button>
                {goBackFrom && <Button onClick={() => {
                  window.Router.push(goBackFrom)
                }}>返回合箱打单</Button>}
            </div>
            <div>
                <RadioGroup value={splitType} dataSource={splitCodeReasonOptions} onChange={(d) => setSplitType(d)}></RadioGroup>
                <Button scan={tableData} onClick={submit} disabled={btnLoading}>拆单</Button>
            </div>
        </div>
        <div slot="info">
            <div style={{ background: "#d7d7d7", color: '#333', fontSize: '25px', padding: '10px', lineHeight: '50px',fontWeight: 'bold' }}>
                <div>包裹总数：
                  {getPackType(baseData).all ? <span>
                    {baseData.totalPackageQty}
                    （
                      {baseData.bigPackageQty ? `大件：${baseData.bigPackageQty}` : ''}
                      {baseData.smallPackageQty ? `，小件： ${baseData.smallPackageQty}` : ''}
                    ）
                  </span> : tableData.length}
                </div>
                <div>已校验数：{tableData.filter(t => t.isActive).length} / {tableData.length}</div>
                <div>拆单操作：{splitCodeCount} / {getValue('splitCount') || 0}</div>
                {baseData.giftService && <div>赠品：<span className={isScanGiftService ? 'success-color': 'error-color'}>{baseData.giftService}</span></div>}
                <div>目的地：{baseData.countryCode}</div>
                {baseData.mergeSplitLimitWeight && <div>累计重量：{Number(getMergeWeightTotal() || 0).toFixed(3)}KG</div>}
            </div>
        </div>  
        </Card>
    </div>
}
