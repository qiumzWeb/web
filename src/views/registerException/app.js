import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, RadioGroup, Card } from '@/component'
import {onEnter} from 'assets/js/utils'
import { isTrue, isEmpty, _getName } from 'assets/js'
import {
  PrintLabel,
  excelPtionTypeOptions
} from './config'
import {getSubmit} from './api'

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
App.title = '异常登记'

export default function App(props) {
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur, getSelect} = useInput(['searchCode'])
    const [type, setType] = useState(['300'])
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
    async function submit () {
        log('完成校验，正在提交====')
        const code = getValue('searchCode').trim()
        try{
          setBtnLoading(true)
          Message.info('正在提交数据...')
          const res = await getSubmit({code, type: type[0]})
          if (res && res.data) {
            Message.success('正在打印...')
            PrintLabel(res).then((res) => {
              Message.success(`打印成功, 面单号： ${code}`)
              useRefresh()
            }).catch((err) => {
              finishVideoRecord()
              Message.error('打印失败,请检查打印组件')
            })
          } else {
            Message.success(<div>
              <div>操作成功</div>
              包裹面单号：{code}
            </div>)
            setTimeout(() => {
              useRefresh()
            }, 500)
          }

        } catch(e) {
          finishVideoRecord()
          Message.error(e.message)
        } finally {
          setBtnLoading(false)
        }
    }
    return <div className="register-exception">
        <Card>
        <div slot="content">
            <div style={{ display: 'flex', }}>
                <Input ref={refs['searchCode']} style={{ flex: 1 }} onEnter={onSearch} label="包裹面单号"></Input>
                <Button disabled={btnLoading} onClick={onSearch}>提交</Button>
            </div>
            <RadioGroup mt="10" dataSource={excelPtionTypeOptions} value={type} onChange={(d) => {setType(d)}}></RadioGroup>
        </div>
        <div slot="info">
        <div className='warn-title'>已完成包裹</div>
        </div>  
        </Card>
    </div>
}
