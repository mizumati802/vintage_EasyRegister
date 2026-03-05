const VintageExtender = {
  API_BASE: 'https://database-app-6ms4.onrender.com',

  init: async () => {
    if (document.getElementById('vintage-extender-panel')) return;

    // 1. UI作成 (シンプルに配置)
    const launcher = document.createElement('div');
    launcher.id = 've-launcher'; launcher.innerText = 'V';
    document.body.appendChild(launcher);

    const panel = document.createElement('div');
    panel.id = 'vintage-extender-panel';
    panel.innerHTML = `
      <div class="ve-header"><span>vintage_EasyRegister</span><button class="ve-close" id="ve-close-btn">×</button></div>
      <div class="ve-body">
        <div class="ve-field"><span class="ve-label">ID</span><div id="ve-next-id" class="ve-id-display">...</div></div>
        <div class="ve-field">
          <label class="ve-label">ITEM NAME</label>
          <div style="display:flex; gap:5px;">
            <input type="text" id="ve-item-name" class="ve-input">
            <button id="ve-copy-name-btn" style="padding:0 10px; background:#eee; border:1px solid #ccc; border-radius:4px; cursor:pointer; font-size:11px;">Copy</button>
          </div>
        </div>
        <div class="ve-row">
          <div class="ve-field"><label class="ve-label">PRICE</label><input type="number" id="ve-price" class="ve-input"></div>
          <div class="ve-field"><label class="ve-label">DISC(%)</label>
            <select id="ve-discount" class="ve-select">
              <option value="0">0</option><option value="20">20</option><option value="30">30</option>
              <option value="50">50</option><option value="60">60</option><option value="70">70</option>
            </select>
          </div>
        </div>
        <div class="ve-field" style="color:#28a745; font-weight:bold; text-align:right;">適用後: ¥<span id="ve-calculated-price">0</span></div>
        <div class="ve-field"><label class="ve-label">TEMPLATE</label><select id="ve-template" class="ve-select"></select></div>
        <div class="ve-field"><label class="ve-label">CONDITION</label>
          <select id="ve-condition" class="ve-select">
            <option value="noStains">目立った傷なし</option><option value="someWear">やや傷あり</option><option value="junk">ジャンク</option>
          </select>
        </div>
        <div class="ve-field"><label class="ve-label">MEMO</label><textarea id="ve-memo" class="ve-textarea"></textarea></div>
        <button id="ve-save-btn" class="ve-btn">SAVE</button>
        <div id="ve-status" class="ve-status"></div>
      </div>
    `;
    document.body.appendChild(panel);

    // コピー機能
    document.getElementById('ve-copy-name-btn').onclick = () => {
      const name = document.getElementById('ve-item-name').value;
      navigator.clipboard.writeText(name).then(() => {
        const btn = document.getElementById('ve-copy-name-btn');
        const original = btn.innerText;
        btn.innerText = 'OK!';
        btn.style.background = '#28a745';
        btn.style.color = '#fff';
        setTimeout(() => {
          btn.innerText = original;
          btn.style.background = '#eee';
          btn.style.color = '#000';
        }, 1000);
      });
    };

    // 2. 価格計算 (vintage.js 準拠のシンプル版)
    const updatePrice = () => {
      const p = document.getElementById('ve-price').value || 0;
      const d = document.getElementById('ve-discount').value || 0;
      document.getElementById('ve-calculated-price').innerText = Math.floor(p * (1 - d/100)).toLocaleString();
    };
    document.getElementById('ve-price').oninput = updatePrice;
    document.getElementById('ve-discount').onchange = updatePrice;

    // 3. 開閉とデータ取得
    const toggle = (open) => {
      panel.style.display = open ? 'block' : 'none';
      launcher.style.display = open ? 'none' : 'flex';
      if (open) fetchConfig();
      chrome.storage.local.set({ isPanelOpen: open });
    };

    launcher.onclick = () => toggle(true);
    document.getElementById('ve-close-btn').onclick = () => toggle(false);

    const fetchConfig = async () => {
      const res = await fetch(`${VintageExtender.API_BASE}/api/external/vintage_extend/config`).then(r => r.json());
      if (res.success) {
        document.getElementById('ve-next-id').innerText = res.next_id;
        document.getElementById('ve-template').innerHTML = res.templates.map(t => `<option value="${t}">${t}</option>`).join('');
      }
    };

    // 4. 保存
    document.getElementById('ve-save-btn').onclick = async () => {
      const status = document.getElementById('ve-status');
      const data = {
        item_name: document.getElementById('ve-item-name').value,
        purchase_price: document.getElementById('ve-calculated-price').innerText.replace(/,/g, ''),
        memo: document.getElementById('ve-memo').value,
        cond2: document.getElementById('ve-condition').value,
        template_name: document.getElementById('ve-template').value,
        purchase_id: document.getElementById('ve-next-id').innerText
      };
      if (!data.item_name) return alert('商品名を入力してください');
      
      status.innerText = 'Saving...';
      const res = await fetch(`${VintageExtender.API_BASE}/api/external/vintage_extend/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      }).then(r => r.json());

      if (res.success) {
        status.innerText = 'Saved!';
        ['ve-item-name', 've-price', 've-memo'].forEach(id => document.getElementById(id).value = '');
        updatePrice(); fetchConfig();
      }
    };

    // 初期状態復元
    chrome.storage.local.get(['isPanelOpen'], (r) => toggle(r.isPanelOpen));
  }
};

VintageExtender.init();
