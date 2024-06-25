import React,{ useEffect, useState, useRef } from 'react'
import { Button, Input, Table, Dialog, KeyBoard, Message } from '@/component'
import { getSearch, getSubmit, getUnBindSubmit } from './api'
import { localStore, Cookie, isType, onEnter, PowWeight, Print } from 'assets/js/utils'
import { isEmpty, messageAudio } from 'assets/js'
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
App.title = '播种(闪)'
export default function App(props) {
    const [data, setData] = useState({})
    const [btnText, setBtnText] = useState(submitBtn['start'])
    const [unBindText, setUnBindText] = useState(unBindBtn['start'])
    const [loading, setLoading] = useState(true)
    const [unBindLoading, setUnBindLoading] = useState(false)
    const {getValue, getSelect, refs, getFocus, getBlur} = useInput(['wallCode'])
    const audio = messageAudio
    useEffect(() => {
        getFocus('wallCode')
        isDistroy = false
        return () => {
          isDistroy = true
        }
    }, [])
    const getWeightNum = (str) => {
        if (!str) return ''
        str = String(str)
        return <span>{str.slice(0, -4)}<b style={{marginLeft: px2rem(10), fontWeight: 'bold'}}>{str.slice(-4)}</b></span>
    }
    function onScan() {
        getData(getValue('wallCode'), 1)
        getSelect('wallCode')
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
            }
            if (flag) {
                setLoading(false)
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
    async function getUnBind() {
        const { sowedTotal, total, sowingWave, ucsBindingWave } = data
        setUnBindLoading(true)
        setUnBindText(unBindBtn['loading'])
        const wallCode = getValue('wallCode')
        try {
            await getUnBindSubmit({
                warehouseId: warehouseId,
                waveCode: ucsBindingWave || '',
                allotWallCode: wallCode,
            })
            getData(wallCode)
        } catch(e) {
            window.log(e)
        }
        setUnBindLoading(false)
        setUnBindText(unBindBtn['start'])
    }
    // 完成播种
    const getFinish = async (flag) => {
        const { sowedTotal, total, sowingWave } = data
        const wallCode = getValue('wallCode')
        if (!flag && sowedTotal !== total) {
            Dialog.confirm({
                isPx2rem: true,
                content: <div>
                    <p style={{ fontSize: px2rem(40)}}>是否继续完成？</p>
                    <p style={{color: '#f00',marginTop: px2rem(10)}}>有其它大包/异形件未播种!</p>
                    <p>完成后未播种的一段单全部标记少货</p>
                </div>,
                okText: '播种完成',
                onOk: async () => {getFinish(1)},
            })
        } else {
            try {
                setLoading(true)
                setBtnText(submitBtn['loading'])
                await getSubmit({
                    warehouseId: warehouseId,
                    waveCode: sowingWave||'',
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
    const waitContainers = Object.entries(data.waitContainers || {})
    waitContainers.sort((a, b) => b[1] - a[1])
    return <div>
    <div className="flashSow">
        <div className="fls-left fls-box">
            <div className="fl-title">可播种容器号</div>
            <div className="fl-content">
                <div className="fl-active">
                    {!isEmpty(data.waitContainers) && <ul>
                        {waitContainers.map(([key, val]) => {
                            return <li key={key} className={val == 1 && 'active' || ''}>{key}</li>
                        })}
                    </ul> || <span className='lat-no-data'>暂无数据</span>}
                </div>
                <div className="fl-visible">
                    {!isEmpty(data.finshContainers) && <div>
                        {Object.values(data.finshContainers).map((item, index) => {
                            return <ul className='finash' key={index}>
                            {Array.isArray(item) && item.map((i, k) => {
                                return <li key={k}>{i}</li>
                            })}
                            </ul>
                        })}
                    </div> || <span className='lat-no-data'>暂无数据</span>}
                </div>
            </div>
        </div>
        <div className="fls-right fls-box">
            <div className='fr-button'>
                <div className='fr-input'><Input
                    width={px2rem(80)}
                    style={{boxShadow: `0 ${px2rem(-1)} ${px2rem(8)} #ccc inset`}}
                    ref={refs['wallCode']} placeholder="请扫描播种墙号"
                    onEnter={onScan}
                    className='px2rem'
                ></Input></div>
                <Button className='px2rem' style={{borderRadius: px2rem(30)}} disabled={loading || !data.sowingWave} onClick={() => getFinish()}>{btnText}</Button>
                {data.ucsBindingWave && data.sowingWave !== data.ucsBindingWave && <Button
                    className='px2rem'
                    style={{borderRadius: px2rem(30)}}
                    disabled={unBindLoading || (data.sowingWave === data.ucsBindingWave)}
                    onClick={() => getUnBind()}
                >{unBindText}</Button>}
            </div>
            <div className="fr-top">
                <div className="fr-left">
                    <div className="small">当前绑定波次</div>
                    <div>{data.ucsBindingWave || '--'}</div>
                </div>
                <div className="fr-left">
                    <div className="small">当前播种波次</div>
                    <div>{data.sowingWave || '--'}</div>
                </div>
                <div className="fr-right">
                    <div className="small">已扫描/波次包裹总数</div>
                    <div><span className="main-color">{data.sowedTotal || 0}</span>/{data.total || 0}</div>
                </div>
            </div>
            <div className="fr-content">
                <div className="fr-title table-tr">
                    <div className='content-cell'>待播种单号</div>
                    <div className='content-cell'>容器号</div>
                </div>
                <Message className="fr-box px2rem">
                    {!isEmpty(data.offShelvesPackageDOS) && <ul>
                        {Array.isArray(data.offShelvesPackageDOS) && data.offShelvesPackageDOS.map((item, index) => {
                            return <li key={index} className="table-tr">
                                <div className='content-cell'>{getWeightNum(item.deliveryCode)}</div>
                                <div className='content-cell'>{item.containerCode}</div>
                            </li>
                        })|| null}
                    </ul> || <span className='lat-no-data'>暂无数据</span>}
                </Message>
                
            </div>
        </div>
    </div>
    </div>
}
