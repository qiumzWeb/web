import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, RadioGroup, Card, KeyBoard, CheckBox, Select, AutoSubmit } from '@/component'
import {onEnter, Cookie, weightRegExp} from 'assets/js/utils'
import { isTrue, isEmpty, _getName } from 'assets/js'
import {
  PrintLabel,
  isNeedType,
  packageTypeOptions,
  warehouseId,
  POWWT
} from './config'
import {getSubmit, getCheckDeliveryCode, getExceptionType} from './api'

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
const VolumsConf = ['weight', 'length', 'width', 'height']
// 生成页面、
App.title = '逆向入库'
const autoKey = 'reversalStorageAuto'
let onAutoSubmit = () => {}
export default function App(props) {
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur} = useInput([
      'packageType', 'deliveryCode', ...VolumsConf
    ])
    const [type, setType] = useState(['false'])
    const [getPackageTypeCode, setPackageTypeCode] = useAction('packageTypeCode')
    const [exceptionTypeOptions, setExceptionTypeOptions] = useState(packageTypeOptions)
    const [volumsInputs, setVolumsInputs] = useState(null)
    const [currentExceptionType, setCurrentExceptionType] = useState('')
    const VolumsRef = useRef()
    const [getIsNeedWeight, setIsNeedWeight] = useAction()
    // 是否超体积
    const isOverSize = (val) => (val || currentExceptionType) == '101';
    // 是否超重
    const isOverWeight = (val) => (val || currentExceptionType) == '102';
    // 需要重量必填校验 // 106 (禁运品) 107（破损件）108（其它）
    const isNeedWeightCheck = (val) => getIsNeedWeight() && !([107, 107, 108].some(s => (val || currentExceptionType) == s));

    // 自动提交
    onAutoSubmit = getAutoSubmit
