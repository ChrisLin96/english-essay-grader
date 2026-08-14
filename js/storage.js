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
      const stored = get(KEYS.SETTINGS, null);
      const defaults = {
        // 统一的服务商：AI 批改与 AI 看图识字共用同一个服务商 + Key。
        // 默认通义千问——它的多模态模型（qwen-vl-max 等）既能批改又能看图，一个 Key 搞定。
        // 若选纯文本服务商（如 DeepSeek），批改正常，但看图会自动回退本地 OCR 并提示。
        provider: 'qwen',
        apiKey: '',
        baseUrl: '',
        model: '',
        style: 'standard',
        rubric: '',
      };
      // 与默认值浅合并，保证旧用户的本地设置也能拿到新增字段
      if (!stored) return defaults;
      return { ...defaults, ...stored };
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
    rename(id, title) {
      const list = History.list().map(r => r.id === id ? { ...r, title } : r);
      set(KEYS.HISTORY, list);
    },
    // 合并更新某条记录（用于保存老师编辑后的批注 / 总评 / 分数）
    update(id, patch) {
      const list = History.list().map(r => r.id === id ? { ...r, ...patch } : r);
      set(KEYS.HISTORY, list);
      return list.find(r => r.id === id) || null;
    },
    remove(id) {
      const list = History.list().filter(r => r.id !== id);
      set(KEYS.HISTORY, list);
    },
    clear() {
      remove(KEYS.HISTORY);
    },

    // ---- 批量批改分组：一次批改的多篇作文在历史里合并为一个「目录」条目 ----
    genId(prefix) {
      return prefix + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    },
    // 新增一个批量分组记录（items 为各篇完整批改数据），返回 group 对象
    addBatch(items) {
      const list = History.list();
      const group = {
        id: History.genId('g_'),
        type: 'batch',
        createdAt: Date.now(),
        title: '批量批改',
        items: (items || []).map((it, i) => Object.assign({
          id: History.genId('i_') + '_' + i,
        }, it)),
      };
      list.unshift(group);
      if (list.length > 30) list.length = 30;
      set(KEYS.HISTORY, list);
      return group;
    },
    // 获取组内某篇子记录
    getItem(groupId, itemId) {
      const g = History.get(groupId);
      if (!g || !g.items) return null;
      return g.items.find(it => it.id === itemId) || null;
    },
    // 向分组追加一篇（用于批量中某篇失败后手动重试成功）
    addItemToGroup(groupId, itemData) {
      const list = History.list();
      let added = null;
      const next = list.map(r => {
        if (r.id !== groupId) return r;
        const item = Object.assign({ id: History.genId('i_') }, itemData);
        added = item;
        return { ...r, items: (r.items || []).concat(item) };
      });
      set(KEYS.HISTORY, next);
      return added;
    },
    // 更新组内某篇子记录（用于编辑写回）
    updateItem(groupId, itemId, patch) {
      const list = History.list();
      let updated = null;
      const next = list.map(r => {
        if (r.id !== groupId) return r;
        const items = (r.items || []).map(it => it.id === itemId ? { ...it, ...patch } : it);
        return { ...r, items };
      });
      set(KEYS.HISTORY, next);
      const g = next.find(r => r.id === groupId);
      if (g) updated = g.items.find(it => it.id === itemId) || null;
      return updated;
    },
    // 重命名组内某篇子记录
    renameItem(groupId, itemId, title) {
      return History.updateItem(groupId, itemId, { title });
    },
    // 删除组内某篇子记录；若组内清空则连同组一起删除
    removeItem(groupId, itemId) {
      const list = History.list();
      const next = [];
      for (const r of list) {
        if (r.id !== groupId) { next.push(r); continue; }
        const items = (r.items || []).filter(it => it.id !== itemId);
        if (items.length) next.push({ ...r, items });
        // items 为空 → 丢弃整个组
      }
      set(KEYS.HISTORY, next);
    },
  };

  // 学生姓名（最近一次输入的名字，方便下次自动填入）
  const Student = {
    get() { return get('eg_student', '') || ''; },
    set(name) { return set('eg_student', name || ''); },
  };

  // 当前批改数据
  const Current = {
    get() { return get(KEYS.CURRENT); },
    set(data) { set(KEYS.CURRENT, data); },
    clear() { remove(KEYS.CURRENT); },
  };

  return { Settings, History, Current, Student };
})();

window.Storage = Storage;
