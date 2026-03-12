const VintageExtender = {
  API_BASE: 'https://database-app-6ms4.onrender.com',
  state: {
    nextId: '...',
    templates: {}, // { "小物": "...", "トップス": "..." }
    hashtags_map: {}, // { "all": "#古着...", "Tシャツ": "#..." }
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
      <div class="ve-header"><span>EasyRegister v2.1</span><button class="ve-close" id="ve-close-btn">×</button></div>
      <div id="ve-history-row" style="display:flex; gap:5px; padding:5px 10px; background:#1a1a1a; border-bottom:1px solid #333; align-items:center;">
        <span class="ve-label" style="margin:0; flex-shrink:0;">HISTORY</span>
        <button class="ve-mini-btn ve-hist-btn" data-idx="0" style="width:24px; height:20px; opacity:0.3;" disabled>1</button>
        <button class="ve-mini-btn ve-hist-btn" data-idx="1" style="width:24px; height:20px; opacity:0.3;" disabled>2</button>
        <button class="ve-mini-btn ve-hist-btn" data-idx="2" style="width:24px; height:20px; opacity:0.3;" disabled>3</button>
        <div style="flex:1;"></div>
        <button class="ve-mini-btn" id="ve-fetch-ai-btn" style="background:#6a11cb; padding:0 10px; height:20px; font-weight:bold;">吸い上げ</button>
      </div>
      <div class="ve-body">
        <div class="ve-field" style="text-align:center; border-bottom:1px solid #333; padding-bottom:10px;">
          <span class="ve-label" style="margin:0;">PRODUCT ID</span>
          <div id="ve-next-id" class="ve-id-display" style="font-size:30px;">...</div>
        </div>

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
              <option value="0">0</option><option value="20">20</option><option value="30">30</option>
              <option value="50">50</option><option value="60">60</option><option value="70">70</option>
            </select>
          </div>
        </div>
        <div id="ve-calc-price" style="text-align:right; color:#28a745; font-weight:bold; font-size:15px; margin-bottom:10px;">¥0</div>

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

        <div class="ve-row">
          <div class="ve-field"><label class="ve-label">HASHTAGS</label><select id="ve-hashtag-rules" class="ve-select"></select></div>
          <div class="ve-field" style="flex:0.5;"></div>
        </div>

        <div class="ve-field">
          <label class="ve-label">OUTPUT / DESCRIPTION (WORD)</label>
          <textarea id="ve-word-textla" class="ve-textarea" style="height:150px; background:#000; color:#efefef; font-size:14px;"></textarea>
          <button id="ve-copy-word-btn" class="ve-btn" style="margin-top:5px; background:#1b5e20;">完成文をコピー</button>
        </div>

        <div class="ve-field"><label class="ve-label">MEMO (DB ONLY)</label><textarea id="ve-memo" class="ve-textarea-small" style="height:40px;"></textarea></div>
        
        <button id="ve-save-btn" class="ve-btn" style="background:#ff5a5f; font-weight:bold;">保存</button>
        <div id="ve-status" class="ve-status"></div>
      </div>
    `;
    document.body.appendChild(panel);

    const updateHistoryUI = () => {
      chrome.storage.local.get(['ve_history'], (res) => {
        const hist = res.ve_history || [];
        document.querySelectorAll('.ve-hist-btn').forEach((btn, i) => {
          if (hist[i]) {
            btn.style.opacity = '1';
            btn.disabled = false;
            btn.title = hist[i].item_name;
          } else {
            btn.style.opacity = '0.3';
            btn.disabled = true;
          }
        });
      });
    };

    const saveToHistory = (item_name, word_textla, purchase_id) => {
      chrome.storage.local.get(['ve_history'], (res) => {
        let hist = res.ve_history || [];
        hist.unshift({ item_name, word_textla, purchase_id, timestamp: Date.now() });
        hist = hist.slice(0, 3);
        chrome.storage.local.set({ ve_history: hist }, updateHistoryUI);
      });
    };

    document.querySelectorAll('.ve-hist-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        chrome.storage.local.get(['ve_history'], (res) => {
          const item = (res.ve_history || [])[idx];
          if (item) {
            document.getElementById('ve-item-name').value = item.item_name;
            document.getElementById('ve-word-textla').value = item.word_textla;
            const idEl = document.getElementById('ve-next-id');
            const labelEl = idEl.previousElementSibling;
            idEl.innerText = item.purchase_id;
            idEl.style.color = '#ffc107';
            if (labelEl) {
              labelEl.innerText = 'RESTORED ID';
              labelEl.style.color = '#ffc107';
            }
            idEl.setAttribute('data-restored', 'true');
            updateOutput();
            // メルカリ側にも反映
            const titleInput = document.querySelector('input[inputmode="text"]');
            if (titleInput) {
              titleInput.value = item.item_name;
              titleInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            const descInput = document.querySelector('textarea.merInputNode') || 
                              document.querySelector('.merInputNode textarea') ||
                              document.querySelector('textarea[name="description"]');
            if (descInput) {
              descInput.value = item.word_textla;
              descInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        });
      };
    });

    const updateOutput = () => {
      const title = document.getElementById('ve-item-name').value;

      // Auto-select hashtags based on brackets 【 】 in title
      const bracketMatch = title.match(/【(.*?)】/);
      let targetCat = '生活小物'; // Default
      if (bracketMatch) {
        const inner = bracketMatch[1].toLowerCase();
        // Priority 1: Heisei Grunge (Archive / 00s / Y2K)
        if (inner.includes('archive') || inner.includes('00') || inner.includes('y2k') || inner.includes('平成')) {
          targetCat = '平成グランジ系';
        } 
        // Priority 2: Vintage / 90s and older (all)
        else if (inner.includes('vintage') || inner.includes('90') || inner.includes('80') || inner.includes('70') || inner.includes('60') || inner.includes('50')) {
          targetCat = 'all';
        }
      }
      const htSelect = document.getElementById('ve-hashtag-rules');
      if (htSelect && VintageExtender.state.hashtags_map[targetCat] && htSelect.value !== targetCat) {
        htSelect.value = targetCat;
        VintageExtender.state.hashtags = VintageExtender.state.hashtags_map[targetCat];
      }

      const freeWord = document.getElementById('ve-free-word').value;
      const pid = document.getElementById('ve-next-id').innerText;
      const condKey = document.getElementById('ve-condition').value;
      const fullCond = VintageExtender.MAP2[condKey] || '良好';
      const tplName = document.getElementById('ve-template').value;
      const cntEl = document.getElementById('ve-char-cnt');
      cntEl.innerText = `${title.length}/40`;
      cntEl.style.color = title.length > 40 ? '#ff4d4f' : '#888';
      const rawTemplate = VintageExtender.state.templates[tplName] || "{description}\n\n状態:{full_condition}\n\n{hashtags}";
      const replacements = {
        "{description}": freeWord || "",
        "{hashtags}": VintageExtender.state.hashtags,
        "{product_id}": pid,
        "{title}": title,
        "{full_condition}": fullCond
      };
      let finalWord = rawTemplate;
      for (const [k, v] of Object.entries(replacements)) {
        finalWord = finalWord.split(k).join(v || "");
      }
      document.getElementById('ve-word-textla').value = finalWord.trim();
      const p = document.getElementById('ve-price').value || 0;
      const d = document.getElementById('ve-discount').value || 0;
      document.getElementById('ve-calc-price').innerText = '¥' + Math.floor(p * (1 - d/100)).toLocaleString();
    };

    ['ve-item-name', 've-free-word', 've-price', 've-discount', 've-condition', 've-template', 've-hashtag-rules'].forEach(id => {
      document.getElementById(id).addEventListener('input', updateOutput);
      document.getElementById(id).addEventListener('change', updateOutput);
    });

    document.getElementById('ve-hashtag-rules').addEventListener('change', (e) => {
      const cat = e.target.value;
      VintageExtender.state.hashtags = VintageExtender.state.hashtags_map[cat] || '';
      updateOutput();
    });

    const setupCopy = (btnId, targetId) => {
      document.getElementById(btnId).onclick = () => {
        const val = document.getElementById(targetId).value;
        navigator.clipboard.writeText(val).then(() => {
          const btn = document.getElementById(btnId);
          const old = btn.innerText; btn.innerText = 'OK!';
          if (btnId === 've-copy-word-btn') {
            const idEl = document.getElementById('ve-next-id');
            const labelEl = idEl.previousElementSibling;
            if (idEl.getAttribute('data-restored') === 'true') {
              idEl.innerText = VintageExtender.state.nextId || '...';
              idEl.style.color = '';
              idEl.removeAttribute('data-restored');
              if (labelEl) {
                labelEl.innerText = 'PRODUCT ID';
                labelEl.style.color = '';
              }
            }
          }
          setTimeout(() => { btn.innerText = old; }, 1000);
        });
      };
    };
    setupCopy('ve-copy-title-btn', 've-item-name');
    setupCopy('ve-copy-word-btn', 've-word-textla');

    const toggle = (open) => {
      panel.style.display = open ? 'flex' : 'none';
      launcher.style.display = open ? 'none' : 'flex';
      if (open) {
        fetchConfig();
        updateHistoryUI();
      }
      chrome.storage.local.set({ isPanelOpen: open });
    };

    launcher.onclick = () => toggle(true);
    document.getElementById('ve-close-btn').onclick = () => toggle(false);

    const fetchConfig = async () => {
      try {
        const res = await fetch(`${VintageExtender.API_BASE}/api/external/vintage_extend/config`).then(r => r.json());
        if (res.success) {
          VintageExtender.state.templates = res.templates.reduce((acc, t) => {
            acc[t.title] = t.txt;
            return acc;
          }, {});
          
          // ハッシュタグルールの処理
          if (res.hashtags) {
            VintageExtender.state.hashtags_map = res.hashtags.reduce((acc, h) => {
              acc[h.category] = h.hashtag_text;
              return acc;
            }, {});
            const htSelect = document.getElementById('ve-hashtag-rules');
            htSelect.innerHTML = res.hashtags.map(h => `<option value="${h.category}">${h.category}</option>`).join('');
            // 初期値（allがあればそれ、なければ最初の要素）
            const defaultCat = VintageExtender.state.hashtags_map['all'] ? 'all' : (res.hashtags[0]?.category || '');
            if (defaultCat) {
              htSelect.value = defaultCat;
              VintageExtender.state.hashtags = VintageExtender.state.hashtags_map[defaultCat];
            }
          }

          VintageExtender.state.nextId = res.next_id;
          document.getElementById('ve-next-id').innerText = res.next_id;
          document.getElementById('ve-template').innerHTML = res.templates.map(t => `<option value="${t.title}">${t.title}</option>`).join('');
          updateOutput();
        }
      } catch (e) { console.error('Config fetch failed', e); }
    };

    document.getElementById('ve-save-btn').onclick = async () => {
      const saveBtn = document.getElementById('ve-save-btn');
      const status = document.getElementById('ve-status');
      const condKey = document.getElementById('ve-condition').value;
      const itemName = document.getElementById('ve-item-name').value;
      const wordTextLA = document.getElementById('ve-word-textla').value;

      // メルカリ側にも反映
      const titleInput = document.querySelector('input[inputmode="text"]');
      if (titleInput) {
        titleInput.value = itemName;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const descInput = document.querySelector('textarea.merInputNode') || 
                        document.querySelector('.merInputNode textarea') ||
                        document.querySelector('textarea[name="description"]');
      if (descInput) {
        descInput.value = wordTextLA;
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const data = {
        item_name: itemName,
        purchase_price: document.getElementById('ve-calc-price').innerText.replace(/[¥,]/g, ''),
        memo: document.getElementById('ve-memo').value,
        cond2: condKey,
        condition: VintageExtender.MAP2[condKey] || '良好',
        template_name: document.getElementById('ve-template').value,
        purchase_id: document.getElementById('ve-next-id').innerText,
        description: document.getElementById('ve-free-word').value,
        word_textla: wordTextLA
      };
      if (!data.item_name) return alert('商品名を入力してください');
      saveBtn.disabled = true; status.innerText = 'Saving...';
      const res = await fetch(`${VintageExtender.API_BASE}/api/external/vintage_extend/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      }).then(r => r.json());
      if (res.success) {
        saveToHistory(itemName, wordTextLA, document.getElementById('ve-next-id').innerText);
        saveBtn.innerText = '✅ 保存完了！';
        saveBtn.style.background = '#28a745';
        ['ve-item-name', 've-free-word', 've-memo', 've-word-textla'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        fetchConfig();
        setTimeout(() => {
          saveBtn.innerText = '保存';
          saveBtn.style.background = '';
          saveBtn.disabled = false;
          status.innerText = '';
        }, 1500);
      } else {
        status.innerText = '❌ Error: ' + res.message;
        saveBtn.disabled = false;
      }
    };

    // 1.3 CHECK FOR PENDING AI DATA & FETCH ACTION
    const setAiData = (data) => {
      if (data.title) document.getElementById('ve-item-name').value = data.title;
      if (data.description) document.getElementById('ve-free-word').value = data.description;
      updateOutput();
      const status = document.getElementById('ve-status');
      if (status) {
        status.innerText = '✨ AIデータをセットしました';
        setTimeout(() => { status.innerText = ''; }, 3000);
      }
    };

    // 初期読み込み時の自動挿入（isNewがtrueの時のみ1回実行）
    chrome.storage.local.get(['pending_ai_data'], (res) => {
      if (res.pending_ai_data && res.pending_ai_data.isNew) {
        setAiData(res.pending_ai_data);
        // フラグを倒して保存（データ自体は残す）
        const updatedData = { ...res.pending_ai_data, isNew: false };
        chrome.storage.local.set({ pending_ai_data: updatedData });
      }
    });

    // 「吸い上げ」ボタンのアクション
    document.getElementById('ve-fetch-ai-btn').onclick = () => {
      chrome.storage.local.get(['pending_ai_data'], (res) => {
        if (res.pending_ai_data) setAiData(res.pending_ai_data);
        else alert('吸い上げるAIデータがありません');
      });
    };

    await fetchConfig();
    chrome.storage.local.get(['isPanelOpen'], (r) => toggle(r.isPanelOpen));
  }
};

