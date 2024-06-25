import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, Table, Dialog, KeyBoard, Card, WidgetWall, RadioGroup, CheckBox, Row, AutoSubmit } from '@/component'
import SkuCheckBox from './component/skuCheck'
import { localStore, Cookie, isType, onEnter, codeRegExp, weightRegExp } from 'assets/js/utils'
import { isTrue, isEmpty, _getName, isSame, pageRefreshName } from 'assets/js'
import Bus from 'assets/js/bus'
import {
  isCOE,
  _getExceptionDesc,
  setRowClass,
  lastPkgCountKey,
  getMark,
  POWWT,
  PrintLabel,
  _startRecord,
  _stopRecord,
  getVideoMakeTap,
  getDeliveryCode,
  splitCodeReasonOptions,
  setDisabled,
  checkBillIsFail,
  checkVolumeMergeCode,
  setUnpackingStatus,
  checkJobCode
} from '@/views/mergeOrder/config'
import {
  getMorePackage,
  getConfirmCancel, getNotifyServer, getLessCode, getSplitCode,
  getVolumeTagPrint
} from '@/views/mergeOrder/api'

import { getSearch, getSubmit, getCheckPassWordConfirm } from './api'
import { columns, setPackageStatus } from './config'


const {useReset, useInput, useRefresh, useAction} = React
const Message = Card.message
// 生成页面、
App.title = '复核合箱';
// 记录系统初始运行时间
const SysStartTime = Date.now();
// 定时器
let timer = null;
const autoKey = 'checkMergeAuto';
const VolumsConf = {
  width: 'boxWidth',
  height: 'boxHeight',
  length: 'boxLength'
}
let onWeightAutoSubmit = () => {};
export default function App(props) {
    const [tableData, setTableData] = useState([])
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur} = useInput([
      'searchCode', 'weight', 'splitCount', 'boxCode', 'packingMaterialCode', ...Object.values(VolumsConf),
      'skuSearchCode'
    ])
    const [getScanStatus, setScanStatus] = useAction('checkMergeScanFlag')
    const [getCartCode, setCartCode] = useAction('checkMergeCode') // 合箱框号
    const [getTagCode, setTagCode] = useAction('checkMergeTagCode') // 合箱小票单号
    const [getDialogStatus, setDialogStatus] = useAction('checkMergeDialogFlag')
    // 获取操作人工号
    const [getOperatorCode, setOperatorCode] = useAction('checkUppackagingOperatorCode');
    const [baseData, setBaseData] = useState({}) // 基本信息
    const [getBaseBata, setBaseDataCache] = useAction() // 缓存基本信息
    const [isScanGiftService, setIsScanGiftService] = useState(false) // 是否扫描赠品
    // 是否为大小件拆单包裹
    const [isBigSmallSplitPack, setIsBigSmallSplitPack] = useState(false)
    // 拆单
    const [splitCodeCount, setSplitCodeCount] = useState(0)
    // 输入框显示逻辑
    const isNeedBox = baseData.isNeedBox === true // 是否需要箱号
    const isWeigh = baseData.isWeigh !== false // 是否需要称重
    const needScanPackingMaterial = !!(!baseData.singleParcel ? baseData.needScanPackingMaterial : baseData.singleParcelNeedScanPackingMaterial)// 是否需要包材
    const isVolumeVerify = baseData.isVolumeVerify == '1' // 是否需要测量体积
    const isPartCheckFlag = baseData.partCheckFlag == true // 是否需要部分复核
    // 是否需要拆单
    const isAllowSubSeparate = baseData.allowSubSeparate
    // 是否需要打小票
    const isPrinTicket  = baseData.isPrinTicket

    // 合箱重量累加值
    const [getMergeWeightTotal, setMergeWeightTotal] = useAction('checkMergeWeightTotal');

    // 是否需要拆包去泡
    const isUnpackgeing = (d = baseData) => d.isMergeRepack === true;

    // SKU 复核
    const skuRef = useRef()
    const [getIsCheckComplete, setIsCheckComplete] = useAction(null, 0)
    setBaseDataCache(baseData)


    onWeightAutoSubmit = getAutoSubmit
