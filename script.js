// ========== 全局状态管理 ==========
const appState = {
  elements: [],
  selectedElementId: null,
  keywords: [],
  uploadedImages: [],
  elementIdCounter: 0
};

// ========== DOM 元素 ==========
const canvas = document.getElementById('canvas');
const textInput = document.getElementById('textInput');
const addTextBtn = document.getElementById('addTextBtn');
const imageInput = document.getElementById('imageInput');
const processImageBtn = document.getElementById('processImageBtn');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const rotationSlider = document.getElementById('rotation');
const rotationValue = document.getElementById('rotationValue');
const boldText = document.getElementById('boldText');
const italicText = document.getElementById('italicText');
const textColor = document.getElementById('textColor');
const keywordsList = document.getElementById('keywordsList');
const editPanel = document.getElementById('editPanel');
const elementText = document.getElementById('elementText');
const editFontSize = document.getElementById('editFontSize');
const editRotation = document.getElementById('editRotation');
const editColor = document.getElementById('editColor');
const editBold = document.getElementById('editBold');
const editItalic = document.getElementById('editItalic');
const deleteBtn = document.getElementById('deleteBtn');
const closeEditBtn = document.getElementById('closeEditBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const imagePreview = document.getElementById('imagePreview');

// Touch drag ghost
let touchGhost = null;
let touchDraggingInfo = null;

// ========== 事件监听器 ==========
addTextBtn.addEventListener('click', () => addTextToCanvas({ autoKeywords: true, generatePoem: true, poemLines: 6, autoOpen: true }));
processImageBtn.addEventListener('click', processImage);
saveBtn.addEventListener('click', saveProject);
exportBtn.addEventListener('click', exportAsImage);
clearBtn.addEventListener('click', clearCanvas);
fontSizeSlider.addEventListener('input', updateFontSizeDisplay);
rotationSlider.addEventListener('input', updateRotationDisplay);
closeEditBtn.addEventListener('click', closeEditPanel);
deleteBtn.addEventListener('click', deleteElement);
canvas.addEventListener('click', handleCanvasClick);
// Canvas drop handlers
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', handleCanvasDrop);

// Paste into textarea: also trigger keyword extraction live
textInput.addEventListener('paste', (e) => {
  setTimeout(() => {
    // after paste value updated
    const text = textInput.value.trim();
    if (text) {
      const kws = window.extractKeywordsFromText ? window.extractKeywordsFromText(text, 6) : [];
      addKeywords(kws);
    }
  }, 50);
});

// ========== 文字元素管理 ==========
function createTextElement(text, options = {}) {
  const id = appState.elementIdCounter++;
  const fontSize = options.fontSize || 24;
  const rotation = options.rotation || 0;
  const color = options.color || '#000000';
  const bold = options.bold || false;
  const italic = options.italic || false;

  // position
  const canvasRect = canvas.getBoundingClientRect();
  const x = (typeof options.x === 'number') ? options.x : Math.random() * Math.max(20, canvas.clientWidth - 100);
  const y = (typeof options.y === 'number') ? options.y : Math.random() * Math.max(20, canvas.clientHeight - 60);

  const element = {
    id,
    text,
    fontSize,
    rotation,
    color,
    bold,
    italic,
    x,
    y
  };

  appState.elements.push(element);
  renderElement(element);
  return id;
}

function renderElement(element) {
  const existingEl = document.getElementById(`elem-${element.id}`);
  if (existingEl) existingEl.remove();

  const div = document.createElement('div');
  div.id = `elem-${element.id}`;
  div.className = 'text-element';
  div.textContent = element.text;
  div.style.left = element.x + 'px';
  div.style.top = element.y + 'px';
  div.style.fontSize = element.fontSize + 'px';
  div.style.transform = `rotate(${element.rotation}deg)`;
  div.style.color = element.color;
  div.style.fontWeight = element.bold ? 'bold' : 'normal';
  div.style.fontStyle = element.italic ? 'italic' : 'normal';

  // 拖拽功能
  makeDraggable(div, element.id);

  // 点击选中
  div.addEventListener('click', (e) => {
    e.stopPropagation();
    selectElement(element.id);
  });

  canvas.appendChild(div);
}

function makeDraggable(element, elementId) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  element.onmousedown = dragMouseDown;
  element.ontouchstart = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    element.classList.add('dragging');

    if (e.type.startsWith('touch')) {
      pos3 = e.touches[0].clientX;
      pos4 = e.touches[0].clientY;
    } else {
      pos3 = e.clientX;
      pos4 = e.clientY;
    }

    document.onmousemove = elementDrag;
    document.ontouchmove = elementDrag;
    document.onmouseup = closeDragElement;
    document.ontouchend = closeDragElement;
  }

  function elementDrag(e) {
    e.preventDefault();

    if (e.type.startsWith('touch')) {
      pos1 = pos3 - e.touches[0].clientX;
      pos2 = pos4 - e.touches[0].clientY;
      pos3 = e.touches[0].clientX;
      pos4 = e.touches[0].clientY;
    } else {
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
    }

    const newX = element.offsetLeft - pos1;
    const newY = element.offsetTop - pos2;

    element.style.top = Math.max(0, Math.min(newY, canvas.offsetHeight - element.offsetHeight)) + 'px';
    element.style.left = Math.max(0, Math.min(newX, canvas.offsetWidth - element.offsetWidth)) + 'px';

    // 更新状态
    const elemData = appState.elements.find(e => e.id === elementId);
    if (elemData) {
      elemData.x = element.offsetLeft;
      elemData.y = element.offsetTop;
    }
  }

  function closeDragElement() {
    element.classList.remove('dragging');
    document.onmousemove = null;
    document.ontouchmove = null;
    document.onmouseup = null;
    document.ontouchend = null;
  }
}

