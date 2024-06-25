import { apiBase as preApi} from 'assets/js/proxy-utils'
const API = {
  // 菜单
  getMenu: preApi + '/getMenus',
  // 获取仓库及公司名称
  getCompanyWareHouseList: '/pcsapiweb/getWarehouseList',
};
export default API;