// 初始化数据
    useEffect(() => {
      getFocus('searchCode')
      // setIsCheckComplete(0)
      // 检查是否启用视频录制 并校验桌号
      checkJobCode(onSearch)
      // Bus.setState({[pageRefreshName]: function(){
      //   Message.clear()
      //   useRefresh()
      // }})
      return () => {
        Bus.clearState(pageRefreshName);
        setScanStatus(null);
        setCartCode(null);
        setDialogStatus(null);
        setMergeWeightTotal(0);
        setOperatorCode(null);
        _stopRecord({...getBaseBata(), cartCode: getCartCode()});
      }
    }, [])
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
          onCompleted: val => {
            log(`重量稳定： ${val}`)
            if (!isAutoSubmit()) return
            log(`触发自动提交==`)
            onWeightAutoSubmit()
          }
        })
      }
    }
// 判断是否自动提交
    function isAutoSubmit() {
      const isAuto = AutoSubmit.status()
      log(`检查自动提交状态： ${isAuto}`)
      if (isEmpty(isAuto)) return false
      return true
    }
// 重置页面
    useReset(() => {
      // // 定时刷新系统，防止使用太久导致第三方包socket 断开连接，无法合箱
      // const sysRunTime = (Date.now() - SysStartTime) / (1 * 60 * 60 * 1000);
      // // 定时刷新系统， 每两小时刷新一次
      // if (sysRunTime > 2) {
      //   // 系统刷新
      //   window.location.reload()
      // } else {
        // 代码刷新
        getFocus('searchCode')
        _stopRecord({...getBaseBata(), cartCode: getCartCode()})
        setTableData([])
        setScanStatus(null)
        setCartCode(null)
        setTagCode(null)
        setBaseData({})
        setDialogStatus(null)
        setIsScanGiftService(false)
        setMergeWeightTotal(0)
      // }
    }, [])
