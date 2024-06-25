import React, {useState, useEffect, useImperativeHandle} from 'react'
import { useHistory } from 'react-router'
import { Dialog, Button, Message  } from '@/component'
import { setWid, getWid, Cookie, widList, isEmpty, setCEId, getCEId, getCEName, CEIdList, CEIdName, logout, changeCompanyEnterpriseEvent } from 'assets/js'
import Bus from 'assets/js/bus'
import $jsonp from 'assets/js/jsonpAjax'
require('./index.scss')
let wareList = []
export default React.forwardRef(function App(props, ref){
  const [companyList, setCompanyList] = useState([])
  const [warehouseList, setWarehouseList] = useState({})
  const [visible, setVisible] = useState(false)
  const [isClick, setIsClick] = useState(false)
  const [wareHouse, setWareHouse] = useState({})
  const [currentHouse, setCurrentHouse] = useState({})

  // 企业列表
  const [companyEnterpriseList, setCompanyEnterpriseList] = useState([])
  const [currentCompanyEnterprise, setcurrentCompanyEnterprise] = useState({})

  const getTreeKey = (t) => `${t.companyName}_${t.companyId}`
  const history = useHistory()
  useImperativeHandle(ref, () => ({
    open() {
      setVisible(true)
      setIsClick(true)
      getWareHouseList()
    },
    close(){
      onClose()
    }
  }))
  const getTreeWarehouse = (arr) => {
    if (!Array.isArray(arr)) return []
    const tree = {}
    arr.forEach(a => {
      const key = getTreeKey(a)
      if (tree[key]) {
        tree[key].children.push(a)
      } else {
        tree[key] = {
          ...a,
          label: a.companyName,
          value: a.companyId,
          children: [a]
        }
      }
    })
    return tree
  }
  const getWareHouseList = async () => {
    // 获取公司仓库列表
    let res = await Bus.getState('getWarehouseList')
    // console.log(res)
    if (res && Array.isArray(res)) {
      if (!getWid()) {
        setVisible(true)
      }
      wareList = [...res]
      const houseTree = getTreeWarehouse(res)
      const currentHouse = getCurrentWareHouse(res)
      Bus.setState({ houseTree }) // 缓存仓库树
      setCurrentHouse(currentHouse || {label: '选择仓库'})
      setCompanyList(Object.values(houseTree))
      getSelectedWareHouse(houseTree, currentHouse)
    }
  }
  // 设置仓库
  function getCurrentWareHouse (houseList) {
    return houseList.find(d => d.value == getWid())
  }
  // 选择仓库
  function SelectWarehouse (w) {
    setWareHouse(w)
  };
  // 选择公司
  function SelectCompany (w) {
    setWarehouseList(w)
  };
  // 获取已选择的仓库
  function getSelectedWareHouse (houseTree, currentHouse) {
    let wareHouseList = {}
    if (!currentHouse || !currentHouse.companyId) {
      wareHouseList = Object.values(houseTree)[0] || {}
    } else {
      const key = getTreeKey(currentHouse)
      wareHouseList = houseTree[key]
    }
    SelectCompany(wareHouseList)
    SelectWarehouse(currentHouse || {})
  }
  // 确认选择
  function onOk() {
    if (!wareHouse.value) {
      return Message.error('请选择仓库')
    }
    setCurrentHouse({
      ...wareHouse
    })
    if (!getWid()) {
      onClose()
      setWid(wareHouse.value)
      Bus.$emit('routeRefresh')
      Bus.$emit('updateWaterMark')
    } else if (wareHouse.value == getWid()) {
      onClose()
    } else {
      onClose()
      setWid(wareHouse.value)
      window.location.reload()
    }
  }

  /**
   * ============= 选择企业 ===========  
   */

// 获取企业
function getCompanyEnterpriseList() {
  Bus.$on(changeCompanyEnterpriseEvent, (res) => {
    setCompanyEnterpriseList(res)
    setcurrentCompanyEnterprise(res.find(r => r.current) || {})
    Bus.setState({
      [CEIdList]: res
    })
    setVisible(true)
  })
}
// 选择企业
function SelectCompanyEnterprise (w) {
  setCEId(w.value)
  setcurrentCompanyEnterprise(w)
};

// 判断是否需要切换企业
function isChangeCompanyEnterprise() {
  return isEmpty(companyList) && !isEmpty(companyEnterpriseList)
}

// 确认选择企业
async function onChangeCompanyEnterprise() {
  try {
    if (!currentCompanyEnterprise.value) {
      return Message.warning('请选择企业')
    }
    setCEId(currentCompanyEnterprise.value)
    Cookie.set(CEIdName, encodeURIComponent(currentCompanyEnterprise.label))
    await $jsonp({
      url: 'https://cnlogin.cainiao.com/switchEnterprise',
      data: {
        enterpriseId: currentCompanyEnterprise.value
      }
    })
    logout(true)
  } catch(e) {
    Message.error(e.message)
  }
}


/**
 * =============== 企业选择 end ===================
 */

  useEffect(() => {
    getWareHouseList();
    getCompanyEnterpriseList();
  }, [])
  useEffect(() => {
    if (wareHouse.label && visible) {
      Message.clear()
    }
  }, [wareHouse.label])
  function onClose () {
    setIsClick(false)
    setVisible(false)
  }
  return <div>
    <Dialog
      className={!isClick && 'selectwarehouse' || ''}
      title={
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          {isChangeCompanyEnterprise() ? <span>当前企业无法登录集运宝，请在下方选择其它企业登录</span> : <span>选择仓库</span>}
        </div>
      }
      visible={visible}
      style={{width: 1200}}
      footer={<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
        <div style={{padding: '0 0 20px 0', color: '#fff'}}>
          <b>当前选择：</b><Message className='warn-color' style={{
            display: 'inline-block',
          }}>{
            isChangeCompanyEnterprise() ? (
              currentCompanyEnterprise.label || '--'
            ): (wareHouse.label || '--')
          }</Message>
        </div>
        {isChangeCompanyEnterprise() ? <div>
          <Button mr="10" onClick={onChangeCompanyEnterprise}>确定并重新登录</Button>
          <Button className="secondary" onClick={() => logout(true)}>切换账号</Button>
        </div> :<div>
          <Button mr="10" onClick={onOk}>确定</Button>
          {currentHouse.value && <Button className="secondary" onClick={onClose}>取消</Button>}
        </div>}
      </div>}
      onClose={onClose}
    >
      {isChangeCompanyEnterprise() ? <div style={{height: '500px',overflow: 'hidden', display: 'flex', color: '#fff'}}>
        <div style={{flex: 1,height: '100%', overflow: 'auto',}}>
          <div>
            {Array.isArray(companyEnterpriseList) && companyEnterpriseList.map((w,index) => {
              return <div
                className={`p-ware-select ${w.value == currentCompanyEnterprise.value && 'active' || ''}`}
                key={index}
                onClick={() => SelectCompanyEnterprise(w)}
              >
                <span>{w.label}</span>
              </div>
            })}
          </div>

        </div>
      </div> : <div style={{height: '500px',overflow: 'hidden', display: 'flex', color: '#fff'}}>
        <div style={{height: '100%', overflow: 'auto',borderRight: '1px solid #ccc', flex: 1}}>
            {companyList.map((w,index) => {
              return <div
                className={`p-company-select ${warehouseList.value === w.value && 'active' || ''}`}
                key={index}
                onClick={() => SelectCompany(w)}
              >
                <span>{w.label}</span>
                <i className='_ar_r' style={{width: 15, height: 15}}></i>
              </div>
            })}
        </div>
        <div style={{flex: 1,height: '100%', overflow: 'auto',}}>
          <div>
            {Array.isArray(warehouseList.children) && warehouseList.children.map((w,index) => {
              return <div
                className={`p-ware-select ${w.value == wareHouse.value && 'active' || ''}`}
                key={index}
                onClick={() => SelectWarehouse(w)}
              >
                <span>{w.label}</span>
              </div>
            })}
          </div>

        </div>
      </div>}
    </Dialog>
  </div>
})