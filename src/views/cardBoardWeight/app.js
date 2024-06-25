import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, Card, CheckBox, Dialog, AutoSubmit } from '@/component'
import {onEnter, Cookie, weightRegExp} from 'assets/js/utils'
import { isTrue, isEmpty, _getName } from 'assets/js'
import {
  POWWT,
  PrintLabel
} from './config'
import {getSubmit, getCheckDeliveryCode} from './api'

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
App.title = '卡板称重'
// 定时器
let timer = null
const autoKey = 'cardBoardWeightAuto'
let onWeightAutoSubmit = () => {}
export default function App(props) {
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur} = useInput(['weight', 'deliveryCode'])
    const [baseData, setBaseData] = useState({}) // 基本信息
    // 是否锁定自动提交，锁定时无法触发自动提交
    const [getAutoSubmitLock, setAutoSubmitLock] = useAction('cardBOardWeightAutoLocked');
    onWeightAutoSubmit = getAutoSubmit
// 初始化数据
    useEffect(() => {
      getFocus('deliveryCode')
      checkJobCode()
      setAutoSubmitLock(true)
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
      return () => {
        finishVideoRecord()
      }
    }, [])
    useEffect(() => {
      // 列表更新时触发自动提交
      getAutoSubmit()
    }, [baseData])
// 重置页面
    function reset() {
      setAutoSubmitLock(true)
      getFocus('deliveryCode')
      setValue('deliveryCode', '')
      setValue('weight', '')
      setBaseData({})
      finishVideoRecord()
    }
// 包裹号扫描
    function onSearch() {
      Message.info('正在校验卡板号...')
      const deliveryCode = getValue('deliveryCode').trim()
      startVideoRecord(deliveryCode)
      getCheckDeliveryCode({ deliveryCode }).then(data => {
        setBaseData(data || {})
        getFocus('weight')
        // getAutoSubmit()
        Message.success('校验成功')
        setAutoSubmitLock(false)
      }).catch(e => {
        Message.error(<div>
          <div>卡板号：{deliveryCode}</div>
          <div>{e.message}</div>
        </div>)
        setAutoSubmitLock(true)
        setValue('deliveryCode', '')
        getFocus('deliveryCode')
        
      })
    }
// 重量扫描
  function onWeightScan() {
    setTimeout(getAutoSubmit, 50)
  }
// 提交前检验必填参数
    function checkPackage(flag) {
      const isMsg = flag !== 'nomsg'
      log('开始校验参数')
      log('校验运单号')
      if (!checkSearchCode(isMsg)) return false
      log('校验包裹重量')
      if (!checkWeight(isMsg)) return false
      log('称重校验')
      if (!checkWeightException()) return false
      return true
    }
// 校验重量
    function checkWeight(isMsg) {
      // 需要称重的时候 ，校验重量
      const weight = getValue('weight')
      if (isEmpty(weight) || !weightRegExp.test(weight)) {
        getFocus('weight')
        log('卡板重量重量有误，请检查重量')
        isMsg && Message.error('卡板重量有误，请检查重量')
        return false
      }
      return true
    }
// 校验运单号
    function checkSearchCode(isMsg) {
      const searchCode = getValue('deliveryCode')
      if (isEmpty(searchCode)) {
        getFocus('deliveryCode')
        log('请输入卡板号')
        isMsg && Message.error('请输入卡板单号')
        return false
      }
      return true
    }
// 重量异常校验
    function checkWeightException() {
      const weight = getValue('weight')
      const weightSubtraction = Math.abs(weight - baseData.totalWeight).toFixed(4);
      if (weight < baseData.weightLowerLimit || weight > baseData.weightUpperLimit) {
        Dialog.confirm({
          autoKey,
          title: '重量异常提示',
          content: <div>
            <p>实际称量重量：<b style={{fontWeight: 'bold'}} className="warn-color">{weight}kg</b></p>
            <p>系统记录重量：<b style={{fontWeight: 'bold'}} className="warn-color">{baseData.totalWeight}kg</b></p>
            <p>重量差异：<b style={{fontWeight: 'bold', color: 'red'}}>{weightSubtraction}kg</b></p>
          </div>,
          okText: '确认提交',
          onOk: () => {submit()},
          onCancel: () => {getFocus('weight')},
          onClose: () => {getFocus('weight')}
        })
        return false
      }
      return true
    }
// 判断是否自动提交
    function isAutoSubmit() {
      const isAuto = AutoSubmit.status()
      log(`检查自动提交状态： ${isAuto}`)
      if (isEmpty(isAuto)) return false
      return true
    }
// 自动提交
    function getAutoSubmit() {
      !getAutoSubmitLock() && isAutoSubmit() && checkPackage('nomsg') && submit();
    }
// 提交
    async function submit () {
        log('完成校验，正在提交====')
        const weight = getValue('weight')
        const cardBoardNo = getValue('deliveryCode')
        try{
          setBtnLoading(true)
          Message.info('正在提交数据...')
          const res = await getSubmit({
            cardBoardNo,
            weight
          })
          if (res && res.data) {
            Message.success(<div>
              <div>操作成功</div>
              正在打印...
            </div>)
            PrintLabel(res).then((res) => {
              Message.success(<div>
                <div>打印成功</div>
                <div>卡板号：{deliveryCode}</div>
              <div>卡板重量：{weight}</div>
              </div>)
              reset()
            }).catch((err) => {
              finishVideoRecord()
              Message.error('打印失败,请检查打印组件')
            })
          } else {
            Message.success(<div>
              <div>操作成功</div>
              <div>卡板号：{deliveryCode}</div>
              <div>卡板重量：{weight}</div>
            </div>)
            reset()
          }
        } catch(e) {
          Message.error(e.message)
          setAutoSubmitLock(true)
          finishVideoRecord()
        } finally {
          setBtnLoading(false)
        }
    }
    return <div className="reversal-storage">
        <Card>
        <div slot="content">
          <Input ref={refs['deliveryCode']} onEnter={onSearch} label="扫描卡板号"></Input>
          <Input mt="10" ref={refs['weight']} onEnter={onWeightScan} label="卡板重量（KG）"></Input>
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
