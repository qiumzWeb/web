import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, Dialog, KeyBoard, Card, CheckBox, AutoSubmit } from '@/component'
import { localStore, Cookie, isType, onEnter, codeRegExp, weightRegExp } from 'assets/js/utils'
import { isTrue, isEmpty, _getName, getObjType, sleepTime } from 'assets/js'
import { electrifyTypeOptions} from '@/layout/setting/config'
import Bus from 'assets/js/bus'
import {
  POWWT,
  PrintLabel,
  warehouseId,
} from './config'
import { getSubmit, getPackageSupportNoPreAlert, getMoreSubmit, getMorePrint } from './api'
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
App.title = '入库(新)'

const autoKey = 'inStorageAuto'
let onAutoSubmit = () => {}
const VolumsConf = ['weight', 'length', 'width', 'height']
export default function App(props) {
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur, getSelect} = useInput([
      'searchCode', ...VolumsConf
    ])
    const [volumsInputs, setVolumsInputs] = useState(null)
    const VolumsRef = useRef()
    const [packageList, setPackageList] = useState([])
    const [getBigBagCode, setBigBagCode] = useAction('bigBagCode') // 包裹号
    const [getDialogStatus, setDialogStatus] = useAction('inStoreMergeBox') // 提交锁
// 自动提交
    onAutoSubmit = getAutoSubmit

// 初始化数据
    useEffect(() => {
      getFocus('searchCode')
      checkJobCode(onSearch)
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
      setTimeout(() => {
        const electrify = _getName(electrifyTypeOptions.filter(f => f.value), Cookie.get('electrify')) 
        let title = electrify
        Bus.$emit('setTitle', title)
      }, 60)
      return () => {
        Bus.$emit('setTitle', '')
        // 结束录制
        finishVideoRecord()
      }
    }, [])
