import Cookie from './cookie';
var ls = window.localStorage;
var localStore = {
    get: function (key) {
        return ls ? ls.getItem(key) : Cookie.get(key);
    },
    /*赋值*/
    set: function (key, data) {
        try { //隐私模式异常
            ls ? ls.setItem(key, data) : Cookie.set(key, data, {hour: 7 * 24});
        }
        catch (e) {
            console.log(e);
        }
    },
    /*删除*/
    remove: function (key) {
        ls ? ls.removeItem(key) : Cookie.del(key);
    },
    /* [慎用] 清除所有的key/value*/
    clear: function () {
        return ls && ls.clear();
    }
};
export default localStore;
//# sourceMappingURL=index.js.map