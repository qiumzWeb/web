import React, {useEffect, useState, useRef,} from 'react'
import { Button, Input, Card, CheckBox, AutoSubmit } from '@/component'
import { Cookie, onEnter, PowWeight, weightRegExp } from 'assets/js/utils'
import { isEmpty } from 'assets/js'
import { getCheckBatchNum, getCheckBigbagNum, getCheckWeight, getSubmitSign} from './api/index'

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

const { useInput, useAction } = React
const autoKey = 'bigBagSignAutoSubmit'
const inputGroup = ['batchNum', 'bigBagNum', 'weight']
App.title = '大包签收&重量校验'
export default function App(props) {
  const {getValue, setValue, refs, getFocus, getSelect} = useInput(inputGroup)
  const warehouseId = Cookie.get('warehouseId')
  const [batchNumDisabled, setBatchNumDisabled] = useState(false)
  const [bigBagNumDisabled, setBigBagNumDisabled] = useState(false)
  const [submitDisabled, setSubmitDisabled] = useState(false)
  const [signBigBagCount, setSignBigBagCount] = useState(0)
  // 判断是否是JOOM仓包裹
  const [isJOOMPackage, setIsJOOMPackage] = useAction('checkBigBagIsJOOMPackage')
  useEffect(() => {
    getFocus('bigBagNum')
    checkJobCode()
    getWeigthConfig(() => {
      // 获取天机重量
      const wet = new PowWeight()
      wet.getWeight(weight => {
        setValue('weight', weight)
      })
    })
    setIsJOOMPackage(null)
    return () => {
      setIsJOOMPackage(null)
      finishVideoRecord()
    }
  }, [])
  function refresh() {
    inputGroup.forEach(input => {
      if (input == 'batchNum') return
      setValue(input, '')
    });
    setTimeout(() => getFocus('bigBagNum'), 0);
    setIsJOOMPackage(null);
    finishVideoRecord()
  }
  // 输入批次号
  async function batchNumSearch() {
    try {
      Message.info('批次号校验中...')
      const data = await getCheckBatchNum({
          batchId: getValue('batchNum')
      })
      setBatchNumDisabled(true)
      getFocus('bigBagNum');
      setSignBigBagCount(data && data.signedBigBagCount || 0);
      Message.success(<div>
        <p>已签收大包数：{data && data.signedBigBagCount || 0}</p>
        <p>交接批次大包总数：{data && data.bigBagList && data.bigBagList.length || 0}</p>
      </div>);
      // 触发自动提交
      getAutoSubmit();
    } catch(e) {
      getSelect('batchNum')
      Message.error(e.message)
    }
  }
  // 输入大包号
  async function bigBagNumSearch() {
    Message.clear()
    try {
      startVideoRecord(getValue('bigBagNum'))
      Message.info(<div>
        <p>大包校验中...</p>
        <p>已签收大包数：{signBigBagCount || 0}</p>
      </div>)
      const data = await getCheckBigbagNum({
          bigBagId: getValue('bigBagNum')
      })
      console.log(data, '==大包数据===')
      setBigBagNumDisabled(true)
      // 判断 是否为JOOM 仓， inSing = 10 为 JOOM 仓， 大包签收无需称重
      setIsJOOMPackage(data && data.intSign == 10);
      Message.success(<div>
        <p>已签收大包数：{signBigBagCount || 0}</p>
        <p>交接批次大包总数：{data && data.bigBagList && data.bigBagList.length || 0}</p>
      </div>)
      // 触发自动提交
      getAutoSubmit()
    } catch(e) {
      Message.error(e.message)
    }
  }
  // 输入大包重量
  function bigBagWeightSearch() {
    // 触发自动提交
    getAutoSubmit()
  }
  // 自动提交
  function getAutoSubmit() {
    if (isEmpty(AutoSubmit.status())) return
    getSubmit()
  }
  // 提交 
  async function getSubmit() {
    if (!getCheck()) return
    try {
      setSubmitDisabled(true)
      Message.info('正在发送请求...')
      const data = {
        batchId: getValue('batchNum'),
        bigBagId: getValue('bigBagNum'),
        weight: getValue('weight'),
        // storageSign:true
      }
      const res = await getSubmitSign(data)
      if (res) {
        let count = signBigBagCount
        if (res.msg != '大包重复签收') {
          count++;
          setSignBigBagCount(count)
        }
        Message.success(<div>
          <p>已签收大包数：{count}</p>
          <p>{res.msg}</p>
        </div>)
      } else {
        Message.success(<div>
          <p>操作成功</p>
          <p>大包号： {data.bigBagId}</p>
          <p>包裹重量：{data.weight}KG</p>
        </div>)
      }
      refresh()
    } catch(e) {
      Message.error(e.message)
      finishVideoRecord()
    } finally {
      // setBatchNumDisabled(false)
      setBigBagNumDisabled(false)
      setSubmitDisabled(false)
    }
  }
  // 提交校验
  function getCheck() {
    // if (isEmpty(getValue('batchNum'))) {
    //   getFocus('batchNum')
    //   setBatchNumDisabled(false)
    //   return false
    // }
    if (isEmpty(getValue('bigBagNum'))) {
      getFocus('bigBagNum')
      setBigBagNumDisabled(false)
      return false
    }
    const weight = getValue('weight')
    if(!isJOOMPackage() && (isEmpty(weight) || !weightRegExp.test(weight))) {
      Message.error('重量输入有误')
      getFocus('weight')
      return false
    }
    return true
  }
  // 获取称重配置
  async function getWeigthConfig(getWeight) {
    try {
      const data = await getCheckWeight({warehouseId})
      if (data && data.isBigbagSignWeighing === 1 && data.signType === 1) {
        typeof getWeight == 'function' && getWeight()
      }
    } catch(e) {
      Message.error(e.message)
    }
  }
  return <div className="noshelfBigbagSign">
    <Card>
    <div slot="content">
        <Input mb='10' disabled={batchNumDisabled} ref={refs['batchNum']} style={{ flex: 1 }} onEnter={batchNumSearch} onFocus={(e) => e.target.value = ''} label="交接批次号"></Input>
        <Input mb="10" disabled={bigBagNumDisabled} label="大包号" ref={refs['bigBagNum']} onEnter={bigBagNumSearch}></Input>
        <Input mb='10' label="大包重量(KG)" ref={refs['weight']} onEnter={bigBagWeightSearch}></Input>
    </div>
    <div slot="btnTools" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
        <AutoSubmit autoKey={autoKey} isAuto></AutoSubmit>
        <Button disabled={submitDisabled} onClick={getSubmit}>提交</Button>
    </div>
    <div slot="info">
    <div className='warn-title'>已完成包裹</div>
    </div>  
    </Card>
  </div>
}
