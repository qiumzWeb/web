import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, Dialog, KeyBoard, Card, CheckBox, AutoSubmit } from '@/component'
import { localStore, Cookie, isType, onEnter, codeRegExp, weightRegExp } from 'assets/js/utils'
import { isTrue, isEmpty, _getName, getObjType, sleepTime } from 'assets/js'
import {
  POWWT,
  PrintLabel,
} from './config'
import { getSubmit, getCheckPackage, getTickPrint } from './api'
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
App.title = '称重打单'
const autoKey = 'mergeVolumnWeightOrder'
let onAutoSubmit = () => {}
const VolumsConf = ['weight', 'length', 'width', 'height']
export default function App(props) {
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur, getSelect} = useInput([
      'searchCode', ...VolumsConf
    ])
    const [volumsInputs, setVolumsInputs] = useState(null)
    const [baseData, setBaseData] = useState({}) // 基本信息
    const VolumsRef = useRef()
    // 是否锁定自动提交，如果锁定，则不会触发自动提交
    const [getAutoSubmitLock, setAutoSubmitLock] = useAction('mergeVolumeWeightAutoSubmitLocked');
    onAutoSubmit = getAutoSubmit

// 初始化数据
    useEffect(() => {
      getFocus('searchCode');
      checkJobCode(onSearch);
      setAutoSubmitLock(true);
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
        // 结束录制视频
        finishVideoRecord()
      }
    }, [])
// 重置页面
    useReset(() => {
      getFocus('searchCode')
      setAutoSubmitLock(true)
      // 结束录制视频
      finishVideoRecord()
    }, [])

// 判断是否自动提交
    function isAutoSubmit() {
      const isAuto = Cookie.get(autoKey)
      log(`检查自动提交状态： ${isAuto}`)
      if (isEmpty(isAuto)) return false
      return true
    }
// 包裹框号扫描
    async function onSearch () {
      Message.clear()
      const searchCode = getValue('searchCode') && getValue('searchCode').trim()
      if (isEmpty(searchCode)) return
      try {
        await checkJobCode(onSearch)
        getFocus('weight')
        Message.info('单号校验中...')
        startVideoRecord(searchCode)
        getCheckPackage(searchCode).then(data => {
          // 解除自动提交锁定，
          setAutoSubmitLock(false);
          setBaseData(data || {})
          // 天机测量
          getVolumeAndWeight(searchCode)
          Message.success(<div>
            <div>包裹单号：</div>
            <div>{searchCode}</div>
            <div style={{textAlign: 'center', fontSize: px2rem(60)}}>校验成功</div>
          </div>, 1)
        }).catch(e => {
          useRefresh()
          Message.error(<div>
            <div>包裹单号：</div>
            <div>{searchCode}</div>
            <div>{e.message}</div>
          </div>)
        })
      } catch(e) {
        Message.error(e.message || e)
      }
    }

// 天机称重
    function getVolumeAndWeight(value) {
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
// 重量扫描
    function onWeightScan() {
      setTimeout(getAutoSubmit, 50)
    }
// 提交前检验必填参数
    function checkPackage(flag) {
      const isMsg = flag !== 'nomsg'
      log('开始校验参数')
      log('校验包裹号')
      if (!checkSearchCode(isMsg)) return false
      // 需要称重的时候 ，校验重量
      log('校验重量')
      if (!checkWeight(isMsg)) return false
      log('校验体积')
      if (!checkVolume(isMsg)) return false
      log('重量异常校验')
      if (!_mergeCheckWeight()) return false
      return true
    }
// 校验包裹号
    function checkSearchCode(isMsg) {
      const code = getValue('searchCode')
      if (isEmpty(code)) {
        getFocus('searchCode')
        log('请输入包裹号')
        isMsg && Message.error('请输入包裹号')
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
        log('合箱重量有误，请检查重量')
        isMsg && Message.error('合箱重量有误，请检查重量')
        return false
      }
      return true
    }
    // 校验体积
    function checkVolume(isMsg) {
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
// 自动提交
    function getAutoSubmit() {
      !getAutoSubmitLock() && isAutoSubmit() && checkPackage('nomsg') && submit();
    }
// 提交
    async function submit () {
        log('完成校验，正在提交====')
        try{
          setBtnLoading(true)
          Message.info('正在提交数据...')
          let res = null
          // 单票提交
            const deliveryCode = getValue('searchCode').trim()
            const width = getValue('width')
            const height = getValue('height')
            const length = getValue('length')
            const weight = getValue('weight')
            const params = {
              searchCode: deliveryCode,
              boxWidth: width,
              boxHeight: height,
              boxLength: length,
              weight
            }
            res = await getSubmit(params)
            if (res && res.data) {
                Message.success(<div>
                  <div>操作成功</div>
                  <div>正在打印...</div>
                </div>)
                // 打印面单
                PrintLabel(res).then((res) => {
                  Message.success(<div>
                    <div>打印成功</div>
                    <div>包裹单号：</div>
                    <div>{deliveryCode}</div>
                    <div>包裹重量：{weight}kg</div>
                    <div>包裹体积：</div>
                    <div>长：{length}CM，宽：{width}CM，高：{height}CM</div>
                  </div>)
                  useRefresh();
                }).catch((err) => {
                  Message.error('面单打印失败,请检查打印组件')
                  // 结束录制视频
                  finishVideoRecord()                  
                })
            } else {
              Message.success(<div>
                <div>操作成功</div>
                <div>包裹单号：</div>
                <div>{deliveryCode}</div>
                <div>包裹重量：{weight}kg</div>
                <div>包裹体积：</div>
                <div>长：{length}CM，宽：{width}CM，高：{height}CM</div>
              </div>)
              useRefresh()
            }
            // 打印小票
            getTickPrint(deliveryCode).then(tickRes => {
              PrintLabel(tickRes)
            }).catch(e => {
              Message.error('小票打印失败,请检查打印组件')
            })
        } catch(e) {
          setAutoSubmitLock(true)
          Message.error(e.message)
          // 结束录制视频
          finishVideoRecord()          
        } finally {
          setBtnLoading(false)
        }
    }

    return <div className="mergeOrder">
        <Card audioType={1}>
        <div slot="content">
            <Input ref={refs['searchCode']} style={{ flex: 1 }} onEnter={onSearch} label="包裹运单号"></Input>
            <Input ref={refs['weight']} label="包裹重量(KG)" style={{flex: 1}} mt='10' onEnter={onWeightScan}></Input>
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
        <div slot="btnTools" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <div className="btnbox">
            </div>
            <div>
              <AutoSubmit autoKey={autoKey}></AutoSubmit>
              <Button onClick={() => {
                checkPackage() && submit()
              }} disabled={btnLoading}>提交</Button>
            </div>
        </div>
        <div slot="info">
          <div className='warn-title'>{'已完成包裹'}</div>
        </div>  
        </Card>
    </div>
}