// ========== 编辑面板 ==========
function selectElement(elementId) {
  appState.selectedElementId = elementId;
  const element = appState.elements.find(e => e.id === elementId);

  if (element) {
    // 更新所有元素的视觉状态
    document.querySelectorAll('.text-element').forEach(el => el.classList.remove('selected'));
    const dom = document.getElementById(`elem-${elementId}`);
    if (dom) dom.classList.add('selected');

    // 打开编辑面板
    elementText.value = element.text;
    editFontSize.value = element.fontSize;
    editRotation.value = element.rotation;
    editColor.value = element.color;
    editBold.checked = element.bold;
    editItalic.checked = element.italic;

    editPanel.classList.remove('hidden');

    // 绑定实时更新
    bindEditControls(elementId);
  }
}

function bindEditControls(elementId) {
  elementText.oninput = () => updateElement(elementId, { text: elementText.value });
  editFontSize.onchange = () => updateElement(elementId, { fontSize: parseInt(editFontSize.value) });
  editRotation.onchange = () => updateElement(elementId, { rotation: parseInt(editRotation.value) });
  editColor.onchange = () => updateElement(elementId, { color: editColor.value });
  editBold.onchange = () => updateElement(elementId, { bold: editBold.checked });
  editItalic.onchange = () => updateElement(elementId, { italic: editItalic.checked });
}

function updateElement(elementId, updates) {
  const element = appState.elements.find(e => e.id === elementId);
  if (element) {
    Object.assign(element, updates);
    renderElement(element);
  }
}

function deleteElement() {
  if (appState.selectedElementId !== null) {
    appState.elements = appState.elements.filter(e => e.id !== appState.selectedElementId);
    const el = document.getElementById(`elem-${appState.selectedElementId}`);
    if (el) el.remove();
    closeEditPanel();
  }
}

function closeEditPanel() {
  editPanel.classList.add('hidden');
  document.querySelectorAll('.text-element').forEach(el => el.classList.remove('selected'));
}

function handleCanvasClick(e) {
  if (e.target === canvas) closeEditPanel();
}

// ========== 文字输入 & 自动关键词/自动生成诗句 ==========
async function addTextToCanvas({ autoKeywords = false, generatePoem = false, poemLines = 6, autoOpen = false } = {}) {
  const text = textInput.value.trim();
  if (!text) return;

  const fontSize = parseInt(fontSizeSlider.value);
  const rotation = parseInt(rotationSlider.value);
  const color = textColor.value;
  const bold = boldText.checked;
  const italic = italicText.checked;

  createTextElement(text, { fontSize, rotation, color, bold, italic });
  textInput.value = '';

  if (autoKeywords && typeof window.extractKeywordsFromText === 'function') {
    const kws = window.extractKeywordsFromText(text, 8);
    addKeywords(kws);
    if (generatePoem && kws.length > 0) {
      const poemIds = generatePoemFromKeywords(kws, poemLines);
      if (autoOpen && poemIds && poemIds.length > 0) selectElement(poemIds[0]);
    }
  }
}

