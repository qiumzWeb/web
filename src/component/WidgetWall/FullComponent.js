import React, { useState, useEffect, useRef } from 'react';
import {Button, Input, Icon, Message, Select } from '@/component';
import { getGroupName, softPtlListByGroup, getSoftWall } from './api';
import { useSetTimer } from 'assets/js/ahooks';
import { isEmpty } from 'assets/js';

// 默认闪电播墙
const defaultGroup = 'FLOWPICK_EXCEPTION'
let getWallGroupName = Promise.resolve(defaultGroup)
let getWallList = Promise.resolve([])


const {useReset, useInput, useRefresh, useAction} = React
export default function Component(props) {
  const { sortStatus, code } = props
  const {getValue, setValue, refs, getFocus, getBlur, getSelect} = useInput(['wallCode'])
  const [getWallCode, setWallCode] = useAction('flashSowFullSort')
  const [listData, setListData] = useState([])
  const [selectWallCode, setSelectWallCode] = useState()
  const [wallOptions, setWallOptions] = useState([])

  // 初始化数据
  useEffect(() => {
    getFocus('wallCode')
    getWall()
    getWallGroupNameType()
    // 自动带入
    if (code) {
      onWallSelect(code)
    }
    return () => {
      setWallCode(null)
    }
  }, [])

  // 重置页面
  useReset(() => {
      getFocus('wallCode')
      setWallCode(null)
    // }
  }, [])

  // 5秒刷新一次
  useSetTimer(loadData, 5000)

  // 获取 墙
  function getWall() {
    getWallList = getSoftWall().then(data => {
      const list = Array.isArray(data) && data.map(d => ({
        label: d,
        value: d
      })) || [];
      setWallOptions(list)
      return list;
    }).catch(e => []);
    return getWallList;
  }
  // 获取墙组类型
  function getWallGroupNameType() {
    getWallGroupName = getGroupName().then(data => {
      const list = Array.isArray(data) && data || []
      const flowPickList = list.filter(l => /^FLOWPICK\_/.test(l))
      return flowPickList[0] || defaultGroup
    }).catch(e => {
      return defaultGroup
    });
    return getWallGroupName;
  }
  // 初始化
  // 加载格口数据
  async function loadData(isInit) {
    const wallCode = getWallCode()
    isInit && Message.success('请求数据中...', false)
    const groupName = await getWallGroupName
    if (wallCode && groupName) {
      softPtlListByGroup({
        wallCode,
        groupName
      })
      .then(res => {
        // 首次请求时， 播放请求成功提示音
        Message.success(null, !!isInit)
        const newList = []
        let i = 0
        let list = []
        if (Array.isArray(res)) {
          list = res
        } else {
          list = res && Array.isArray(res.oftSortWallList) && res.oftSortWallList || []
        }
        // while(list.length < 120) {
        //   list.push({
        //     "slotCode": list.length + 1,
        //     "portNo": null,
        //     "portStatus": null,
        //     "slotStatus": 0,
        //     "slotColor": null,
        //     "flowPickSlotCode": null,
        //     "sortWallCode": null,
        //     "orderId": null
        //   })
        // }
        // list.sort((a, b) => a.slotCode - b.slotCode)
        list.forEach(l => {
          isEmpty(newList[i]) && (newList[i] = []);
          newList[i].length < 15 && newList[i].push(l);
          newList[i].length === 15 && ++i;
        })
        setListData(newList)
        Message.clear()
      })
      .catch(err => {
        Message.error(err.message || err, !!isInit)
      })
    }
  }

  // 分拣墙选择
  function onWallSelect(val) {
    setValue('wallCode', val)
    setSelectWallCode(val)
    onSearch()
  }
  // 扫描分拣墙
  function onSearch() {
    const wallCode = getValue('wallCode')
    if (wallCode) {
      getSelect('wallCode')
      setWallCode(wallCode)
      loadData(true);
      document.body.click();
    }
  }

  return <div>
    <div style={{ display: 'flex' }}>
      {/* <Select dataSource={wallOptions} style={{flex: 1}} mr="10" value={selectWallCode} onChange={onWallSelect} hasClear> */}
        <Input className='px2rem' ref={refs['wallCode']}
          style={{ flex: 1 }}
          // show={false}
          onEnter={onSearch}
          label="分拣墙"
          placeholder="请扫描/选择分拣墙号"
        ></Input>
      {/* </Select> */}
      <Button className='px2rem' onClick={onSearch}>提交</Button>
    </div>
    <Message className="px2rem">
    <div style={{
      margin: `${px2rem(10)}`
    }}>
      <div className="sortgridgroup">
        {listData.map((list, index) => {
          return <div className='sortGridCell' key={index}>
            {list.map((d, key) => {
              const color = sortStatus[d.slotStatus] || 'empty'
              return <div key={key}
                className={`sortcell ${color}`}
              >{d.slotCode}</div>
            })}
          </div>
        })}
      </div>
    </div>
    </Message>
  </div>
}