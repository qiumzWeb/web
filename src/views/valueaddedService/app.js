import React, {useEffect, useState, useRef} from 'react'
import { Button, Input, Table, Dialog, KeyBoard, Card } from '@/component'
import { getSearch, getSubmit, typeOptions } from './api'
import { localStore, Cookie, isType, onEnter, PowWeight, Print } from 'assets/js/utils'
import { isEmpty, sleepTime } from 'assets/js'

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



require('./scss/index.scss')
// 仓ID
const warehouseId = Cookie.get('warehouseId')
const defaultInput = {value: '', focus(){}, click(){}}
// 体积
const vs = {
    orderCode: defaultInput,
    weight: defaultInput,
    length: defaultInput,
    width: defaultInput,
    height: defaultInput
}
// 服务类型
const serviceType = {settlementCode: '', usageAmount: ''}
//// 电子称重
const POWWT = new PowWeight()
// 生成页面
App.title = "增值服务"
export default function App(props) {
    const [visible, setVisible] = useState(false)
    const [btnLoading, setBtnLoading] = useState(false)
    const [volumsInputs, setVolumsInputs] = useState(null)
    const [serviceTypeList, setServiceTypeList] = useState([{...serviceType}])
    const [serviceTypeOptions, setServiceTypeOptions] = useState([])
    const [selectType, setSelectType] = useState({})
    const VolumsRef = useRef()
    const vRefs = {}
    Object.keys(vs).forEach(k => {
        vRefs[k] = useRef()
    })
// 初始化数据
    useEffect(() => {
      checkJobCode()
        // 普通电子称 实时获取称重
        POWWT.getWeight(val => {
            vRefs['weight'].current && (vRefs['weight'].current.value = val)
        })
        setVolumsInputs(VolumsRef && VolumsRef.current)
        getInput('orderCode').focus()
        getSearch().then(data => {
            setServiceTypeOptions(data || [])
        }).catch(e => {})
        return () => {
          finishVideoRecord()
        }
    }, [])
// 获取输入框
    function getInput(name) {
        return vRefs[name].current
    }
// 扫描包裹号
    function onScan (e) {
        const value = e?.target?.value || getInput('orderCode').value || '';
        startVideoRecord(value)
        // 天机设备获取体积重量
        POWWT.getVolumeAndWeight(value, function(data) {
            if (data) {
                Object.entries(vRefs).forEach(([key, val]) => {
                    if (['weight', 'height', 'length', 'width'].includes(key)) {
                        val.current && (val.current.value = data[key])
                    }
                })
            }
        }, Message)
        getInput('weight').focus()
    }
// 重置页面
    function resetData() {
        Object.keys(vRefs).forEach(key => {
            getInput(key).value = ''
        })
        serviceTypeList.forEach(s => s.input && (s.input.value = ''))
        setServiceTypeList([{...serviceType}])
        Message.clear()
        getInput('orderCode').focus()
        finishVideoRecord()
    }
// 获取数据
    const getV = () => {
        const d = {}
        Object.keys(vs).forEach(k => {
            d[k] = vRefs[k].current.value
        })
        return d
    }
    // 选择确认
    const onOk = async () => {
        const selected = Object.values(selectType).map(m => ({...m}))
        if (isEmpty(selected)) {
            selected.push({...serviceType})
        }
        setServiceTypeList(selected)
        setVisible(false)
    }
    // 提交
    async function submit() {
        const typeList = serviceTypeList.map(m => ({settlementCode: m.settlementCode, usageAmount: m.input.value}))
        const inputData = getV()
        Message.clear()
        if (Object.entries(vRefs).some(([key, input]) => {
            if (isEmpty(inputData[key])) {
                Message.error(input.current.attributes.label.value + '不能为空')
                input.current.focus()
                return true
            }
            return false
        })) return
        if (typeList.some(s => {
            const errorMsg = {
                settlementCode: '增值服务类型不能为空',
                usageAmount: '使用量不能为空'
            }
            for(let key in s) {
                if (isEmpty(s[key])) {
                    Message.error(errorMsg[key])
                    return true
                } else if (
                    key === 'usageAmount' &&
                    !(/^[1-9][0-9]*$/.test(s[key]) && +s[key] <= 100)
                ) {
                    Message.error('使用量输入格式有误，必须是1 ~ 100的正整数')
                    return true
                }
            }
            return false
        })) return
        const postData = {
            ...inputData,
            addedServicesItems: typeList
        }
        Message.info('正在提交数据...')
        setBtnLoading(true)
        try{
            await getSubmit(postData)
            // await sleepTime(1000)
            Message.success('操作成功')
            resetData()
        } catch(e) {
          finishVideoRecord()
            Message.error(e.message || e)
        }
        setBtnLoading(false)
    }
    return <div className="valueAddedService">
        <Card>
        <div slot="content">
            <Input label="包裹号" ref={vRefs['orderCode']} onEnter={onScan}></Input>
            <Input label="包裹重量(KG)" ref={vRefs['weight']} style={{marginTop: 10}} onEnter={onScan}></Input>
            <div style={{color: '#fff', margin: '10px 0'}}>包裹体积：</div>
            <KeyBoard
                inputContainer={volumsInputs}
            >
                <div className="inputbox" ref={VolumsRef}>
                    <Input label="长(CM)" width="80px" ref={vRefs['length']}></Input>
                    <Input label="宽(CM)" width="80px" ref={vRefs['width']}></Input>
                    <Input label="高(CM)" width="80px" ref={vRefs['height']}></Input>
                </div>
            </KeyBoard>
            <ul style={{margin: "10px 0"}}>
                {serviceTypeList.map((s, i) => {
                    return <li key={i} style={{marginBottom: 10, display: 'flex'}}>
                        <Input label="增值服务类型" style={{width: '55%', cursor: 'pointer'}} onClick={() => {
                            setSelectType(serviceTypeList.reduce((a, b) => {
                                if (b.settlementCode) {
                                    a[b.settlementCode] = b
                                }
                                return a
                            }, {}))
                            setVisible(true)
                        }}>
                            {s.settlementCode
                                ? <span>{`${s.serviceType || ''}-${s.serviceItem || ''}`}</span>
                                : <span style={{color: '#999'}}>点击添加服务类型</span>
                            }
                        </Input>
                        <Input label="使用量" placeholder='请输入' style={{width: '30%'}} ref={ref => {
                            s.input = ref
                            s.input && (s.input.value = s.inputValue || '')
                        }} onInput={(e) => {
                            s.inputValue = e.target.value
                        }}></Input>
                        {serviceTypeList.length > 1 && <Button onClick={() => {
                            const data = [...serviceTypeList]
                            data.splice(i, 1)
                            setServiceTypeList(data)
                        }}>删除</Button>}
                    </li>
                })}
            </ul>
            {/* <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                <div>
                    
                </div>
            </div> */}
        </div> 
        <div slot="btnTools" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <div className="btnbox">
            <Button onClick={submit} disabled={btnLoading}>提交</Button>
            </div>
        </div>
        </Card>
        <Dialog
            title="选择增值服务类型（可多选）"
            style={{ width: '100%', height: '100%' }}
            visible={visible}
            onClose={() => { setVisible(false) }}
            onCancel={() => { setVisible(false) }}
            onOk={onOk}
        >
            <div className='serviceTypeList'>
                {serviceTypeOptions.map((s, index) => {
                    return <div key={index} className={`typeCell ${selectType[s.settlementCode] && 'active' || ''}`} onClick={() => {
                        const data = {...selectType}
                        if (data[s.settlementCode]) {
                            delete data[s.settlementCode]
                        } else {
                            data[s.settlementCode] = s
                        }
                        setSelectType(data)
                    }}>{`${s.serviceType}-${s.serviceItem}`}</div>
                })}
            </div>
        </Dialog>
    </div>
}
