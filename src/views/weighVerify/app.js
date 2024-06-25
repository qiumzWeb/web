import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, Card, CheckBox, Dialog, AutoSubmit } from '@/component'
import {onEnter, Cookie, weightRegExp} from 'assets/js/utils'
import { isTrue, isEmpty, _getName } from 'assets/js'
import {
  POWWT
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
App.title = '称重校验'
// 定时器
let timer = null
const autoKey = 'weightVerifyAuto'
let onWeightAutoSubmit = () => {}
export default function App(props) {
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur} = useInput(['weight', 'dispatchCode'])
    const [baseData, setBaseData] = useState({}) // 基本信息
    // 是否锁定自动提交，如果锁定，则不会触发自动提交
    const [getAutoSubmitLock, setAutoSubmitLock] = useAction('weighVerifyAutoSubmitLocked');
    onWeightAutoSubmit = getAutoSubmit
// 初始化数据
    useEffect(() => {
      getFocus('dispatchCode')
      checkJobCode()
      setAutoSubmitLock(true);
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
      getFocus('dispatchCode')
      setValue('dispatchCode', '')
      setValue('weight', '')
      setBaseData({})
      finishVideoRecord()
    }
// 包裹号扫描
    function onSearch () {
      Message.info('正在校验运单号...')
      const dispatchCode = getValue('dispatchCode').trim()
      startVideoRecord(dispatchCode)
      getCheckDeliveryCode({ dispatchCode }).then(data => {
        setBaseData(data || {})
        getFocus('weight')
        Message.success('校验成功');
        // 解除自动提交锁定，
        setAutoSubmitLock(false);
        // getAutoSubmit()
      }).catch(e => {
        Message.error(<div>
          <div>末端运单号：{dispatchCode}</div>
          <div>{e.message}</div>
        </div>)
        setAutoSubmitLock(true);
        setValue('dispatchCode', '')
        getFocus('dispatchCode')
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
      log('重量异常校验')
      if (!_mergeCheckWeight()) return false
      return true
    }
// 校验重量
    function checkWeight(isMsg) {
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
// 校验运单号
    function checkSearchCode(isMsg) {
      const searchCode = getValue('dispatchCode')
      if (isEmpty(searchCode)) {
        getFocus('dispatchCode')
        log('请输入包裹运单号')
        isMsg && Message.error('请输入包裹运单号')
        return false
      }
      return true
    }
// 重量异常校验
    function _mergeCheckWeight() {
      const weight = getValue('weight')
      log(`重量误差下限：${baseData.weightLowerLimit}`)
      log(`重量误差上限：${baseData.weightUpperLimit}`)
      log(`当前重量： ${weight}`)
      log(`系统记录重： ${baseData.totalWeight}`)
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
        const dispatchCode = getValue('dispatchCode')
        try{
          setBtnLoading(true)
          Message.info('正在提交数据...')
          const res = await getSubmit({
            dispatchCode,
            weight
          })
          Message.success(<div>
            <div>操作成功</div>
            未端运单号：{dispatchCode}
          </div>)
          reset()
        } catch(e) {
          finishVideoRecord()
          Message.error(e.message)
          setAutoSubmitLock(true)
        } finally {
          setBtnLoading(false)
        }
    }
    return <div className="reversal-storage">
        <Card>
        <div slot="content">
          <Input ref={refs['dispatchCode']} onEnter={onSearch} label="未端运单号"></Input>
          <Input mt="10" ref={refs['weight']} onEnter={onWeightScan} label="重量（KG）"></Input>
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