function addKeywords(kws) {
  if (!kws || !kws.length) return;
  kws.forEach(k => {
    if (!appState.keywords.includes(k)) {
      appState.keywords.push(k);
      addKeywordTag(k);
    }
  });
}

function generatePoemFromKeywords(keywords, lines = 6) {
  // 简单组合模板以生成短句
  const templates = [
    (k) => `${k} 在城市的边缘`,
    (k) => `像 ${k} 的光`,
    (k) => `我听见 ${k}`,
    (k) => `${k} 与 回忆 相遇`,
    (k) => `没有人看见 ${k}`,
    (k) => `夜里藏着 ${k}`
  ];

  const poemIds = [];
  for (let i = 0; i < lines; i++) {
    const k = keywords[i % keywords.length];
    const tpl = templates[Math.floor(Math.random() * templates.length)];
    const line = tpl(k);
    const elId = createTextElement(line, {
      fontSize: 18 + Math.floor(Math.random() * 28),
      rotation: Math.floor(Math.random() * 61) - 30,
      color: `hsl(${Math.floor(Math.random() * 360)}, 65%, ${45 + Math.floor(Math.random() * 20)}%)`
    });

    // try to spread positions to avoid overlap
    const elData = appState.elements.find(e => e.id === elId);
    elData.x = 20 + (i % 3) * 120 + Math.random() * 40;
    elData.y = 20 + Math.floor(i / 3) * 80 + Math.random() * 40;
    renderElement(elData);
    poemIds.push(elId);
  }

  return poemIds;
}

// ========== 图片处理（保留原实现但使用 fileToDataUrl/simulateKeywordExtraction 如果可用） ==========
function processImage() {
  const files = imageInput.files;
  if (files.length === 0) {
    alert('请选择图片');
    return;
  }

  showLoading(true);
  let processedCount = 0;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      appState.uploadedImages.push({ src: dataUrl, file });

      // 显示图片预览
      const preview = document.createElement('img');
      preview.src = dataUrl;
      preview.title = file.name;
      preview.onclick = () => extractKeywords(dataUrl);
      imagePreview.appendChild(preview);

      // 调用模拟关键词提取（若有）
      if (typeof window.simulateKeywordExtraction === 'function') {
        const kws = await window.simulateKeywordExtraction(dataUrl);
        addKeywords(kws);
      }

      processedCount++;
      if (processedCount === files.length) {
        showLoading(false);
      }
    };
    reader.readAsDataURL(file);
  });
}

function extractKeywords(imageSrc) {
  console.log('正在从图片提取关键词:', imageSrc);
  showLoading(true);
  if (typeof window.simulateKeywordExtraction === 'function') {
    window.simulateKeywordExtraction(imageSrc).then(kws => {
      addKeywords(kws);
      showLoading(false);
    }).catch(() => showLoading(false));
  } else {
    // fallback
    setTimeout(() => {
      demoExtractKeywords();
      showLoading(false);
    }, 800);
  }
}

function demoExtractKeywords() {
  const demoKeywords = ['诗意', '清晨', '光影', '流浪', '思考', '梦境', '远方', '回忆', '时间', '永恒'];
  addKeywords(demoKeywords);
}

// ========== 关键词标签与拖拽/触摸支持 ==========
function addKeywordTag(keyword) {
  const tag = document.createElement('div');
  tag.className = 'keyword-tag';
  tag.setAttribute('draggable', 'true');
  tag.innerHTML = `${keyword}<span class="remove">✕</span>`;

  // dragstart (desktop)
  tag.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', keyword);
    // allow dragging image/text
    e.dataTransfer.effectAllowed = 'copy';
  });

  // touch handling (mobile): short tap adds to center, long-press + move creates ghost follow
  let longPressTimer = null;
  let isLongPress = false;

  tag.addEventListener('touchstart', (e) => {
    isLongPress = false;
    longPressTimer = setTimeout(() => {
      isLongPress = true;
      startTouchDrag(e.touches[0], keyword);
    }, 250);
  }, { passive: true });

  tag.addEventListener('touchmove', (e) => {
    if (isLongPress && touchGhost) {
      moveTouchGhost(e.touches[0]);
      e.preventDefault();
    }
  }, { passive: false });

  tag.addEventListener('touchend', (e) => {
    clearTimeout(longPressTimer);
    if (isLongPress && touchGhost) {
      finishTouchDrag(e.changedTouches[0]);
    } else if (!isLongPress) {
      // short tap: add to center
      addKeywordToCanvasCenter(keyword);
    }
  });

  tag.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove')) {
      tag.remove();
      appState.keywords = appState.keywords.filter(k => k !== keyword);
    }
  });

  keywordsList.appendChild(tag);
}

