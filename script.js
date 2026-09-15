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

// ========== 事件监听器 ==========
addTextBtn.addEventListener('click', addTextToCanvas);
processImageBtn.addEventListener('click', processImage);
saveBtn.addEventListener('click', saveProject);
exportBtn.addEventListener('click', exportAsImage);
clearBtn.addEventListener('click', clearCanvas);
fontSizeSlider.addEventListener('input', updateFontSizeDisplay);
rotationSlider.addEventListener('input', updateRotationDisplay);
closeEditBtn.addEventListener('click', closeEditPanel);
deleteBtn.addEventListener('click', deleteElement);
canvas.addEventListener('click', handleCanvasClick);

// ========== 文字元素管理 ==========
function createTextElement(text, options = {}) {
    const id = appState.elementIdCounter++;
    const fontSize = options.fontSize || 24;
    const rotation = options.rotation || 0;
    const color = options.color || '#000000';
    const bold = options.bold || false;
    const italic = options.italic || false;

    const element = {
        id,
        text,
        fontSize,
        rotation,
        color,
        bold,
        italic,
        x: Math.random() * 200,
        y: Math.random() * 200
    };

    appState.elements.push(element);
    renderElement(element);
    return id;
}

function renderElement(element) {
    const existingEl = document.getElementById(`elem-${element.id}`);
    if (existingEl) {
        existingEl.remove();
    }

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
        document.querySelectorAll('.text-element').forEach(el => {
            el.classList.remove('selected');
        });
        document.getElementById(`elem-${elementId}`).classList.add('selected');

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
    elementText.onchange = () => updateElement(elementId, { text: elementText.value });
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
        document.getElementById(`elem-${appState.selectedElementId}`).remove();
        closeEditPanel();
    }
}

function closeEditPanel() {
    editPanel.classList.add('hidden');
    document.querySelectorAll('.text-element').forEach(el => {
        el.classList.remove('selected');
    });
}

function handleCanvasClick(e) {
    if (e.target === canvas) {
        closeEditPanel();
    }
}

// ========== 文字输入 ==========
function addTextToCanvas() {
    const text = textInput.value.trim();
    if (text) {
        const fontSize = parseInt(fontSizeSlider.value);
        const rotation = parseInt(rotationSlider.value);
        const color = textColor.value;
        const bold = boldText.checked;
        const italic = italicText.checked;

        createTextElement(text, { fontSize, rotation, color, bold, italic });
        textInput.value = '';
    }
}

// ========== 图片处理 ==========
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
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                appState.uploadedImages.push({
                    src: e.target.result,
                    file: file
                });

                // 显示图片预览
                const preview = document.createElement('img');
                preview.src = e.target.result;
                preview.title = file.name;
                preview.onclick = () => extractKeywords(e.target.result);
                imagePreview.appendChild(preview);

                processedCount++;
                if (processedCount === files.length) {
                    showLoading(false);
                    // 自动提取关键词（演示用，实际使用需要 API）
                    demoExtractKeywords();
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function extractKeywords(imageSrc) {
    // 这里会调用实际的 AI API（如 Claude Vision）
    // 现在使用演示数据
    console.log('正在从图片提取关键词:', imageSrc);
    showLoading(true);

    // 模拟 API 调用
    setTimeout(() => {
        demoExtractKeywords();
        showLoading(false);
    }, 1500);
}

function demoExtractKeywords() {
    // 演示关键词（实际使用时由 AI 提取）
    const demoKeywords = ['诗意', '清晨', '光影', '流浪', '思考', '梦境', '远方', '回忆', '时间', '永恒'];
    
    appState.keywords = [];
    keywordsList.innerHTML = '';

    demoKeywords.forEach(keyword => {
        if (!appState.keywords.includes(keyword)) {
            appState.keywords.push(keyword);
            addKeywordTag(keyword);
        }
    });
}

function addKeywordTag(keyword) {
    const tag = document.createElement('div');
    tag.className = 'keyword-tag';
    tag.innerHTML = `
        ${keyword}
        <span class="remove">✕</span>
    `;

    tag.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove')) {
            tag.remove();
            appState.keywords = appState.keywords.filter(k => k !== keyword);
        } else {
            // 点击关键词添加到画布
            createTextElement(keyword, {
                fontSize: 24,
                rotation: Math.random() * 30 - 15,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
            });
        }
    });

    keywordsList.appendChild(tag);
}

// ========== 工具栏功能 ==========
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

    // 使用 html2canvas 库（需要在 HTML 中引入）
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
    if (show) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

// ========== 页面加载完成 ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('拼贴诗编辑器已加载');
    // 可以在这里添加初始化逻辑
});