// 扫描校验数据
    const setScanData = (data, value, packData) => {
        const isNeedVolume = isVolumeVerify || (packData && packData.isVolumeVerify == 1);
        const isNeedPrintTag = isPrinTicket || (packData && packData.isPrinTicket);
        const isNeedPartCheckFlag = isPartCheckFlag || (packData && packData.partCheckFlag);
        if (!data.some(d => {
            if (isSame(d.deliveryCode, value)) {
              if (d.isActive == 1) {
                // Message.error(`该包裹:${value}已经扫描过了`)
                if (isNeedPartCheckFlag && d.notCheckFlag != true && d.hasChecked != true ) {
                  Message.success('已校验，该包裹需要拆包复核')
                } else {
                  Message.success('已校验')
                }
                
                // 触发小票测体积检测
                if (isNeedVolume && value == getTagCode()) {
                  onVolumeScan({target: {value}})
                }
                // 复核SKU
                if (d.notCheckFlag != true) {
                  openSkuCheck(d, data)
                }
              } else {
                getMark(d)
                // 累加重量
                setMergeWeightTotal(getMergeWeightTotal() + d.weight)
                // PC 视频录制
                getNotifyServer(value, Message)
                Message.success(<div style={{display: 'flex', justifyContent: 'center',flexDirection: 'column'}}>
                  <div>校验成功</div>
                  {packData && packData.giftService && `赠品：${packData.giftService}`}
                  {isNeedPartCheckFlag && d.notCheckFlag != true && d.hasChecked !=true && '该包裹需要拆包复核'}
                </div>, )
                // 天猫海外美加业务保存小票单号，用于测量体积
                if ((isNeedPrintTag || isNeedVolume) && !getTagCode()) {
                  setTagCodeAndPrint(value)
                }
                if (!d.hasChecked && !isNeedPartCheckFlag) {
                  openSkuCheck(d, data)
                }
                if (isNeedPartCheckFlag && d.notCheckFlag != true && !d.hasChecked) {
                  setTimeout(() => POWWT.speakText('请复核'), 500)
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
                autoKey,
                title: '警告!',
                content: msg,
                onCancel: onClose,
                onClose: onClose,
                onOk: onClose,
              })
            }).catch(e => {
              Message.error(e.message)
            })
        }
    }

// 包裹框号扫描
    async function onSearch(){
      Message.clear()
      try {
        // 校验桌号
        await checkJobCode(onSearch)
        if (getValue('searchCode')) {
          // 判断扫描状态， 是否是第一次扫描，第一次扫描为框号扫描，拉取包裹列表
          if (!getScanStatus()) {
            // 第一次扫描保存扫描状态和框号
            setScanStatus(true)
            // 保存框号
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

                  // 香港子母件拆单包裹拦截
                  if(data.isAddNum || data.isAutoSeparate) {
                    setIsBigSmallSplitPack(true)
                    Dialog.confirm({
                      title: '提示',
                      content: '该包裹为子母件包裹，是否使用子母件拆单？',
                      onOk: async() => {
                        window.Router.push(`/childMotherSplitOder`, {
                          from: location.pathname,
                          code: value
                        })
                      }
                    })
                    throw new Error('子母件包裹，请使用子母件拆单操作')
                  } else if (isBigSmallSplitPack) {
                    setIsBigSmallSplitPack(false)
                  }
                  // 校验包裹列表
                  if(data && Array.isArray(data.voList)) {

                    //【天猫】 判断是否需要拆包去泡
                    if (isUnpackgeing(data)) {
                      setUnpackingStatus(data.voList);
                    }
                    // 添加包裹加密
                    data.voList.forEach(v => {
                      // 添加包裹字段加密处理
                      v.deliveryCodeEncrypt = v.deliveryCode
                      if (data.isEncrypt) {
                        v.deliveryCodeEncrypt = v.deliveryCode.replace(/^.{6}(.+).{4}$/, ($1, $2) => {
                          return $1.replace($2, '***')
                        })
                        // ＊*✲❈❉✿❀❃❁
                      }
                      // 添加包裹状态
                      setPackageStatus(v)
                    })
                    console.log(data.voList, '===============更新包裹状态===============')
                    // 缓存已复核数
                    setIsCheckComplete(data.voList.filter(f => f.hasChecked).length);
                    // 处理异常
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
                      autoKey,
                      title: '提示',
                      content: `此二段订单存在未完成税的包裹， 是否继续合箱？`,
                      cancelText: '不合箱',
                      okText: '继续合箱',
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
      setTagCode(null)
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
        openSkuCheck(data.find(d => !d.hasChecked), data)
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
              autoKey,
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
      // setTimeout(onWeightAutoSubmit, 100)
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
      // 检查是否完成扫描, 未完成扫描无法提交
      log(`校验tableData: ${!isEmpty(tableData)}`)
      if (!checkPackageIsOver()) return false
      log('校验是否完成复核: ' + getIsCheckComplete())
      if (!checkSkuCode(isMsg)) return false
      // 需要箱号的的时候 ，校验箱号
      log('校验箱号')
      if (!checkBoxCode(isMsg)) return false
      // 是否需要包材， 包材校验
      log('校验包材')
      if (!checkPackingMaterialCode(isMsg)) return false
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
// 校验SKU复核
    function checkSkuCode(isMsg) {
      console.log(getIsCheckComplete(), tableData.length, '---------复核数--------')
      if (getIsCheckComplete() < tableData.length) {
        getFocus('searchCode')
        log('请先完成SKU复核')
        if (isMsg) {
          Message.error('请扫描继续包裹完成SKU复核')
        }
        return false
      }
      return true
    }
// 校验包裹是否扫描完成
    function checkPackageIsOver(packageList = tableData) {
      return !isEmpty(packageList) && packageList.every(t => t.isActive)
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
        console.log(weight, isEmpty(weight), !weightRegExp.test(weight), '99999')
        getFocus('weight')
        log('合箱重量有误，请检查重量')
        isMsg && Message.error('合箱重量有误，请检查重量')
        return false
      } else if ((+weight * 1000 < 5)) {
        getBlur('searchCode')
        setDialogStatus('open')
        const onClose = () => {
          getFocus('searchCode')
          setDialogStatus(null)
        }
        Dialog.confirm({
          autoKey,
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
          if (isAutoSubmit()) {
            onWeightAutoSubmit()
          }
        }
      }, Message)
    }
// 设置小票单号并异步打印小票单
    function setTagCodeAndPrint(tagCode) {
      // 保存小票号
      setTagCode(tagCode)
      // 打印小票
      // setTimeout(() => {
        getVolumeTagPrint(tagCode).then(res => {
          PrintLabel(res).catch((err) => {
            Message.error('小票打印失败,请检查打印组件')
          })
        }).catch(e => {
          e.message != '内部错误' && Message.error(`小票获取失败：${e.message}`)
        })
      // }, 500)
    }
// 自动提交
    function getAutoSubmit() {
      checkPackage('nomsg') && submit()
    }
// 提交合箱
    async function submit ({dataList = tableData, weighVerifyFlag} = {}) {
      // 拆包去泡
      let repackOperator = getOperatorCode() || undefined;
      if (isUnpackgeing() && isEmpty(repackOperator)) {
        repackOperator =  await getUpPackagingCode();
        if (isEmpty(repackOperator)) return;
      }
      
      const deliveryCodes = getDeliveryCode(dataList)
      // 天猫子母件小小合箱，超重拦截
        if(baseData.mergeSplitLimitWeight && deliveryCodes.pass.length > 1) {
          if (baseData.mergeSplitLimitWeight < getMergeWeightTotal()) {
            await Dialog.confirm({
              title: '提示',
              content: `此订单为小小合单，超过${baseData.mergeSplitLimitWeight}KG，建议进行子母件拆单， 是否继续合箱？`,
              autoKey,
              cancelText: '不合箱',
              okText: '继续合箱',
              onClose: useRefresh,
              onCancel: useRefresh,
            })
          }
        }
        // 开始合箱

        log('完成校验，正在提交====')
        setDialogStatus('lock')
        try{
          setBtnLoading(true)
          Message.info('正在提交数据...')
          const requestParams = {
            searchCode: getCartCode().trim(),
            deliveryCodeList: deliveryCodes.pass,
            weight: isWeigh ? getValue('weight') : '',
            jobPlaceCode: Cookie.get('jobPlaceCode'),
            boxCode: getValue('boxCode'),
            packingMaterialCode: getValue('packingMaterialCode'),
            deliveryCodeTimeList: deliveryCodes.time,
            weighVerifyFlag: !weighVerifyFlag,
            boxLength: isVolumeVerify ? getValue('boxLength') : undefined,
            boxWidth: isVolumeVerify ? getValue('boxWidth') : undefined,
            boxHeight: isVolumeVerify ? getValue('boxHeight') : undefined,
            repackOperator,
            partCheckFlag: baseData.partCheckFlag
          }
          log(requestParams)
          const res = await getSubmit(requestParams)
          if (splitCodeCount) {
            setSplitCodeCount(splitCodeCount + 1)
          }
          Cookie.set(lastPkgCountKey, deliveryCodes.pass.length, {hour: 30 * 24})
          if (res && res.data) {
            Message.success('合箱成功，正在打印...', 0)
            PrintLabel(res).then((res) => {
              Message.success('合箱打印成功', 2)
              useRefresh()
            }).catch((err) => {
              setDialogStatus(null)
              Message.error('打印失败,请检查打印组件')
            })
          } else {
            Message.success('合箱成功', 2)
            setTimeout(() => {
              useRefresh()
            }, 1000)
          }
        } catch(e) {
          setDialogStatus(null)
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
            _mergeCheckWeight({...(e.data || {}), errCode: e.errCode})
          }
          
        } finally {
          setBtnLoading(false)
          if (splitCodeCount) {
            setSplitCodeCount(0)
          }
        }
    }
// 合箱称重异常校验
    function _mergeCheckWeight(data, isSplit) {
      if (data.errCode !== 'error_weight_verify_001') return
      setDialogStatus('open');
      getBlur('searchCode');
      Dialog.confirm({
        autoKey,
        title: data.failureMessage,
        content: <div>
          <p>实际称量重量：<b style={{fontWeight: 'bold'}} className="warn-color">{data.actualWeight}kg</b></p>
          <p>系统记录重量：<b style={{fontWeight: 'bold'}} className="warn-color">{data.theoreticalTotalWeight}kg</b></p>
          <p>重量差异：<b style={{fontWeight: 'bold', color: 'red'}}>{data.weightDeviation}kg</b></p>
        </div>,
        okText: data.menuFlag ? '确认提交' : false,
        onOk: () => {
          if (isSplit) {
            splitCodeSubmit({separteType: data.separteType, weighVerifyFlag: true})
          } else {
            submit({weighVerifyFlag: true})
          }
          setDialogStatus(null)
        },
        onCancel: () => {
          !isSplit && useRefresh()
        },
        onClose: () => {setDialogStatus(null)}
      })
    }

// 拆单 合箱弹出拆包去泡 工号输入框
    async function getUpPackagingCode() {
      try {
        let codeRef = {}
        await Dialog.confirm({
          autoKey,
          title: '请确认包裹拆包去泡作业是否完成？',
          content: <div>
            <Input ref={ref => {
              ref.focus();
              codeRef = ref;
            }} placeholder="请输入操作人工号"></Input>
          </div>,
          okLoadingText: '正在提交...',
          onOk: async () => {
            if (isEmpty(codeRef.value)) {
              codeRef.focus();
              return '请输入操作人工号';
            }
            setOperatorCode(codeRef.value)
          }
        })
        return codeRef.value
      } catch(e) {
        return null;
      }
    }
// 少票
    async function setLessCode() {
      let passWordRef = {}
      await Dialog.confirm({
        autoKey,
        title: '请输入确认少票密码',
        content: <div>
          <Input style={{flex: 1}}
            ref={(ref) => {
              passWordRef = ref
              ref.focus();
            }}
          ></Input>
        </div>,
        okLoadingText: '正在提交...',
        onOk: async () => {
          if (isEmpty(passWordRef.value)) {
            passWordRef.focus();
            return '请输入确认密码'
          }
          try {
            await getCheckPassWordConfirm(passWordRef.value)
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
            Message.error(e.message || '操作失败')
          }
        }
      })

    }
// 拆单
    async function setSplitCode() {
      // 需要箱号的的时候 ，校验箱号
      if (!checkBoxCode(true)) return
      // 检验包材
      if (!checkPackingMaterialCode(true)) return
      // 校验重量
      if (!checkWeight(true)) return
      // 有赠品的时候 ，校验赠品
      log('校验赠品')
      if (!checkGift()) return false
      // 有体积时， 校验体积
      if (!checkVolume(true)) return false
      // COE 桌号检验
      if (isCOE && !Cookie.get('jobPlaceCode')) {
        Bus.$emit('setJobPlaceCode')
        return
      }
      let redioRef = {}
      Dialog.confirm({
        autoKey,
        title: '合箱拆单原因选择',
        content: <div>
          <RadioGroup ref={ref => redioRef = ref} value={['mergeOverWeightSeparte']} dataSource={splitCodeReasonOptions}></RadioGroup>
        </div>,
        okLoadingText: '正在提交...',
        onOk: async () => {
          if (isEmpty(redioRef.value)) {
            return '请选择拆单原因'
          }
          await splitCodeSubmit({separteType: redioRef.value[0]})
        }
      })

    }
// 提交拆单
    async function splitCodeSubmit ({separteType, weighVerifyFlag}) {
      // 拆包去泡
      let repackOperator = getOperatorCode() || undefined;
      if (isUnpackgeing() && isEmpty(repackOperator)) {
        repackOperator =  await getUpPackagingCode();
        if (isEmpty(repackOperator)) return;
      }

      const deliveryCodes = getDeliveryCode(tableData)
      // 天猫子母件小小合箱，超重拦截
      if(baseData.mergeSplitLimitWeight && deliveryCodes.pass.length > 1) {
        if (baseData.mergeSplitLimitWeight < getMergeWeightTotal()) {
          await Dialog.confirm({
            title: '提示',
            content: `此订单超过${baseData.mergeSplitLimitWeight}KG， 是否继续拆单？`,
            autoKey,
            cancelText: '不拆单',
            okText: '继续拆单',
            onClose: useRefresh,
            onCancel: useRefresh,
          })
        }
      }
      // 开始拆单
      try {
        const res = await getSplitCode({
          searchCode: getCartCode().trim(),
          deliveryCodeList: deliveryCodes.pass,
          weight: isWeigh ? getValue('weight') : '',
          jobPlaceCode: Cookie.get('jobPlaceCode'),
          boxCode: getValue('boxCode'),
          packingMaterialCode: getValue('packingMaterialCode'),
          deliveryCodeTimeList: deliveryCodes.time,
          separteType,
          weighVerifyFlag: !weighVerifyFlag,
          boxLength: isVolumeVerify ? getValue('boxLength') : undefined,
          boxWidth: isVolumeVerify ? getValue('boxWidth') : undefined,
          boxHeight: isVolumeVerify ? getValue('boxHeight') : undefined,
          repackOperator
        })
        
        setSplitCodeCount(splitCodeCount + 1)
        const newTableData = [...tableData]
        // 更新拆单状态
        deliveryCodes.pass.forEach(v => {
          setDisabled(newTableData, v)
        })
        setTableData(newTableData);
        getFocus('searchCode');
        // 清空累加重量
        setMergeWeightTotal(0);
        // 小票单号置空，下次扫描重新生成小票单号
        setTagCode(null);
        // 清空拆包去泡人工号
        setOperatorCode(null);
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
        // 判断是否为 4px-pcs 合箱逻辑 
        const isCheckBill = checkBillIsFail(e)
        const isCheckVolumeMerge = checkVolumeMergeCode(e)
        if (
          isCheckBill || 
          isCheckVolumeMerge
        ) {
          // 清空累加重量
          setMergeWeightTotal(0);
          // 清空拆包去泡人工号
          setOperatorCode(null);
          const msgConfig = {
            [isCheckVolumeMerge]: null,
            [isCheckBill]: <div className='warn-color'>面单生成失败，稍后请在换面单界面使用小票单号进行重试，重打面单</div>
          }
          Message.success(<div>
            <div>拆单成功</div>
            {msgConfig[true]}
          </div>, 2)
        } else {
          Message.error(e.message)
          // 重量异常 校验
          _mergeCheckWeight({
            ...(e.data || {}),
            separteType,
            errCode: e.errCode,
          }, true)
        }

      }
    }

    // 复核SKU
    function openSkuCheck(item, packageList) {
      if (!item) return
      if (checkPackageIsOver(packageList)) {
        skuRef.current.open(item)
        getBlur('searchCode')
      }
    }

    // 关闭SKU复核
    function onSkuClose(info) {
      if (info) {
        const newTableData = tableData.map(t => {
          if (isSame(t.deliveryCode, info.deliveryCode)) {
            return {
              ...info,
              exceptionType: info.hasChecked ? (!info.isPass ? '复核异常' : '已复核') : t.exceptionType,
            }
          }
          return t
        })
        setIsCheckComplete(newTableData.filter(t => t.hasChecked).length)
        setTableData([...newTableData])
      }
    }

    return <div className="mergeOrder">
        <Card audioType={1}>
        <div slot="content">
            <div style={{ display: 'flex' }}>
                <Input ref={refs['searchCode']} style={{ flex: 1 }} onEnter={onSearch} label="框号/包裹号"></Input>
                <Button onClick={onSearch}>提交</Button>
            </div>
            <Table columns={columns} data={tableData} rowClass={setRowClass} mt="10" maxHeight={'calc(100vh - 380px)'}></Table>
            <Row>
              <Input label="装箱箱号" style={{flex: 1}} width="80px" show={isNeedBox}
                mr={needScanPackingMaterial ? 5 : 0} mt="10" ref={refs['boxCode']}
                onEnter={onBoxCodeScan}></Input>
              <Input label="包材编号" style={{flex: 1}} width="80px" show={needScanPackingMaterial}
                mt="10" ref={refs['packingMaterialCode']}
                onEnter={onPackingMaterialCodeScan}></Input>
            </Row>
            <Row>
              <Input label="合箱重量(KG)" type="number"  style={{flex: 1}} mt='10' ref={refs['weight']} onEnter={onWeightScan}></Input>
            </Row>
            <Row>
              {isVolumeVerify && <div style={{width: 140, background: '#d9d9d9', padding: "12px 0 12px 8px",marginTop: 10}}>合箱体积</div>}
              <Input type="number" label="长(CM)" style={{flex: 1}} show={isVolumeVerify} width="80px"  mt='10' ref={refs['boxLength']} onEnter={onVolumeScan}></Input>
              <Input type="number" label="宽(CM)" style={{flex: 1}} show={isVolumeVerify} width="80px"  mt='10' ref={refs['boxWidth']} onEnter={onVolumeScan}></Input>
              <Input type="number" label="高(CM)" style={{flex: 1}} show={isVolumeVerify} width="80px"  mt='10' ref={refs['boxHeight']} onEnter={onVolumeScan}></Input>
            </Row>

           
        </div>
        <div slot="btnTools" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <div className="btnbox">
                <Button disabled={isEmpty(getDeliveryCode(tableData).scanned)} onClick={setLessCode}>少票</Button>
                {/* <Button disabled={isEmpty(getDeliveryCode(tableData).pass)} onClick={setSplitCode}>拆单</Button> */}
                {isBigSmallSplitPack && <Button onClick={() => {
                  window.Router.push('/childMotherSplitOder', {from: location.pathname})
                }}>子母件拆单</Button>}
            </div>
            <div>
                <AutoSubmit autoKey={autoKey}></AutoSubmit>
                <Button scan={tableData} onClick={() => {
                  checkPackage() && submit()
                }} disabled={btnLoading}>提交</Button>
            </div>
        </div>
        <div slot="info">
            <div style={{ background: "#d7d7d7", color: '#333', fontSize: '25px', padding: '10px', lineHeight: '50px',fontWeight: 'bold' }}>
                <div>包裹总数：{tableData.length}</div>
                <div>已校验数：{tableData.filter(t => t.isActive).length} / {tableData.length}</div>
                {splitCodeCount ? <div>拆单操作：{splitCodeCount}</div> : ''}
                {baseData.countryCode && <div>目的地：{baseData.countryCode}</div>}
                {baseData.deliveryType && <div>配送方式：{baseData.deliveryType}</div>}
                {baseData.giftService && <div>赠品：<span className={isScanGiftService ? 'success-color': 'error-color'}>{baseData.giftService}</span></div>}
                <div>上一单数量：{Cookie.get(lastPkgCountKey) || 0}</div>
                {/* {baseData.mergeSplitLimitWeight && <div>累计重量：{Number(getMergeWeightTotal() || 0).toFixed(3)}KG</div>} */}
                <div>累计重量：{Number(getMergeWeightTotal() || 0).toFixed(3)}KG</div>
                {isUnpackgeing() && <div className='error-color'>订单状态：需要拆包去泡</div>}
            </div>
        </div>  
        </Card>
        {/* 软PTL */}
        <WidgetWall></WidgetWall>
        <SkuCheckBox ref={skuRef} onClose={onSkuClose}></SkuCheckBox>
    </div>
}