// 初始化数据
    useEffect(() => {
      getFocus('packageType')
      checkJobCode()
      // 获取包裹类型
      getExceptionType(warehouseId).then(res => {
        if (Array.isArray(res) && !isEmpty(res)) {
          setExceptionTypeOptions(res)
          setIsNeedWeight(true)
          getFocus('deliveryCode')
        }
      })
      // 重量
      setVolumsInputs(VolumsRef && VolumsRef.current)
      POWWT.getWeight({
        onChange: val => setValue('weight', val),
        onCompleted: val => {
          log(`重量稳定： ${val}`)
          if (!isAutoSubmit()) return
          log(`触发自动提交==`)
          onAutoSubmit()
        }
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
    }
// 包裹类型扫描
    function onPackageTypeSelect(val) {
      Message.clear()
      setPackageTypeCode(val)
      setCurrentExceptionType(val)
      setValue('packageType', _getName(exceptionTypeOptions, val))
      getFocus('deliveryCode')
    }
// 包裹类型选择
    function onPackageTypeSearch() {
      const val = getValue('packageType')
      const label = _getName(exceptionTypeOptions, val)
      setValue('packageType', label)
      if (label) {
        if (getIsNeedWeight()) {
          getFocus('weight')
        } else {
          getFocus('deliveryCode')
        }
        
        setPackageTypeCode(val)
        setCurrentExceptionType(val)
        // 自动提交
        getAutoSubmit()
      } else {
        getFocus('packageType')
        setPackageTypeCode(null)
        setCurrentExceptionType('')
      }
      document.body.click()
    }
// 包裹号扫描
    function onSearch () {
      // Message.info('正在校验运单号...')
      const deliveryCode = getValue('deliveryCode')
      startVideoRecord(deliveryCode)
      getVolumeAndWeight(deliveryCode)
      getCheckDeliveryCode({
        code: deliveryCode,
        needCloudPrintData: type[0]
      }).then(data => {
        if (data.packageType) {
          setValue('packageType', data.packageType);
          onPackageTypeSearch()
        } else {
          getAutoSubmit()
        }
      }).catch(e => {
        getAutoSubmit()
        // Message.error(e.message)
      })
    }
// 重量扫描
    function onWeightScan() {
      setTimeout(getAutoSubmit, 50)
    }
// 天机称重
    function getVolumeAndWeight(value) {
      if (!isOverSize(getPackageTypeCode())) return;
      // 天机设备获取体积重量
      POWWT.getVolumeAndWeight(value, function(data) {
        if (data) {
          VolumsConf.forEach(key => {
            setValue(key, data[key])
          })
          if (isAutoSubmit()) {
            onAutoSubmit()
          }
        }
      }, Message)
    }

// 提交前检验必填参数
    function checkPackage(flag) {
      const isMsg = flag !== 'nomsg'
      log('开始校验参数')
      log('校验包裹类型')
      if (!checkPackageType(isMsg)) return false
      log('校验运单号')
      if (!checkSearchCode(isMsg)) return false
      log('校验重量')
      if(!checkWeight(isMsg)) return false
      log('校验体积')
      if(!checkVolume(isMsg)) return false
      return true
    }
// 校验包裹类型
    function checkPackageType(isMsg) {
      const packageType = getValue('packageType')
      const PackageTypeCode = getPackageTypeCode()
      if (isEmpty(packageType) || isEmpty(PackageTypeCode)) {
        setValue('packageType', '')
        setPackageTypeCode(null)
        getFocus('packageType')
        log('请选择包裹类型')
        isMsg && Message.error('请选择包裹类型')
        return false
      }
      return true
    }
// 校验运单号
    function checkSearchCode(isMsg) {
      const searchCode = getValue('deliveryCode')
      if (isEmpty(searchCode)) {
        getFocus('deliveryCode')
        log('请输入包裹面单号')
        isMsg && Message.error('请输入包裹运单号')
        return false
      }
      return true
    }
// 校验重量
    function checkWeight(isMsg) {
      if (!isNeedWeightCheck(getPackageTypeCode())) return true
      // 需要称重的时候 ，校验重量
      const weight = getValue('weight')
      if (isEmpty(weight) || !weightRegExp.test(weight)) {
        getFocus('weight')
        log('合箱重量有误，请检查重量')
        isMsg && Message.error('合箱重量有误，请检查重量')
        return false
      }
      return true
    }
// 校验体积
    function checkVolume(isMsg) {
      if (!isOverSize(getPackageTypeCode())) return true
      const length = getValue('length')
      const width = getValue('width')
      const height = getValue('height')
      const checkValue = value => isEmpty(value) || !weightRegExp.test(value)
      if (checkValue(length)) {
        getFocus('length')
        log('体积：长度有误，请检查长度')
        isMsg && Message.error('体积：长度有误，请检查长度')
        return false
      } else if (checkValue(width)) {
        getFocus('width')
        log('体积：宽度有误，请检查宽度')
        isMsg && Message.error('体积：宽度有误，请检查宽度')
        return false
      } else if (checkValue(height)) {
        getFocus('height')
        log('体积：高度有误，请检查高度')
        isMsg && Message.error('体积：高度有误，请检查高度')
        return false
      }
      return true
    }

// 判断是否自动提交
    function isAutoSubmit() {
      const isAuto = Cookie.get(autoKey)
      log(`检查自动提交状态： ${isAuto}`)
      if (isEmpty(isAuto)) return false
      return true
    }
// 自动提交
    function getAutoSubmit() {
      isAutoSubmit() && checkPackage('nomsg') && submit()
    }
// 提交
    async function submit () {
        log('完成校验，正在提交====')
        const packageTypeCode = getPackageTypeCode()
        const code = getValue('deliveryCode')
        const weight = getValue('weight')
        const length = getValue('length')
        const width = getValue('width')
        const height = getValue('height')
        const needCloudPrintData = type[0]
        console.log(packageTypeCode, code, needCloudPrintData, 77)
        const isNeedWeightAndVolume = isOverWeight(packageTypeCode) || isOverSize(packageTypeCode)
        try{
          setBtnLoading(true)
          Message.info('正在提交数据...')
          const res = await getSubmit({
            code,
            type: packageTypeCode,
            needCloudPrintData,
            weight: getIsNeedWeight() ? weight : undefined,
            length: isNeedWeightAndVolume ? length : undefined,
            width: isNeedWeightAndVolume ? width : undefined,
            height: isNeedWeightAndVolume ? height : undefined,
          })
          if (res && res.data) {
            Message.success('正在打印...')
            PrintLabel(res).then((res) => {
              Message.success(`打印成功, 面单号： ${code}`)
              reset()
            }).catch((err) => {
              finishVideoRecord()
              Message.error('打印失败,请检查打印组件')
            })
          } else {
            Message.success(<div>
              <div>操作成功</div>
              <div>包裹面单号：{code}</div>
              <div>{res.message}</div>
            </div>)
            reset()
          }
        } catch(e) {
          finishVideoRecord()
          Message.error(e.message)
        } finally {
          setBtnLoading(false)
        }
    }
    return <div className="reversal-storage">
        <Card>
        <div slot="content">
          <Select dataSource={exceptionTypeOptions} style={{width: '100%'}} onChange={onPackageTypeSelect}>
            <Input ref={refs['packageType']} onEnter={onPackageTypeSearch} label="包裹类型"></Input>
          </Select>
          <Input mt="10" ref={refs['deliveryCode']} onEnter={onSearch} label="包裹运单号"></Input>
          <Input ref={refs['weight']} show={!!getIsNeedWeight()} label="包裹重量(KG)" style={{flex: 1}} mt='10' onEnter={onWeightScan}></Input>
          <div style={{display: (isOverSize() || isOverWeight()) ? 'block': 'none'}}>
            <div style={{color: '#fff', margin: '10px 0'}}>包裹体积：</div>
            <KeyBoard
                inputContainer={volumsInputs}
            >
                <div className="inputbox" ref={VolumsRef}>
                    <Input label="长(CM)" width="80px" ref={refs['length']}></Input>
                    <Input label="宽(CM)" width="80px" ref={refs['width']}></Input>
                    <Input label="高(CM)" width="80px" ref={refs['height']}></Input>
                </div>
            </KeyBoard>
          </div>

          <div style={{color: "#fff"}}>
            是否需要一段面单：
            <RadioGroup mt="10" dataSource={isNeedType} value={type} onChange={(d) => {setType(d)}}></RadioGroup>
          </div>
        </div>
        <div slot="btnTools" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <div className="btnbox"></div>
            <div>
                <AutoSubmit autoKey={autoKey}></AutoSubmit>
                <Button onClick={() => {
                  checkPackage() && submit()
                }} disabled={btnLoading}>提交</Button>
            </div>
        </div>
        <div slot="info">
        <div className='warn-title'>已完成包裹</div>
        </div>  
        </Card>
    </div>
}
