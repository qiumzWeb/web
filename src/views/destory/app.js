import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, RadioGroup, Card } from '@/component'
import {onEnter} from 'assets/js/utils'
import { isTrue, isEmpty, _getName } from 'assets/js'
import {
  PrintLabel,
  warehouseId,
  PowWeight
} from './config'
import {getSubmit} from './api'
require('./index.scss')

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
App.title = '包裹销毁'
const PowW = new PowWeight()
let makePhoto = () => Promise.resolve()

export default function App(props) {
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur, getSelect} = useInput(['searchCode'])
    const [imgList, setImgList] = useState([])
    const webVideoRef = useRef({})
    const webPhotoRef = useRef()
// 初始化数据
    useEffect(() => {
      getFocus('searchCode')
      checkJobCode()
      // 初始化相机，打开摄像头
      // getInitWebVedio()
      makePhoto = PowW.crateTakePhoto(webVideoRef)
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
    function onSearch() {
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
        log('请输入包裹运单号')
        isMsg && Message.error('请输入包裹运单号')
        return false
      }
      return true
    }
// 拍摄照片
    function getPhotoFormVideo() {
      makePhoto().then(data_uri => {
        setImgList([
          ...imgList,
          data_uri
        ])
      })
    }
// 提交
    async function submit () {
        log('完成校验，正在提交====')
        const deliveryCode = getValue('searchCode').trim()
        try{
          setBtnLoading(true)
          Message.info('正在提交数据...')
          const res = await getSubmit({
            deliveryCode,
            imagUrl: imgList.map(img => {
              if(img.startsWith('http')) return img
              return img.substr(22)
            }).join(';'),
            warehouseId
          })
          Message.success(<div>
            <div>操作成功</div>
            <div>包裹号：{deliveryCode}</div>
          </div>)
          useRefresh()
        } catch(e) {
          finishVideoRecord()
          Message.error(e.message)
        } finally {
          setBtnLoading(false)
        }
    }
    return <div className="package-destory">
        <Card>
        <div slot="content">
            <div style={{ display: 'flex'}}>
                <Input ref={refs['searchCode']} style={{ flex: 1 }} onEnter={onSearch} label="包裹运单号"></Input>
            </div>
            <div style={{ display: 'flex', marginTop: 10}}>
              {!isPow() && <div className='web-vedio' ref={webVideoRef}></div>}
              <div className='web-photo' ref={webPhotoRef}>
                {imgList.map((url, index) => {
                  return <img key={index} src={url}></img>
                })}
              </div>
            </div>
        </div>
        <div slot="btnTools" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <div className="btnbox">
                <Button disabled={btnLoading} onClick={getPhotoFormVideo}>拍摄照片</Button>
            </div>
            <div>
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