// 重置页面
    useReset(() => {
      getFocus('searchCode')
      // 解除锁定
      setDialogStatus(null)
      // 结束录制
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
      getFocus('weight')
      try {
        await checkJobCode(onSearch)
        Message.info('单号校验中...')
        // 开始录制
        startVideoRecord(searchCode)
        // 校验包裹号
        getPackageSupportNoPreAlert({
          deliveryCode: searchCode,
          type: 0
        }).then(data => {
          const defaultVolume = Cookie.get('defaultVolume')
          if (defaultVolume) {
            setValue('length', 1)
            setValue('height', 1)
            setValue('width', 1)
            getFocus('weight')
          }
          if (data) {
            const d = {}
            if (getObjType(data) === 'Object') {
              VolumsConf.forEach(key => {
                if (data[key] > 0) {
                  d[key] = data[key]
                }
              })
            } else if (data > 0) {
              d.weight = data
            }
            Object.entries(d).forEach(([key, val]) => {
              setValue(key, val)
            })
            if (d.weight > 0) {
              if (isAutoSubmit()) {
                onAutoSubmit()
              }
            } else {
              getVolumeAndWeight(searchCode)
            }
          }
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
      log('判断锁定状态')
      if(getDialogStatus()) return false
      log('开始校验参数')
      log('校验包裹号')
      if (!checkSearchCode(isMsg)) return false
      // 需要称重的时候 ，校验重量
      log('校验重量')
      if (!checkWeight(isMsg)) return false
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
      if (isEmpty(weight) || !(weightRegExp.test(weight) && Number(weight) < 1000)) {
        getFocus('weight')
        log('合箱重量有误，请检查重量')
        isMsg && Message.error('合箱重量有误，请检查重量')
        return false
      }
      return true
    }
// 自动提交
    function getAutoSubmit() {
      checkPackage('nomsg') && submit()
    }
// 提交
    async function submit (requestTimes = 1) {
        log('完成校验，正在提交====')
        try{
          setDialogStatus('lock')
          setBtnLoading(true)
          Message.info('正在提交数据...')
          let res = null
          // 单票提交
          if (isEmpty(packageList)) {
            const deliveryCode = getValue('searchCode').trim()
            const width = getValue('width')
            const height = getValue('height')
            const length = getValue('length')
            const weight = getValue('weight')
            const electrify = Cookie.get('electrify')
            const params = {
              isElectric: electrify == 'Y' ? electrify : undefined,
              goodsType: electrify == 'SPECIAL_GOODS' ? electrify : undefined,
              deliveryCode,
              width,
              height,
              length,
              weight
            }
            // 入库提交
            res = await getSubmit(params)
            if (res && res.data) {
              // 不需要打印
              if (res.data.printUrl && res.data.printUrl.includes('needNotPrint')) {
                _afterSmallPrint(res.data)
              } else {
                Message.success(<div>
                  <div>操作成功</div>
                  <div>正在打印...</div>
                </div>)
                PrintLabel(res).then((_) => {
                  Message.success(<div>
                    <div>打印成功</div>
                    <div>包裹单号：</div>
                    <div>{deliveryCode}</div>
                    <div>包裹重量：{weight}kg</div>
                    <div style={{textAlign: 'center', fontSize: px2rem(60)}}>入库成功</div>
                  </div>)
                  useRefresh()
                  res.deliveryCode = deliveryCode
                  _afterPackageInfo(res)
                }).catch((err) => {
                  setDialogStatus(null)
                  Message.error('打印失败,请检查打印组件')
                  // 结束录制
                  finishVideoRecord()
                })
              }
            } else {
              Message.success(<div>
                <div>操作成功</div>
                <div>包裹单号：</div>
                <div>{deliveryCode}</div>
                <div>包裹重量：{weight}kg</div>
              </div>)
              useRefresh()
            }
          } else {
            // 多票打标签提交
            res = await getMoreSubmit(packageList)
            setDialogStatus(null)
            log(res)
            if (res.success && res.data) {
              // 如果data返回值则，入库失败，需要重试, 最多重试20次
              if (requestTimes >= 20) {
                Message.error('入库失败，已达到重试上限,请联系IT')
                // 结束录制
                finishVideoRecord()                
              } else {
                requestTimes += 1
                await sleepTime(3000) // 3秒
                await submit(requestTimes)
              }
            } else {
              const plist = packageList
              setPackageList([])
              Message.success(<div>
                <div>包裹运单号：{getBigBagCode()}</div>
                {plist.map(p => {
                  return <div key={p.deliveryCode}>
                    包裹：{p.deliveryCode}(已打标签)，重量：{p.weight}KG，体积：{p.length}X{p.width}X{p.height}CM³
                  </div>
                })}
                <div style={{textAlign: 'center', fontSize: px2rem(60)}}>入库成功</div>
              </div>)
              useRefresh()
              _afterPackageInfo(res)
            }
          }

          
        } catch(e) {
          setDialogStatus(null)
          // 直邮单包 入库合箱面单获取失败，重试
          if (e.errCode === 'MergeFail') {
            // 如果data返回值则，入库失败，需要重试, 最多重试20次
            if (requestTimes > 5) {
              Message.error('入库合箱失败，已达到重试上限,请联系IT')
              // 结束录制
              finishVideoRecord()
            } else {
              Message.info(`提交失败，尝试重试${requestTimes}次...`);
              requestTimes += 1;
              sleepTime(1000).then(_ => {
                submit(requestTimes)
              })
            }
          } else {
            Message.error(e.message)
            // 结束录制
            finishVideoRecord()
          }
        } finally {
          setBtnLoading(false)
          setDialogStatus(null)
        }
    }

    // 特殊提示，播报语音
    function _afterPackageInfo(res) {
      if (typeof res === 'function') {
        if (res.alertMessage) {
          setTimeout(() => {
            POWWT.speakText(res.alertMessage);
          }, 1000)
        }
        return res.call();
      } else {
        if (
          res.alertMessage || 
          (res.data && res.data.alertResultText)
        ) {
          setTimeout(() => {
            Message.info(
            <div>
              <div>{res.deliveryCode || ''}</div>
              <div style={{fontSize: px2rem(80)}}>
                {res.data && res.data.isTailText && <div>{res.data.isTailText || ''}</div>}
                {res.data && <div>{res.data.alertResultText || ''}</div>}
                <div>{res.alertMessage || ''}</div>
              </div>
            </div>
            , 0, 'blue');
            if (res.alertMessage) {
              setTimeout(() => {
                POWWT.speakText(res.alertMessage);
              }, 1000)
            }
          }, 100);
        }
      }
    }

    // 不走打印
    function _afterSmallPrint(data) {
      Message.success(<div>
        {data.isTailText && <div>{data.isTailText}</div>}
        {data.alertDivisionText && <div>国家：{data.alertDivisionText}</div>}
        {data.alertServiceText && <div>业务：{data.alertServiceText}</div>}
        {data.alertElectricText && <div>是否带电：{data.alertElectricText}</div>}
        {data.alertResultText && <div style={{fontSize: px2rem(100)}}>{data.alertResultText}</div>}
      </div>)
      if (data.specialAlertUrl) {
        const audio = document.createElement('audio')
        audio.setAttribute('src', data.specialAlertUrl)
        audio.setAttribute('autoplay', true)
        document.body.appendChild(audio)
      }
      useRefresh()
      if (data.alertResultText) {
        setTimeout(() => {
          Message.info(<div style={{fontSize: px2rem(100)}}>
          {data.isTailText && <div>{data.isTailText}</div>}
          {data.alertResultText}
          </div>, 0, data.alertResultText.includes('尾单') && 'blue')
        }, 100)
      }
    }
    // 多票打标签
    async function getMoreNoPreAlertPackagePrint() {
      try {
        log('完成校验，正在提交====')
        setBtnLoading(true)
        Message.info('正在提交数据...')
        const deliveryCode = getValue('searchCode').trim()
        setBigBagCode(deliveryCode) // 保存大包号
        const curDeliveryCode = deliveryCode + '-' + (packageList.length + 1)
        const width = getValue('width')
        const height = getValue('height')
        const length = getValue('length')
        const weight = getValue('weight')
        const params = {
          width, height, length, weight,
          deliveryCode: curDeliveryCode.toUpperCase()
        }
        // 无预报校验
        const res = await getMorePrint({...params})
        // 不需要打印
        if (res.data.printUrl && res.data.printUrl.includes('needNotPrint')) {
          _afterSmallPrint(res.data)
        } else {
          Message.success(<div>
            <div>操作成功</div>
            <div>正在打印...</div>
          </div>)
          PrintLabel(res).then((_) => {
            Message.success('打印成功')
            const newPackageList = [
              ...packageList,
              {
                weightUnit: 'kg',
                volumeUnit: 'cm',
                deliveryCode: curDeliveryCode,
                width,
                height,
                length,
                weight
              }
            ]
            setPackageList(newPackageList)
            Message.success(<div>
              <div>包裹运单号：{getBigBagCode()}</div>
              {newPackageList.map(p => {
                return <div key={p.deliveryCode}>
                  包裹：{p.deliveryCode}(已打标签)，重量：{p.weight}KG，体积：{p.length}X{p.width}X{p.height}CM³
                </div>
              })}
            </div>)
            getSelect('searchCode');
            _afterPackageInfo(res)
          }).catch((err) => {
            Message.error('打印失败,请检查打印组件')
          })
        }
      } catch(e) {
        Message.error(e.message)
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
              <Button onClick={() => {
                checkPackage() && getMoreNoPreAlertPackagePrint()
              }} disabled={btnLoading}>多票打标签</Button>
            </div>
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