// ==================================================================
// 2. AI Extender (Item Page Logic - Unified)
// ==================================================================
const AiExtender = {
  state: {
    panel: null,
    launcher: null,
    titleArea: null,
    descArea: null
  },

  getBrandName: () => {
    const container = document.querySelector('[data-testid="item-size-and-brand-container"]');
    if (!container) return "";
    const brandEl = container.querySelector('.merText');
    return brandEl ? brandEl.innerText.trim() : "";
  },

  toggle: (open) => {
    const panel = AiExtender.ensurePanel();
    if (!panel) return;
    const launcher = AiExtender.state.launcher;

    panel.style.display = open ? 'flex' : 'none';
    if (launcher) launcher.style.display = open ? 'none' : 'inline-flex';

    chrome.storage.local.set({ isAiPanelOpen: open });
  },

  // 統合パネルの生成と注入
  ensurePanel: () => {
    if (AiExtender.state.panel) return AiExtender.state.panel;

    const targetH1 = document.querySelector('h1[class*="heading__"]');
    if (!targetH1) return null;

    const panel = document.createElement('div');
    panel.className = 'ai-extender-unified-panel';
    panel.id = 'ai-extender-panel';
    panel.innerHTML = `
      <div class="ve-header"><span>AI EXTENDER</span><button class="ve-close" id="ai-close-btn">×</button></div>
      <div class="ve-body" style="padding:10px; display:flex; flex-direction:column; gap:15px;">
        <button class="ai-extender-all-btn" id="ai-fix-all">✨ まとめてAI修正（爆速）</button>
        <div class="ai-extender-section" data-type="title">
          <div class="ai-extender-label">TITLE CLEANING <span class="ai-extender-counter">0/40</span></div>
          <div class="ai-extender-btn-group">
            <button class="ai-extender-btn" id="ai-fix-title">タイトル修正</button>
            <button class="ai-extender-copy-btn" data-target="title">コピー</button>
          </div>
          <textarea class="ai-extender-result" id="ai-title-output" placeholder="タイトルがここに表示されます..."></textarea>
        </div>
        <div class="ai-extender-section" data-type="desc">
          <div class="ai-extender-label">DESCRIPTION CLEANING</div>
          <div class="ai-extender-btn-group">
            <button class="ai-extender-btn" id="ai-fix-desc">本文修正</button>
            <button class="ai-extender-copy-btn" data-target="desc">コピー</button>
          </div>
          <textarea class="ai-extender-result" id="ai-desc-output" placeholder="商品説明がここに表示されます..."></textarea>
        </div>
        <button class="ai-extender-send-btn" id="ai-send-all">まとめてEasyRegisterへ転送</button>
      </div>
    `;

    targetH1.parentNode.insertBefore(panel, targetH1.nextSibling);
    AiExtender.state.panel = panel;
    AiExtender.state.titleArea = panel.querySelector('#ai-title-output');
    AiExtender.state.descArea = panel.querySelector('#ai-desc-output');

    // イベント紐付け
    panel.querySelector('#ai-fix-all').onclick = () => AiExtender.runAiAll();
    panel.querySelector('#ai-fix-title').onclick = () => AiExtender.runAi('title');
    panel.querySelector('#ai-fix-desc').onclick = () => AiExtender.runAi('desc');
    panel.querySelector('#ai-close-btn').onclick = () => AiExtender.toggle(false);

    panel.querySelectorAll('.ai-extender-copy-btn').forEach(btn => {
      btn.onclick = () => {
        const targetId = btn.dataset.target === 'title' ? '#ai-title-output' : '#ai-desc-output';
        const val = panel.querySelector(targetId).value;
        if (!val) return;
        navigator.clipboard.writeText(val).then(() => {
          const old = btn.innerText; btn.innerText = 'COPIED!';
          setTimeout(() => { btn.innerText = old; }, 1000);
        });
      };
    });

    panel.querySelector('#ai-send-all').onclick = () => {
      const title = AiExtender.state.titleArea.value;
      const desc = AiExtender.state.descArea.value;
      if (!title && !desc) return alert('修正後の内容がありません');

      chrome.storage.local.set({ 
        pending_ai_data: { title, description: desc, isNew: true } // 新着フラグ付与
      }, () => {
        const btn = panel.querySelector('#ai-send-all');
        const old = btn.innerText; btn.innerText = '✨ 転送予約完了！';
        setTimeout(() => { btn.innerText = old; }, 2000);
      });
    };

    const updateCounter = () => {
      const len = AiExtender.state.titleArea.value.length;
      const counter = panel.querySelector('.ai-extender-counter');
      counter.innerText = `${len}/40`;
      counter.style.color = len > 40 ? '#ff0211' : '#888';
      counter.style.fontWeight = len > 40 ? 'bold' : 'normal';
    };
    AiExtender.state.titleArea.oninput = updateCounter;

    return panel;
  },

  runAiAll: async () => {
    const btn = AiExtender.state.panel.querySelector('#ai-fix-all');
    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = '✨ 爆速AI実行中...';

    try {
      await Promise.all([
        AiExtender.runAi('title', true),
        AiExtender.runAi('desc', true)
      ]);
      btn.innerText = '✨ 一括修正完了！';
      setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 2000);
    } catch (err) {
      alert('一括修正中にエラーが発生しました');
      btn.disabled = false;
      btn.innerText = originalText;
    }
  },

  runAi: async (type, isSilent = false) => {
    const selection = window.getSelection().toString().trim();
    let originalContent = selection;

    if (!originalContent) {
      if (type === 'title') {
        originalContent = document.querySelector('h1[class*="heading__"]')?.innerText.trim();
      } else {
        originalContent = document.querySelector('.merShowMore pre[data-testid="description"]')?.innerText.trim();
      }
    }

    if (!originalContent) return alert('対象の文章が見つかりません。');

    const btn = AiExtender.state.panel.querySelector(type === 'title' ? '#ai-fix-title' : '#ai-fix-desc');
    const output = type === 'title' ? AiExtender.state.titleArea : AiExtender.state.descArea;

    if (!isSilent) { btn.disabled = true; btn.innerText = '実行中...'; }
    try {
      const endpoint = type === 'desc' 
        ? `${VintageExtender.API_BASE}/api/external/mercari/description_refine`
        : `${VintageExtender.API_BASE}/api/external/mercari/title_refine`;
      const body = type === 'desc' 
        ? { text: originalContent }
        : { title: originalContent, brand: AiExtender.getBrandName() };

      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      }).then(r => r.json());

      if (res.success) {
        output.value = type === 'desc' ? res.refined_text : res.refined_title;
        output.style.height = 'auto';
        output.style.height = (output.scrollHeight + 10) + 'px';
        if (type === 'title') output.dispatchEvent(new Event('input'));
      } else { 
        if (!isSilent) alert('Error: ' + res.message); 
      }
    } catch (err) { 
      if (!isSilent) alert('API接続失敗'); 
    }
    finally { 
      if (!isSilent) {
        btn.disabled = false; 
        btn.innerText = type === 'title' ? 'タイトル修正' : '本文修正'; 
      }
    }
  },

  init: () => {
    const tryInjectLauncher = () => {
      if (document.getElementById('ai-extender-launcher')) return true;

      const targetH1 = document.querySelector('h1[class*="heading__"]');
      if (!targetH1) return false;

      const launcher = document.createElement('div');
      launcher.id = 'ai-extender-launcher';
      launcher.innerText = '✨ AI修正パネルを開く';
      targetH1.parentNode.insertBefore(launcher, targetH1.nextSibling);

      AiExtender.state.launcher = launcher;
      launcher.onclick = () => AiExtender.toggle(true);

      // 初期状態の復元
      chrome.storage.local.get(['isAiPanelOpen'], (res) => {
        if (res.isAiPanelOpen) AiExtender.toggle(true);
        else AiExtender.toggle(false);
      });

      return true;
    };

    if (!tryInjectLauncher()) {
      const observer = new MutationObserver(() => {
        if (tryInjectLauncher()) { /* 成功 */ }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    const cleanupObserver = new MutationObserver(() => {
      if (AiExtender.state.panel && !document.contains(AiExtender.state.panel)) {
        AiExtender.state.panel = null;
        AiExtender.state.launcher = null;
      }
    });
    cleanupObserver.observe(document.body, { childList: true, subtree: true });
  }
};// ==================================================================
// 3. Router
// ==================================================================
const path = window.location.pathname;
if (path.includes('/sell/create') || path.includes('/sell/draft/')) {
  VintageExtender.init();
} else if (path.includes('/item/') || path.includes('/products/')) {
  AiExtender.init();
}

// Version: 2.1.2 - Final Test for Push Changes with multi-line message.

