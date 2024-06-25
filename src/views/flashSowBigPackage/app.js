import React,{ useEffect, useState, useRef } from 'react'
import { Button, Input, Icon, Dialog, KeyBoard, Message, DragBox, RadioGroup } from '@/component'
import { getSearch, getSubmit, getUnBindSubmit, getAbnormalPackageUpdateCache, getScanBigPackage } from './api'
import { localStore, Cookie, isType, onEnter, PowWeight, Print } from 'assets/js/utils'
import { isEmpty, messageAudio, getWid } from 'assets/js'
const {useReset, useInput, useRefresh, useAction} = React
require('./scss/px2rem.scss')

// 页面是否销毁
let isDistroy = true

// 仓ID
const warehouseId = Cookie.get('warehouseId')
let timer = null
const submitBtn = {
    start: '波次播种完成',
    loading: '提交中...',
    complate: '已完成'
}

const unBindBtn = {
    start: '解绑波次',
    loading: '解绑中...',
    complate: '已解除绑定'
}
// 生成页面
App.title = '播种(闪)(多波次)'
export default function App(props) {
    const { location } = props
    const code = location.state && location.state.code || undefined
    const [data, setData] = useState({})
    const [btnText, setBtnText] = useState(submitBtn['start'])
    const [unBindText, setUnBindText] = useState(unBindBtn['start'])
    const [loading, setLoading] = useState(true)
    const [unBindLoading, setUnBindLoading] = useState(true)
    const {getValue, setValue, getSelect, refs, getFocus, getBlur} = useInput(['wallCode'])
    const audio = messageAudio
    const [getWallCode, setWallCode] = useAction()

    useEffect(() => {
        getFocus('wallCode')
        isDistroy = false
        if (code) {
          setValue('wallCode', code);
          onScan()
        }
        return () => {
          isDistroy = true
          setWallCode(null)
        }
    }, [])
    // 切换至人工PTL墙
    function onTap() {
      Dialog.confirm({
        title: '切换播种模式',
        content: '是否切换为人工播种模式?',
        onOk: () => {
          window.Router.push('/flashSowHander', { code: getValue('wallCode')})
        }
      })
    }
    const getWeightNum = (str) => {
        if (!str) return ''
        str = String(str)
        return <span>{str.slice(0, -4)}<b style={{marginLeft: px2rem(10), fontWeight: 'bold'}}>{str.slice(-4)}</b></span>
    }
    async function onScan() {
        if (!getWallCode()) {
          // 查询墙信息
          const wallCode = getValue('wallCode')
          getData(wallCode, 1);
          setValue('wallCode', '');
          getFocus('wallCode');
        } else {
          // 扫描大包号
          const wallCode = getWallCode()
          const scanRfIdNo = getValue('wallCode')
          getSelect('wallCode')
          try {
            await getScanBigPackage({
              wallCode,
              scanRfIdNo,
              warehouseId: getWid(),
              equipmentType: '2',
            })
            audio.success(1)
            await getData(wallCode, 1)
          } catch(e) {
            audio.error()
            window.log(e)
            Message.error(e.message || e)
          }
        }
    }
    async function getData(val, flag) {
        clearTimeout(timer)
        if (isDistroy) {
          console.log('页面被 销毁了======')
          return;
        };
        try {
            const code = val
            const res = await getSearch({
                warehouseId: warehouseId,
                wallCode: val
            })
            if (res && typeof res === 'object') {
                setData(res)
                // 存在异常格口弹窗提示
                if (Array.isArray(res.abnormalPackageList)) {
                  const closeRequest = () => {
                    getAbnormalPackageUpdateCache({
                      warehouseId: getWid(),
                      wallCode: val,
                      deliveryCodeList: res.abnormalPackageList.map(a => a.deliveryCode)
                    })
                  }
                  Dialog.confirm({
                    title: '异常提示',
                    content: <div>
                      {res.abnormalPackageList.map(a => <div>
                        {a.description}
                      </div>)}
                    </div>,
                    closeCountTime: 3000,
                    footer: null,
                    onClose: closeRequest,
                    onOk: closeRequest
                  })
                }
            }
            if (flag) {
                // 缓存墙号
                setWallCode(val);
                setLoading(false)
                setUnBindLoading(false)
                audio.success()
            }
            Message.clear()
        } catch(e) {
            window.log(e)
            if (flag) {
                audio.error()
            }
            Message.error(e.message || e)
        } finally {
          timer = setTimeout(() => {
              getData(val)
              clearTimeout(timer)
          }, 5000)
        }
    }
    // 解除绑定
    const enableUnBindingWaveList = data && Array.isArray(data.bindingWaves) && data.bindingWaves.map(b => ({
      label: b.currentBindingWaveNo + " （" + (b.scannedPackageNum || 0) + "/" + (b.totalPackageNum || 0) + ")", 
      value: b.currentBindingWaveNo
    })).filter(f => f.value) || []
    async function getUnBind() {

      const wallCode = getWallCode()
      let currentBindingWaveNo = data.bindingWaves[0].currentBindingWaveNo || ''
      await Dialog.confirm({
        title: '选择需要解绑的波次',
        isPx2rem: true,
        content: <div>
          <RadioGroup dataSource={enableUnBindingWaveList} value={[currentBindingWaveNo]} onChange={(d) => {currentBindingWaveNo = d[0]}}></RadioGroup>
        </div>,
        onOk: async() => {
          setUnBindLoading(true)
          setUnBindText(unBindBtn['loading'])
          try {
              await getUnBindSubmit({
                  warehouseId: warehouseId,
                  waveCode: currentBindingWaveNo || '',
                  allotWallCode: wallCode,
              })
              getData(wallCode)
          } catch(e) {
              window.log(e)
          }
          setUnBindLoading(false)
          setUnBindText(unBindBtn['start'])
        }
      })


    }

    // 完成播种
    const getFinish = async (flag) => {
        const wallCode = getWallCode()
        let currentSelectWaveNo = data.bindingWaves[0].currentSortingWaveNo || ''
        await Dialog.confirm({
          title: '选择需要完结的波次',
          isPx2rem: true,
          content: <div>
            <RadioGroup dataSource={data.bindingWaves.map(b => ({
              label: b.currentSortingWaveNo + " （" + (b.scannedPackageNum || 0) + "/" + (b.totalPackageNum || 0) + ")", 
              value: b.currentSortingWaveNo
            }))} value={[currentSelectWaveNo]} onChange={(d) => {currentSelectWaveNo = d[0]}}></RadioGroup>
          </div>,
          onOk: async() => {
            const item = data.bindingWaves.find(b => b.currentSortingWaveNo == currentSelectWaveNo) || {}
            if (!flag && item.scannedPackageNum !== item.totalPackageNum) {
                Dialog.confirm({
                    isPx2rem: true,
                    content: <div>
                        <p style={{ fontSize: px2rem(40)}}>是否继续完成波次【{currentSelectWaveNo}】？</p>
                        <p style={{color: '#f00',marginTop: px2rem(10)}}>有其它大包/异形件未播种!</p>
                        <p>完成后未播种的一段单全部标记少货</p>
                    </div>,
                    okText: '播种完成',
                    onOk: getSubmitC,
                })
            } else {
              getSubmitC()
            }
            async function getSubmitC() {
              try {
                setLoading(true)
                setBtnText(submitBtn['loading'])
                await getSubmit({
                    warehouseId: warehouseId,
                    waveCode: currentSelectWaveNo ||'',
                    allotWallCode: wallCode,
                    markLostPackages: data.unCompletePackages
                })
                audio.success()
                // Message.clear()
              } catch(e) {
                  Dialog.confirm({
                      isPx2rem: true,
                      content: <div style={{color: '#f00'}}>
                          {e.message || e}
                      </div>
                  })
                  // Message.error(e.message || e)
                  audio.error()
              } finally {
                  setLoading(false)
                  setBtnText(submitBtn['start'])
                  getData(wallCode)
              }
            }
          }
        })

    }
    return <div>
    <div className="flashSowBigPackage">
        <div className="fls-left fls-box">
            <div className="fl-title">
              播种中
            </div>
            <div className="fl-content">
                <div className={`fl-active`}>
                    {!isEmpty(data.sortingBigBags) && Array.isArray(data.sortingBigBags) && <>
                        {data.sortingBigBags.map((item, index) => {
                            const hasScan = item.waveBigBags && Array.isArray(item.waveBigBags[0]) && item.waveBigBags[0] || []
                            const waitScan = item.waveBigBags && Array.isArray(item.waveBigBags[1]) && item.waveBigBags[1] || []
                            return <ul className='finash' key={index}>
                              <li>
                                <div>库位号：{item.rebatchPosition || '-'}</div>
                                <div>未扫描:</div>
                                {waitScan.map((m, i) => <div style={{textIndent: px2rem(10)}} key={i}>{m}</div>)}
                                <div>已扫描：</div>
                                {hasScan.map((m, i) => <div style={{textIndent: px2rem(10)}} className='main-color' key={i}>{m}</div>)}
                              </li>
                            </ul>
                        })}
                    </> || <span className='lat-no-data'>暂无数据</span>}
                </div>
                <div className="fl-title">待播种大包号</div>
                <div className="fl-visible">
                    {!isEmpty(data.waitSortBigBags) && Array.isArray(data.waitSortBigBags) && <div>
                        {data.waitSortBigBags.map(({ rebatchPosition, containers }, index) => {
                            return <ul className='finash' key={index}>
                            <li><span className="name">波次库位：</span> {rebatchPosition}</li>
                            <li><span className="name">容器号：</span></li>
                            {Array.isArray(containers) && containers.map((i, k) => {
                                return <li key={k} style={{textIndent: px2rem(10)}}>{i}</li>
                            })}
                            </ul>
                        })}
                    </div> || <span className='lat-no-data'>暂无数据</span>}
                </div>
            </div>
        </div>
        <div className="fls-right fls-box">
            <div className='fr-button'>
                <div className='fr-input'>
                  <Input
                      style={{boxShadow: `0 ${px2rem(-1)} ${px2rem(8)} #ccc inset`}}
                      ref={refs['wallCode']}
                      label={getWallCode() ? '扫描大包号' : '扫描分拣墙号'}
                      onEnter={onScan}
                      className='px2rem'
                  ></Input>
                </div>
                <Button className='px2rem' style={{borderRadius: px2rem(30)}} disabled={loading} onClick={() => getFinish()}>{btnText}</Button>
                <Button
                    className='px2rem'
                    style={{borderRadius: px2rem(30)}}
                    disabled={unBindLoading || isEmpty(enableUnBindingWaveList)}
                    onClick={() => getUnBind()}
                >{unBindText}</Button>
            </div>
            <div className="fr-top">
                <div className="fr-left">
                    <div className="small">当前绑定波次</div>
                    {Array.isArray(data.bindingWaves) && data.bindingWaves.map((b,index) => {
                      return <div key={index}>{b.currentBindingWaveNo || '--'}</div>
                    })}
                </div>
                <div className="fr-left">
                    <div className="small">当前播种波次</div>
                    {Array.isArray(data.bindingWaves) && data.bindingWaves.map((b,index) => {
                      return <div key={index}>{b.currentSortingWaveNo || '--'}</div>
                    })}
                </div>
                <div className="fr-num">
                    <div className="small">所占格口数</div>
                    {Array.isArray(data.bindingWaves) && data.bindingWaves.map((b,index) => {
                      return <div key={index}>{b.sortingSlotNum || '--'}</div>
                    })}
                </div>
                <div className="fr-right">
                    <div className="small">已扫描/波次包裹总数</div>
                    {Array.isArray(data.bindingWaves) && data.bindingWaves.map((b,index) => {
                      return <div key={index}>
                        <span className="main-color">{b.scannedPackageNum || 0}</span>/{b.totalPackageNum || 0}
                      </div>
                    })}
                </div>
                <div className="fr-num">
                    <div className="small">已播种订单数</div>
                    {Array.isArray(data.bindingWaves) && data.bindingWaves.map((b,index) => {
                      return <div key={index}>{b.scannedOrderNum || '--'}</div>
                    })}
                </div>
            </div>
            <div className="fr-content">
                <div className="fr-title table-tr">
                    <div className='content-cell small'>
                       <div className='fr-tab-title'>待播种单号</div> 
                      {getWallCode() && <Button disabled className='px2rem' style={{
                        borderRadius: px2rem(10), fontSize: px2rem(20),
                        marginLeft: px2rem(70), background: '#f4f4f4'
                      }}>播种墙号：<b>{getWallCode()}</b></Button> || null}
                    </div>
                    <div className='content-cell small'>
                        <div className='fr-tab-title'>容器号</div>
                        {getWallCode() && <Button disabled className='px2rem' style={{
                        borderRadius: px2rem(10), fontSize: px2rem(20),
                        marginLeft: px2rem(70), background: '#f4f4f4'
                      }}>分拣机空闲格口数量：<b>{data.remainingSlotCount || '-'}</b></Button>}
                    </div>
                </div>
                <Message className="fr-box px2rem">
                    {!isEmpty(data.waitSortPackages) && <ul>
                        {Object.entries(data.waitSortPackages).map(([key, value], index) => {
                            return <li key={index} className="table-tr">
                                <div className='content-cell'>{getWeightNum(key)}</div>
                                <div className='content-cell'>{value}</div>
                            </li>
                        })|| null}
                    </ul> || <span className='lat-no-data'>暂无数据</span>}
                </Message>
            </div>
        </div>
    </div>
    <DragBox className="px2rem wallIconDrag" right={px2rem(10)} bottom={px2rem(60)}>
      <DragBox.Child onClick={onTap}>
        <Icon type="big-putin" style={{color: '#666', fontSize: px2rem(45)}}></Icon>
      </DragBox.Child>
    </DragBox>
    </div>
}
