import React, {useRef, useEffect, useState} from 'react'
import {Button, Input, Icon, DragBox} from '@/component'
import { getGroupName, getSoftWall, softPtlListByGroup } from './api'
import { Bus, onEnter, Cookie } from 'assets/js/utils'
// 定时器
let timers = '';
const sortWallCode = 'sortWallCode_' + Cookie.get('warehouseId');
const sortWallGroupName = 'sortWallCodeGroupName_' + Cookie.get('warehouseId');
// 生成页面
export default function App(props) {
  const { 
    sortStatus
   } = props
  const [show, setShow] = useState(false)
  const [wall, setWall] = useState([])
  const [sortNum, setSortNum] = useState([])
  const [selectList, setSelectList] = useState([])
  const [wallCode, setWallCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [status, setStatus] = useState(1)
  const [showSelect, setShowSelect] = useState(false)
  const [resSuccess, setReSuccess] = useState(true)
  const [message, setMessage] = useState('')
  const [listData, setListData] = useState([])
  const [listColumn, setListColumn] = useState(4)
  const wallInputRef = useRef()
  const Message = {
    error: (msg) => {
      setReSuccess(false)
      setMessage(msg)
    },
    success: (msg, status = 1) => {
      setReSuccess(status)
      setMessage(msg)
    }
  }
  // 获取 墙
  const getWall = () => {
    getSoftWall().then(data => {
      const list = Array.isArray(data) && data || []
      list.unshift('请选择')
      setWall(list)
    })
  }
  // 获取 格口
  const getSort = () => {
    getGroupName().then(data => {
      const list = (Array.isArray(data) && data || []).filter(f => !/^FLOWPICK\_/.test(f))
      setSortNum(list)
    })
  }
  // 加载格口数据
  const loadData = (isRefresh) => {
    timers = null
    if (wallCode && groupName) {
      !isRefresh && Message.success('请求数据中...')
      softPtlListByGroup({
        wallCode,
        groupName
      })
      .then(res => {
        setReSuccess(2)
        let list = []
        // 老格式兼容代码
        if (Array.isArray(res)) {
          const columnConfig = {
            A: 4,
            B: 5
          }
          setListColumn(columnConfig[groupName] || 4)
          list = res
        } else {
          // 新版本数据格式
          setListColumn(res && !isNaN(res.column) && res.column || 4)
          list = res && Array.isArray(res.oftSortWallList) && res.oftSortWallList || []
        }
        setListData(list)
      })
      .catch(err => {
        Message.error(err.message || err)
      })
      .finally(() => {
        // 5秒刷新一次数据
        timers = setTimeout(() => {
          clearTimeout(timers)
          loadData(true)
        }, 5000)
      })
    }
  }
  // 分拣墙扫描框自动聚焦
  const wallInputFocus = () => {
    setTimeout(() => {
      wallInputRef.current.focus()
    }, 23)
  }
  // 扫描事件
  const onScan = () => {
    const InputValue = wallInputRef.current && wallInputRef.current.value
    setWallCode(InputValue)
    Cookie.set(sortWallCode, InputValue, {hour: 30* 24})
    if (!groupName) {
      setStatus(2)
      setSelectList(sortNum)
    } else {
      setShowSelect(false)
    }
    wallInputRef.current.value = ''
  }
  // 自动启动墙
  function CheckAutoShowWall() {
    const code = Cookie.get(sortWallCode);
    const name = Cookie.get(sortWallGroupName)
    if (code && name) {
      onOpen()
      setGroupName(name);
      setWallCode(code);
      Cookie.set(sortWallCode, code, {hour: 30* 24});
      Cookie.set(sortWallGroupName, name, {hour: 30* 24})
    }
  }
  // 清楚缓存
  function ClearWallCache() {
    Cookie.del(sortWallCode);
    Cookie.del(sortWallGroupName);
  }
  // 关闭
  function onClose() {
    ClearWallCache()
    setShow(false)
  }
  // 打开
  function onOpen() {
    setShow(true)
  }
  // 初始化
  useEffect(() => {
    getWall()
    getSort()
    function domClick() {
      setShowSelect(false)
    }
    // 检查自启
    CheckAutoShowWall()
    document.addEventListener('click', domClick, false)
    return () => {
      document.removeEventListener('click', domClick, false)
      clearTimeout(timers)
    }
  }, [])
  useEffect(() => {
    clearTimeout(timers)
    loadData()
    Bus.$emit('getInstance', {
      refresh: loadData
    })
  }, [wallCode, groupName])

  return <div>
    {!show && <div className="wallIcon" onClick={onOpen}>
      <Icon type="big-putin"></Icon>
    </div>}
    {show && <DragBox right={px2rem(window.innerWidth/2 - 207) } bottom={px2rem(100)}>
      <div style={{width: px2rem(414), minHeight: px2rem(540), background: '#333'}}>
        <div className="wallbtn" style={{height: px2rem(60), display: 'flex'}}>
          <Button mr={px2rem(2)} style={{minWidth: 0, ...(wallCode ? {fontSize: px2rem(22), lineHeight: px2rem(26), textAlign: 'center', flex: 1} : {})}}
            className={(status === 1 && showSelect && 'secondary' || '') + ' px2rem'}
            onClick={(e) => {
              e.stopPropagation()
              setSelectList(wall)
              setStatus(1)
              setShowSelect(true)
              wallInputFocus()
            }}>
              分拣墙
              {wallCode && <div>{wallCode}</div>}
            </Button>
          <Button mr='2' style={{padding: `0 ${px2rem(14)}`, minWidth: 0}}
            className={(status === 2 && showSelect && 'secondary' || '') + ' px2rem'}
            onClick={(e) => {
              e.stopPropagation()
              setSelectList(sortNum)
              setStatus(2)
              setShowSelect(true)
            }}>显示格口</Button>
          <Button onClick={onClose} style={{minWidth: 0}} className="px2rem">关闭</Button>
        </div>
        <div className="wallbock" style={{position: 'relative'}}>
          {showSelect && status === 1 && <div className="fixed" onClick={(e)=>e.stopPropagation()}><Input
            ref={wallInputRef}
            placeholder="请扫描/输入分拣墙号"
            onKeyPress={onEnter(onScan)}
            className="px2rem"
            style={{borderBottom: `${px2rem(1)} solid #ccc`,boxShadow: `0 ${px2rem(-1)} ${px2rem(8)} #ccc inset`}}
          ></Input></div>}
          {showSelect && <ul className="selectList" onTouchMove={(e)=>e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              {selectList.map((l, key) => {
                return status === 1 ? <li
                  key={key}
                  title={l}
                  className={l === wallCode && 'active' || ''}
                  onClick={(e) => {
                    e.stopPropagation()
                    setWallCode(l)
                    Cookie.set(sortWallCode, l, {hour: 30* 24})
                    setShowSelect(false)
                  }}
                >{l}</li> : <li
                  key={key}
                  title={l}
                  className={l === groupName && 'active' || ''}
                  onClick={(e) => {
                    e.stopPropagation()
                    setGroupName(l);
                    Cookie.set(sortWallGroupName, l, {hour: 30* 24})
                    setShowSelect(false)
                  }}
                >{l}</li>
              })}
          </ul>}
          <div className={`sortList ${!resSuccess ? 'error' : (resSuccess === 1 ? 'success' : '')}`}>
              {resSuccess ? (
                resSuccess === 1 ? message : <div className="sortgroup">
                  {listData.map((d, key) => {
                    const color = sortStatus[d.slotStatus] || 'empty'
                    return <div key={key}
                      className={`sortcell ${color} ${groupName}`}
                      style={{width: `${100 / listColumn}%`}}
                    >{d.slotCode}</div>
                  })}
                </div>
              ) : message}
          </div>
        </div>
      </div>
    </DragBox>}
  </div>
}