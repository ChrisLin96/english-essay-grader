/**
 * 本地存储管理
 */
const Storage = (() => {
  const KEYS = {
    SETTINGS: 'eg_settings',
    HISTORY: 'eg_history',
    CURRENT: 'eg_current',
  };

  function get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }

  // 设置
  const Settings = {
    get() {
      return get(KEYS.SETTINGS, {
        provider: 'gemini',
        apiKey: '',
        baseUrl: '',
        model: '',
        style: 'standard',
        rubric: '',
      });
    },
    save(settings) {
      return set(KEYS.SETTINGS, settings);
    },
  };

  // 历史记录
  const History = {
    list() {
      return get(KEYS.HISTORY, []);
    },
    add(record) {
      const list = History.list();
      list.unshift({
        id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        createdAt: Date.now(),
        ...record,
      });
      // 最多保存 30 条
      if (list.length > 30) list.length = 30;
      set(KEYS.HISTORY, list);
      return list[0];
    },
    get(id) {
      return History.list().find(r => r.id === id);
    },
    remove(id) {
      const list = History.list().filter(r => r.id !== id);
      set(KEYS.HISTORY, list);
    },
    clear() {
      remove(KEYS.HISTORY);
    },
  };

  // 当前批改数据
  const Current = {
    get() { return get(KEYS.CURRENT); },
    set(data) { set(KEYS.CURRENT, data); },
    clear() { remove(KEYS.CURRENT); },
  };

  return { Settings, History, Current };
})();

window.Storage = Storage;
