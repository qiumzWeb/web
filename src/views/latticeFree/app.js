import React, { useEffect, useState, useRef} from 'react'
import { Button, Input, Table, Dialog, KeyBoard,TextBox, Message } from '@/component'
import { getSearch } from './api'
import { localStore, Cookie, isType, onEnter, PowWeight, Print } from 'assets/js/utils'
require('./scss/px2rem.scss')
import {messageAudio} from 'assets/js'
const {useReset, useInput, useRefresh, useAction} = React
// 仓ID
const warehouseId = Cookie.get('warehouseId')
let timer = null
let isDistory = true
// 生成页面
App.title = '格口释放'
export default function App(props) {
    const [data, setData] = useState({})
    const {getValue, getSelect, refs, getFocus, getBlur} = useInput(['wallCode'])
    const audio = messageAudio
    useEffect(() => {
      getFocus('wallCode')
      isDistory = false
      return () => {
        isDistory = true
      }
    }, [])
    const getNumList = () => {
        return isType(data) === 'Object' && data || {}
    }
    function onScan() {
        getData(getValue('wallCode'), 1)
        getSelect('wallCode')
    }
    async function getData(val, flag) {
        clearTimeout(timer)
        if (isDistory) {
          console.log('页面被 销毁了======')
          return;
        };
        try {
            const res = await getSearch({
                warehouseId: warehouseId,
                wallCode: val
            })
            if (res && typeof res === 'object') {
                setData(res)
            }
            if (flag) {
                audio.success()
            }
            Message.clear()
        } catch(e) {
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
    const listMap = getNumList().showData || []
    const slotOutTimeMap = getNumList().slotOutlist || []
    const flowslotOutTimeMap = getNumList().flowSlotOutlist || []
    const sfOutTimeMap = getNumList().zuheOutlist || []
    return <div className="latticeFree">
        <div className="lat-left lat-box">
            <div className="lat-l-top">
                <div style={{width: px2rem(400)}}>播种墙格口号</div>
                <div className='fr-input'><Input
                    style={{boxShadow: `0 ${px2rem(-1)} ${px2rem(8)} #ccc inset`}}
                    ref={refs['wallCode']} placeholder="请扫描播种墙号"
                    onEnter={onScan}
                    className="px2rem"
                ></Input></div>
            </div>
            <div className="lat-l-content">
                <Message className="num-list px2rem">
                    {listMap.length && listMap.map((n, index) => {
                        return <div key={index} className={`num-cell active_${n.slotColor}`}>
                            <p style={{marginBottom: px2rem(20)}}>{n.slotCode}</p>
                            <p style={{fontSize: px2rem(44)}}>{n.flowPickSlotCode || ''}</p>
                        </div>
                    }) || <span className='lat-no-data'>暂无数据</span>}                  
                </Message>
            </div>
        </div>
        <div className="lat-right lat-box">
            <div className="lat-r-top">即将超时订单</div>
            <div className="lat-r-content">
                <div className="lat-r-num">
                    <p>人工播种墙</p>
                    <div className="lat-num-box">
                        <TextBox>{
                            slotOutTimeMap.length && slotOutTimeMap.map(n => {
                                return n
                            }).join('，') || <span className='lat-no-data'>暂无数据</span>
                        }
                        </TextBox>
                    </div>
                </div>
                <div className="lat-r-num">
                    <p>自动播种墙</p>
                    <div className="lat-num-box">
                        <TextBox>{
                            flowslotOutTimeMap.length && flowslotOutTimeMap.map(n => {
                                return n
                            }).join('，') || <span className='lat-no-data'>暂无数据</span>
                        }
                        </TextBox>
                    </div>

                </div>
                <div className="lat-r-num">
                    <p>组合订单</p>
                    <div className="lat-num-box">
                        <TextBox>{
                            sfOutTimeMap.length && sfOutTimeMap.map(n => {
                                return `(${n})`
                            }).join('，') || <span className='lat-no-data'>暂无数据</span>
                        }
                        </TextBox>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