function handleCanvasDrop(e) {
  e.preventDefault();
  const keyword = e.dataTransfer.getData('text/plain');
  if (!keyword) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  createTextElement(keyword, {
    fontSize: 20 + Math.floor(Math.random() * 18),
    rotation: Math.floor(Math.random() * 61) - 30,
    color: `hsl(${Math.floor(Math.random() * 360)}, 65%, ${45 + Math.floor(Math.random() * 20)}%)`,
    x,
    y
  });
}

function startTouchDrag(touch, keyword) {
  // create ghost element
  touchGhost = document.createElement('div');
  touchGhost.className = 'text-element';
  touchGhost.style.position = 'fixed';
  touchGhost.style.pointerEvents = 'none';
  touchGhost.style.zIndex = 9999;
  touchGhost.textContent = keyword;
  document.body.appendChild(touchGhost);
  moveTouchGhost(touch);
  touchDraggingInfo = { keyword };
}

function moveTouchGhost(touch) {
  const size = 60;
  touchGhost.style.left = (touch.clientX - size / 2) + 'px';
  touchGhost.style.top = (touch.clientY - size / 2) + 'px';
}

function finishTouchDrag(touch) {
  if (!touchGhost) return;
  const rect = canvas.getBoundingClientRect();
  const clientX = touch.clientX;
  const clientY = touch.clientY;
  if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    createTextElement(touchDraggingInfo.keyword, {
      fontSize: 18 + Math.floor(Math.random() * 20),
      rotation: Math.floor(Math.random() * 61) - 30,
      color: `hsl(${Math.floor(Math.random() * 360)}, 65%, ${45 + Math.floor(Math.random() * 20)}%)`,
      x,
      y
    });
  } else {
    // outside canvas: place at center
    addKeywordToCanvasCenter(touchDraggingInfo.keyword);
  }
  // cleanup
  touchGhost.remove();
  touchGhost = null;
  touchDraggingInfo = null;
}

function addKeywordToCanvasCenter(keyword) {
  const rect = canvas.getBoundingClientRect();
  const x = rect.width / 2 - 40;
  const y = rect.height / 2 - 20;
  createTextElement(keyword, {
    fontSize: 20 + Math.floor(Math.random() * 18),
    rotation: Math.floor(Math.random() * 61) - 30,
    color: `hsl(${Math.floor(Math.random() * 360)}, 65%, ${45 + Math.floor(Math.random() * 20)}%)`,
    x,
    y
  });
}

// ========== 工具栏功能（保存、导出、清空等） ==========
function updateFontSizeDisplay() {
  fontSizeValue.textContent = fontSizeSlider.value;
}

function updateRotationDisplay() {
  rotationValue.textContent = rotationSlider.value;
}

function saveProject() {
  const projectData = {
    timestamp: new Date().toISOString(),
    elements: appState.elements,
    keywords: appState.keywords
  };

  const dataStr = JSON.stringify(projectData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `collage-poetry-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);

  alert('项目已保存！');
}

function clearCanvas() {
  if (confirm('确定要清空所有内容吗？')) {
    appState.elements = [];
    appState.keywords = [];
    canvas.innerHTML = '';
    keywordsList.innerHTML = '';
    imagePreview.innerHTML = '';
    appState.elementIdCounter = 0;
    closeEditPanel();
  }
}

function exportAsImage() {
  showLoading(true);

  if (typeof html2canvas === 'undefined') {
    alert('正在使用浏览器原生导出...');
    const canvasElement = canvas;
    canvasElement.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `collage-poetry-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      showLoading(false);
    });
    return;
  }

  html2canvas(canvas, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true
  }).then(canvasImage => {
    canvasImage.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `collage-poetry-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      showLoading(false);
    });
  }).catch(err => {
    console.error('导出失败:', err);
    showLoading(false);
    alert('导出失败，请重试');
  });
}

// ========== 辅助函数 ==========
function showLoading(show) {
  if (show) loadingIndicator.classList.remove('hidden');
  else loadingIndicator.classList.add('hidden');
}

// ========== 页面加载完成 ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('拼贴诗编辑器已加载 - 更新版');

  // 如果页面已存在关键词（例如从 demoExtractKeywords），可以注册拖拽支持
  // 已通过 addKeywordTag 实现
});
