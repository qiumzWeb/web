import React, { useEffect, useState, useRef } from 'react'
import { Button, Input, Card } from '@/component'
import { onEnter } from 'assets/js/utils'
import { isTrue, isEmpty, _getName, getRequestRepeatTimes } from 'assets/js'
import {
  PrintLabel,
} from './config'
import { getSubmit } from './api'


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


const { useReset, useInput, useRefresh, useAction } = React
// 生成页面、
App.title = '退件换配入库'
export default function App(props) {
  // 按钮点击
  const [btnLoading, setBtnLoading] = useState(false)
  const { getValue, setValue, refs, getFocus, getBlur, getSelect } = useInput(['searchCode'])

  // 初始化数据
  useEffect(() => {
    getFocus('searchCode')
    checkJobCode()
    return () => {
      finishVideoRecord()
    }
  }, [])

  // 重置页面
  useReset(() => {
    getFocus('searchCode')
    finishVideoRecord()
  }, [])

  // 包裹框号扫描
  function onSearch () {
    Message.clear()
    if (getValue('searchCode')) {
      getSelect('searchCode')
      startVideoRecord(getValue('searchCode'))
      checkPackage() && submit()
    }
  }

  // 提交前检验必填参数
  function checkPackage(flag) {
    const isMsg = flag !== 'nomsg'
    log('开始校验参数')
    log('校验面单号')
    if (!checkSearchCode(isMsg)) return false
    return true
  }

  // 校验面单号
  function checkSearchCode(isMsg) {
    const searchCode = getValue('searchCode')
    if (isEmpty(searchCode)) {
      getFocus('searchCode')
      log('请输入包裹面单号')
      isMsg && Message.error('请输入包裹面单号')
      return false
    }
    return true
  }

  // 提交
  async function submit() {
    console.log('完成校验，正在提交====')
    const code = getValue('searchCode').trim()
    try {
      setBtnLoading(true)
      Message.info('正在提交数据...')
      const res = await getRequestRepeatTimes(async () => {
        const r = await getSubmit({ deliveryCode: code });

        console.log('提交数据...', r)

        if (r.success && r.data) return r
      }, { times: 4, timeoutMsg: '面单获取失败, 请稍后重试！' })

      console.log('提交成功。。。')

      Message.success('提交成功，正在打印面单...')
      PrintLabel(res).then((res) => {
        Message.success(`打印成功, 面单号： ${code}`)
        useRefresh()
      }).catch((err) => {
        finishVideoRecord()
        Message.error('打印失败,请检查打印组件')
      })
    } catch (e) {
      finishVideoRecord()
      Message.error(e.message)
    } finally {
      setBtnLoading(false)
    }
  }

  // 打印标签
  // function printLabel(res) {
  //   PrintLabel(res).then((res) => {
  //     Message.success(`打印成功, 面单号： ${code}`)
  //     setBtnLoading(false)
  //     useRefresh()
  //   }).catch((err) => {
  //     Message.error('打印失败,请检查打印组件')
  //     setBtnLoading(false)
  //     getFocus('searchCode')
  //   })
  // }

  return <div className="repalceOrder">
    <Card>
      <div slot="content">
        <div style={{ display: 'flex' }}>
          <Input ref={refs['searchCode']} style={{ flex: 1 }} onEnter={onSearch} disabled={btnLoading} label="包裹面单号"></Input>
          <Button disabled={btnLoading} onClick={onSearch}>打单</Button>
        </div>
      </div>
      <div slot="info">
        <div className='warn-title'>已完成包裹</div>
      </div>
    </Card>
  </div>
}
