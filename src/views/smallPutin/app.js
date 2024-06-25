import React, {useEffect, useState, useRef } from 'react'
import { Button, Input, Dialog, KeyBoard, Card, CheckBox, AutoSubmit } from '@/component'
import { localStore, Cookie, isType, onEnter, codeRegExp, weightRegExp } from 'assets/js/utils'
import { isTrue, isEmpty, _getName, getObjType, sleepTime } from 'assets/js'
import { electrifyTypeOptions, pkgtypeTypeOptions, defaultVolumeOption} from '@/layout/setting/config'
import Bus from 'assets/js/bus'
import {
  POWWT,
  PrintLabel,
  warehouseId,
} from './config'
import {
  getSubmit, getLZDServiceType, getPackageSupportNoPreAlert,
  getTagDamage, getMoreSubmit, getSaveNoPrealertPackage, getMorePrint
} from './api'

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
App.title = '小货入库'
// 定时器
let timer = null
const autoKey = 'smallPutinAuto'
let onAutoSubmit = () => {}
const VolumsConf = ['weight', 'length', 'width', 'height']
export default function App(props) {
    const [btnLoading, setBtnLoading] = useState(false)
    const {getValue, setValue, refs, getFocus, getBlur, getSelect} = useInput([
      'searchCode', ...VolumsConf
    ])
    const [volumsInputs, setVolumsInputs] = useState(null)
    const [isLZDType, setIsLZDType] = useState(false)
    const [isWornFlag, setIsWornFlag] = useState(false)
    const VolumsRef = useRef()
    const [packageList, setPackageList] = useState([])
    const [getBigBagCode, setBigBagCode] = useAction('bigBagCode') // 包裹号
    const [getDialogStatus, setDialogStatus] = useAction('smallPutinLockBox') // 提交锁
    // 判断是否是 JOOM 仓
    const [getIsJOOMPackage, setIsJOOMPackage] = useAction()
    onAutoSubmit = getAutoSubmit
// 初始化数据
    useEffect(() => {
      getFocus('searchCode')
      checkJobCode()
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
      getLZDServiceType().then(res => {
        setIsLZDType(Array.isArray(res) && res.includes('LZDCONSO'))
      }).catch(e => {})
      setTimeout(() => {
        const electrify = _getName(electrifyTypeOptions.filter(f => f.value), Cookie.get('electrify')) 
        const pkgtype = _getName(pkgtypeTypeOptions, Cookie.get('pkgtype') || '2')
        const defaultVolume = _getName(defaultVolumeOption, Cookie.get('defaultVolume'))
        let title = electrify
        if (warehouseId == '10003001') {
          title = pkgtype + (defaultVolume ? `-${defaultVolume}` : '') + (title ? `-${title}` : '')
        }
        Bus.$emit('setTitle', title)
      }, 60)
      return () => {
        Bus.$emit('setTitle', '')
        finishVideoRecord()
      }
    }, [])
// 重置页面
    useReset(() => {
      getFocus('searchCode')
      setDialogStatus(null)
      finishVideoRecord()
      setIsJOOMPackage(null)
    }, [])
// 判断是否自动提交
    function isAutoSubmit() {
      const isAuto = Cookie.get(autoKey)
      log(`检查自动提交状态： ${isAuto}`)
      if (isEmpty(isAuto)) return false
      return true
    }
// 包裹框号扫描
    function onSearch () {
      Message.clear()
      const searchCode = getValue('searchCode') && getValue('searchCode').trim()
      if (isEmpty(searchCode)) return
      startVideoRecord(searchCode)
      getFocus('weight')
      Message.info('单号校验中...')
      getPackageSupportNoPreAlert({
        deliveryCode: searchCode,
        type: 0
      }).then(data => {
        const defaultVolume = Cookie.get('defaultVolume')
        const pkgType = Cookie.get('pkgtype') || 2
        if (defaultVolume) {
          setValue('length', 25)
          setValue('height', pkgType == '2' ? 13 : 35)
          setValue('width', pkgType == '2' ? 35 : 32)
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
        if (data === 'IGNORE_SCAN_RESULT') {
          setIsJOOMPackage(true)
          // JOOM 仓无需提示校验成功
          Message.success('   ', 0)
        } else {
          setIsJOOMPackage(false)
          Message.success(<div>
            <div>包裹单号：</div>
            <div>{searchCode}</div>
            <div style={{textAlign: 'center', fontSize: px2rem(60)}}>校验成功</div>
          </div>, 1)
        }

      }).catch(e => {
        useRefresh()
        Message.error(<div>
          <div>包裹单号：</div>
          <div>{searchCode}</div>
          <div>{e.message}</div>
        </div>)
      })
    }
// 天机称重
    function getVolumeAndWeight(value) {
      if (isLZDType) return // LZD业务不需要称重
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
      // 是否锁定
      if (getDialogStatus()) return false
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
      if (isEmpty(weight) || !weightRegExp.test(weight)) {
        getFocus('weight')
        log('合箱重量有误，请检查重量')
        isMsg && Message.error('合箱重量有误，请检查重量')
        return false
      }
      return true
    }
// 标记破损
    function setWornFlag() {
      setIsWornFlag(!isWornFlag)
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
            const pkgType = Cookie.get('pkgtype') || 2
            const params = {
              isElectric: electrify == 'Y' ? electrify : undefined,
              goodsType: electrify == 'SPECIAL_GOODS' ? electrify : undefined,
              packageType: pkgType,
              deliveryCode,
              width,
              height,
              length,
              weight
            }
            if (isWornFlag) {
              // 标记破损
              res = await getTagDamage(params)
            } else {
              // 入库提交
              res = await getSubmit(params)
            }
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
                  function SuccessRender() {
                    Message.success(<div>
                      <div>打印成功</div>
                      <div>包裹单号：</div>
                      <div>{deliveryCode}</div>
                      <div>包裹重量：{weight}kg</div>
                      <div style={{textAlign: 'center', fontSize: px2rem(60)}}>入库成功</div>
                      <div style={{textAlign: 'center', fontSize: px2rem(100)}}>{res.alertMessage}</div>
                    </div>)
                  }
                  useRefresh();
                  SuccessRender.alertMessage = res.alertMessage;
                  _afterPackageInfo(SuccessRender)
                }).catch((err) => {
                  finishVideoRecord()
                  Message.error('打印失败,请检查打印组件')
                })
              }
            } else {
              function SuccessRender() {
                Message.success(<div>
                  <div>操作成功</div>
                  <div>包裹单号：</div>
                  <div>{deliveryCode}</div>
                  <div>包裹重量：{weight}kg</div>
                  <div style={{textAlign: 'center', fontSize: px2rem(100)}}>{res.alertMessage}</div>
                </div>)
              }
              useRefresh();
              SuccessRender.alertMessage = res.alertMessage;
              _afterPackageInfo(SuccessRender);
            }
          } else {
            // 多票打标签提交
            res = await getMoreSubmit(packageList)
            log(res)
            if (res.success && res.data) {
              // 如果data返回值则，入库失败，需要重试, 最多重试20次
              if (requestTimes >= 20) {
                Message.error('入库失败，已达到重试上限,请联系IT')
              } else {
                requestTimes += 1
                await sleepTime(3000) // 3秒
                await submit(requestTimes)
              }
            } else {
              const plist = packageList
              setPackageList([])
              function SuccessRender() {
                Message.success(<div>
                  <div>包裹运单号：{getBigBagCode()}</div>
                  {plist.map(p => {
                    return <div key={p.deliveryCode}>
                      包裹：{p.deliveryCode}(已打标签)，重量：{p.weight}KG，体积：{p.length}X{p.width}X{p.height}CM³
                    </div>
                  })}
                  <div style={{textAlign: 'center', fontSize: px2rem(60)}}>入库成功</div>
                  <div style={{textAlign: 'center', fontSize: px2rem(100)}}>{res.alertMessage}</div>
                </div>)
              }
              useRefresh();
              SuccessRender.alertMessage = res.alertMessage;
              _afterPackageInfo(SuccessRender);
            }
          }

          
        } catch(e) {
          if (isEmpty(packageList) && e.errCode == 'labelPrintErrorCode') {
            const deliveryCode = getValue('searchCode').trim()
            const weight = getValue('weight')
            Message.error(<div>
              <div>{e.message}</div>
              <div>正在打印...</div>
            </div>)
            e && e.data && PrintLabel(e).then((res) => {
              function ErrorRender() {
                Message.error(<div>
                  <div>{e.message}</div>
                  <div>打印成功</div>
                  <div>包裹单号：</div>
                  <div>{deliveryCode}</div>
                  <div>包裹重量：{weight}kg</div>
                  <div style={{textAlign: 'center', fontSize: px2rem(60)}}>入库失败</div>
                  <div style={{textAlign: 'center', fontSize: px2rem(80)}}>{e.alertMessage}</div>
                </div>)
              }
              ErrorRender.alertMessage = e.alertMessage;
              _afterPackageInfo(ErrorRender);
              useRefresh();
            }).catch((err) => {
              finishVideoRecord()
              Message.error('打印失败,请检查打印组件')
            })
          } else {
            finishVideoRecord()
            Message.error(e.message)
            // JOOM 仓 强行清空输入框， 不再报错停留
            if (getIsJOOMPackage()) {
              useRefresh()
            }
          }
        } finally {
          setBtnLoading(false)
          setDialogStatus(null)
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
    // 库区提示，播报语音
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
              <div>{res.deliveryCode}</div>
              <div style={{fontSize: px2rem(80)}}>
                {res.data && res.data.isTailText && <div>{res.data.isTailText}</div>}
                {res.data && <div>{res.data.alertResultText}</div>}
                <div>{res.alertMessage}</div>
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
    // 多票打标签
    async function getMoreNoPreAlertPackagePrint() {
      try {
        log('完成校验，正在提交====')
        setBtnLoading(true)
        setDialogStatus('lock')
        Message.info('正在提交数据...')
        const deliveryCode = getValue('searchCode').trim()
        setBigBagCode(deliveryCode) // 保存大包号
        const curDeliveryCode = deliveryCode + '-' + (packageList.length + 1)
        const width = getValue('width')
        const height = getValue('height')
        const length = getValue('length')
        const weight = getValue('weight')
        const params = {deliveryCode: curDeliveryCode.toUpperCase()}
        // 无预报校验
        await getSaveNoPrealertPackage(params)
        const res = await getMorePrint({...params, packageType: 2})
        // 不需要打印
        if (res.data.printUrl && res.data.printUrl.includes('needNotPrint')) {
          _afterSmallPrint(res.data)
        } else {
          Message.success(<div>
            <div>操作成功</div>
            <div>正在打印...</div>
          </div>)
          PrintLabel(res).then((res) => {
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
          }).catch((err) => {
            Message.error('打印失败,请检查打印组件')
          })
        }
      } catch(e) {
        Message.error(e.message)
        if(getIsJOOMPackage()) {
          getSelect('searchCode');
        }
      } finally {
        setBtnLoading(false)
        setDialogStatus(null)
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
              {isLZDType && <Button className={isWornFlag ? 'error-back' : ''} onClick={setWornFlag}>标记破损</Button>}
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
          <div className='warn-title'>{isWornFlag ? '标记破损' : '已完成包裹'}</div>
        </div>  
        </Card>
    </div>
}
