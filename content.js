const VintageExtender = {
  API_BASE: 'https://database-app-6ms4.onrender.com',
  state: {
    nextId: '...',
    currentTemplateRaw: '',
    hashtags: '#古着 #used #セレクト'
  },

  MAP2: {
    'noStains': '致命的なダメージではないため「目立った傷や汚れなし」ですが、軽微な使用感（スレ・小キズ・毛玉・やや点シミ・ナイロン革製品のスレ等）や検品の見落としがある場合があります。中古品の特性をご理解ください。',
    'someWear': '使用感や小傷等の中古品特有の状態（綿製品・ニット類の毛玉、ナイロン・革製品のスレ、アクセサリーの小キズ、やや点シミ、検品の見落とし等）がある場合があります。写真をご確認の上ご購入ください。',
    'junk': '一部に剥がれや劣化があり、使用感に加えて不具合のあるジャンク品です。修理等を行ってからのご使用をお勧めします。写真をご確認の上ご購入ください。'
  },

  init: async () => {
    if (document.getElementById('vintage-extender-panel')) return;

    const launcher = document.createElement('div');
    launcher.id = 've-launcher'; launcher.innerText = 'E';
    document.body.appendChild(launcher);

    const panel = document.createElement('div');
    panel.id = 'vintage-extender-panel';
    panel.innerHTML = `
      <div class="ve-header"><span>EasyRegister Complete</span><button class="ve-close" id="ve-close-btn">×</button></div>
      <div class="ve-body">
        <!-- 上段: 商品番号 -->
        <div class="ve-field" style="text-align:center; border-bottom:1px solid #333; padding-bottom:10px;">
          <span class="ve-label" style="margin:0;">PRODUCT ID</span>
          <div id="ve-next-id" class="ve-id-display" style="font-size:24px;">...</div>
        </div>

        <!-- 中段: 入力系 -->
        <div class="ve-field">
          <label class="ve-label">ITEM NAME / {title} <span id="ve-char-cnt" style="float:right; font-weight:normal; color:#888;">0/40</span></label>
          <div style="display:flex; gap:5px;">
            <input type="text" id="ve-item-name" class="ve-input" placeholder="Title...">
            <button id="ve-copy-title-btn" class="ve-mini-btn">コピー</button>
          </div>
        </div>

        <div class="ve-field">
          <label class="ve-label">FREE WORD / {description}</label>
          <textarea id="ve-free-word" class="ve-textarea-small" placeholder="Size, details..."></textarea>
        </div>

        <div class="ve-row">
          <div class="ve-field"><label class="ve-label">PRICE</label><input type="number" id="ve-price" class="ve-input"></div>
          <div class="ve-field"><label class="ve-label">DISC(%)</label>
            <select id="ve-discount" class="ve-select">
              <option value="0">0</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="60">60</option>
              <option value="70">70</option>
            </select>
          </div>
        </div>
        <div id="ve-calc-price" style="text-align:right; color:#28a745; font-weight:bold; font-size:12px; margin-bottom:10px;">¥0</div>

        <div class="ve-row">
          <div class="ve-field"><label class="ve-label">TEMPLATE</label><select id="ve-template" class="ve-select"></select></div>
          <div class="ve-field"><label class="ve-label">CONDITION</label>
            <select id="ve-condition" class="ve-select">
              <option value="noStains">目立った傷無し</option>
              <option value="someWear">使用やや汚れ</option>
              <option value="junk">ジャンク</option>
            </select>
          </div>
        </div>

        <!-- 下段: 組み立て結果 -->
        <div class="ve-field">
          <label class="ve-label">OUTPUT / DESCRIPTION (WORD)</label>
          <textarea id="ve-word-textla" class="ve-textarea" style="height:150px; background:#000; color:#efefef; font-size:11px;"></textarea>
          <button id="ve-copy-word-btn" class="ve-btn" style="margin-top:5px;">完成文をコピー</button>
        </div>

        <div class="ve-field"><label class="ve-label">MEMO (DB ONLY)</label><textarea id="ve-memo" class="ve-textarea-small" style="height:40px;"></textarea></div>
        
        <button id="ve-save-btn" class="ve-btn" style="background:#ff5a5f; font-weight:bold;">保存</button>
        <div id="ve-status" class="ve-status"></div>
      </div>
    `;
    document.body.appendChild(panel);

    // --- ロジック: リアルタイム置換 (vintage_routes.py 準拠) ---
    const updateOutput = () => {
      const titleEl = document.getElementById('ve-item-name');
      const title = titleEl.value;
      const freeWord = document.getElementById('ve-free-word').value;
      const pid = document.getElementById('ve-next-id').innerText;
      const condKey = document.getElementById('ve-condition').value;
      const fullCond = VintageExtender.MAP2[condKey] || '良好';
      
      // 文字数カウント
      const cntEl = document.getElementById('ve-char-cnt');
      cntEl.innerText = `${title.length}/40`;
      cntEl.style.color = title.length > 40 ? '#ff4d4f' : '#888';

      let finalWord = VintageExtender.state.currentTemplateRaw || "{description}\n\n状態:{full_condition}\n\n{hashtags}";

      const replacements = {
        "{description}": freeWord || "",
        "{hashtags}": VintageExtender.state.hashtags,
        "{product_id}": pid,
        "{title}": title,
        "{full_condition}": fullCond
      };

      for (const [k, v] of Object.entries(replacements)) {
        finalWord = finalWord.split(k).join(v || "");
      }
      document.getElementById('ve-word-textla').value = finalWord.trim();

      // 価格計算
      const p = document.getElementById('ve-price').value || 0;
      const d = document.getElementById('ve-discount').value || 0;
      document.getElementById('ve-calc-price').innerText = '¥' + Math.floor(p * (1 - d/100)).toLocaleString();
    };

    // イベント登録
    ['ve-item-name', 've-free-word', 've-price', 've-discount', 've-condition'].forEach(id => {
      document.getElementById(id).addEventListener('input', updateOutput);
      document.getElementById(id).addEventListener('change', updateOutput);
    });

    const fetchTemplate = async (name) => {
      try {
        const res = await fetch(`${VintageExtender.API_BASE}/api/external/query`, {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ sql: "SELECT txt FROM template_button WHERE title = %s", params: [name] })
        }).then(r => r.json());
        if (res.success && res.data.length > 0) {
          VintageExtender.state.currentTemplateRaw = res.data[0].txt;
          updateOutput();
        }
      } catch (e) { console.error(e); }
    };

    document.getElementById('ve-template').onchange = (e) => fetchTemplate(e.target.value);

    // コピー
    const setupCopy = (btnId, targetId, isInput) => {
      document.getElementById(btnId).onclick = () => {
        const val = isInput ? document.getElementById(targetId).value : document.getElementById(targetId).innerText;
        navigator.clipboard.writeText(val).then(() => {
          const btn = document.getElementById(btnId);
          const old = btn.innerText; btn.innerText = 'OK!'; btn.style.background = '#28a745';
          setTimeout(() => { btn.innerText = old; btn.style.background = ''; }, 1000);
        });
      };
    };
    setupCopy('ve-copy-title-btn', 've-item-name', true);
    setupCopy('ve-copy-word-btn', 've-word-textla', true);

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
        if (res.templates.length > 0) fetchTemplate(res.templates[0]);
      }
    };

    document.getElementById('ve-save-btn').onclick = async () => {
      const saveBtn = document.getElementById('ve-save-btn');
      const status = document.getElementById('ve-status');
      const condKey = document.getElementById('ve-condition').value;
      const data = {
        item_name: document.getElementById('ve-item-name').value,
        purchase_price: document.getElementById('ve-calc-price').innerText.replace(/[¥,]/g, ''),
        memo: document.getElementById('ve-memo').value,
        cond2: condKey,
        condition: VintageExtender.MAP2[condKey] || '良好', // 追加: DBのconditionカラム用
        template_name: document.getElementById('ve-template').value,
        purchase_id: document.getElementById('ve-next-id').innerText,
        description: document.getElementById('ve-free-word').value, // 追加: {description}用
        word_textla: document.getElementById('ve-word-textla').value // 完成文
      };
      if (!data.item_name) return alert('商品名を入力してください');
      
      saveBtn.disabled = true;
      status.innerText = 'Saving...';
      const res = await fetch(`${VintageExtender.API_BASE}/api/external/vintage_extend/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      }).then(r => r.json());

      if (res.success) {
        const originalText = saveBtn.innerText;
        saveBtn.innerText = '✅ 保存完了！';
        saveBtn.style.background = '#28a745';
        
        ['ve-item-name', 've-free-word', 've-memo'].forEach(id => document.getElementById(id).value = '');
        fetchConfig();

        setTimeout(() => {
          saveBtn.innerText = originalText;
          saveBtn.style.background = '';
          saveBtn.disabled = false;
          status.innerText = '';
        }, 1500);
      } else {
        status.innerText = '❌ Error: ' + res.message;
        saveBtn.disabled = false;
      }
    };

    chrome.storage.local.get(['isPanelOpen'], (r) => toggle(r.isPanelOpen));
  }
};

VintageExtender.init();
