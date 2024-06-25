import { isTrue, deepClone, isObj } from './index';
const Bus = {
  _events: {},
  _store: {},
  _listeners: [],
  $on(name, fn) {
    if (!this._events[name]) {
      this._events[name] = [];
    }
    this._events[name].push(fn);
    return () =>
      (this._events[name] = this._events[name].filter(e => e !== fn));
  },
  $emit(name, ...args) {
    if (this._events[name] && Array.isArray(this._events[name])) {
      this._events[name].forEach(fn => {
        fn(...args);
      });
    }
  },
  clear(name) {
    if (name && this._events[name]) {
      delete this._events[name];
    } else {
      this._events = {};
    }
  },
  setState(state) {
    if (!isObj(state)) return;
    Object.assign(this._store, state);
    this._listeners.forEach(l => l(deepClone(state)));
  },
  getState(key) {
    if (isTrue(key)) {
      const state = this._store[key];
      if (isObj(state)) return deepClone(state);
      return state;
    }
    return deepClone(this._store);
  },
  clearState(key) {
    if (key) {
      delete this._store[key]
    } else {
      this._store = {}
    }
  },
  subscribe(listener) {
    this._listeners.push(listener);
    return () =>
      (this._listeners = this._listeners.filter(l => l !== listener));
  },
  watch(name, callback) {
    if (typeof name === 'string') (name = [name])
    if (!Array.isArray(name)) return
    return this.subscribe((state) => {
      if (name.some(n => state.hasOwnProperty(n))) {
        typeof callback === 'function' && callback(state)
      }
    })
  }
};
window._Bus = Bus
export default Bus
