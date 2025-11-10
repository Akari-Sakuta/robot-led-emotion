// DOM要素の取得: ロボットの目のLEDと操作パネル
const leftEyeLed = document.getElementById('left-eye-led');
const rightEyeLed = document.getElementById('right-eye-led');
const intensityValueSpan = document.getElementById('intensity-value');
let currentColor = '#ff0000'; // 現在選択されている色を保持する変数 (カラーコード形式に)
const colorWheelCanvas = document.getElementById('color-wheel-canvas');
const ctx = colorWheelCanvas ? colorWheelCanvas.getContext('2d') : null;

// 練習用ロボットのDOM要素の取得
const practiceLeftEyeLed = document.getElementById('practice-left-eye-led');
const practiceRightEyeLed = document.getElementById('practice-right-eye-led');
const practiceColorWheelCanvas = document.getElementById('practice-color-wheel-canvas');
const practiceCtx = practiceColorWheelCanvas ? practiceColorWheelCanvas.getContext('2d') : null;
const practiceIntensityValueSpan = document.getElementById('practice-intensity-value');
let practiceCurrentColor = '#ff0000'; // 練習用ページの色を保持する変数

// 選択項目を保持するグローバル変数
// 初期値は、ページの初期表示値に合わせて設定する
let selectedColorIndex = '#ff0000'; // カラーコードで保存
let selectedPatternIndex = 1;
let selectedIntensityIndex = 2500;

// 選択項目を一時的に保存する配列
const savedSelections = [];
// 各タスクで時間が経過したかどうかを保存する配列
const taskCompleted = [];
// 各タスクに初めてアクセスしたかどうかを記録する配列
const hasVisitedTask = [];

// 参加者情報を保持するグローバル変数
let participantData = {};
// 目の状態をアクティブにするかどうかを管理するフラグ
let isEyeActive = false;
// ユーザーが選択を行ったかどうかを追跡するフラグ
let hasMadeSelection = false;

// DOM要素の取得: タイマー機能
const timerDisplay = document.getElementById('timer-display');
let seconds = 0;
let minutes = 0;
let timerInterval;

// DOM要素の取得: 進捗の保存
let currentSet = 1;
const totalSets = 10;
const emotionList = [
    '怒り',
    '黄、点滅（滑らか）、速さ1200~1400ms',
    '恐れ',
    '信頼',
    '嫌悪',
    '驚き',
    '期待',
    'ピンク、下へ流れる、速さ3600~3800ms',
    '悲しみ',
    '喜び'
];

// DOM要素の取得: 結果の表示画面
const resultColorSpan = document.getElementById('result-color');
const resultPatternSpan = document.getElementById('result-pattern');
const resultIntensitySpan = document.getElementById('result-intensity');

// DOM要素の取得: 各ボタン
let endButton;
let backButton;
let startButton;
let submitSelectionButton;
let taskIntroButton;
let startMainButton;
let confirmYesButton;
let confirmNoButton;

// Googleフォームの項目IDとURLを定義
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSfq_hRIW0YguOmrTz_N_01j5Yl2PspdSc5IMLgpXhIxZ4B3fg/formResponse';

// 各タスク（感情）ごとの質問IDをオブジェクトにまとめて管理
const GOOGLE_FORM_ENTRIES = {
    '怒り': { color: 'entry.491303356', pattern: 'entry.409806865', intensity: 'entry.1878336323' },
    '黄、点滅（滑らか）、速さ1200~1400ms': { color: 'entry.1204286337', pattern: 'entry.802237711', intensity: 'entry.1801506477' },
    '恐れ': { color: 'entry.777098917', pattern: 'entry.589697965', intensity: 'entry.2113351545' },
    '信頼': { color: 'entry.1742265329', pattern: 'entry.245111734', intensity: 'entry.2028868153' },
    '嫌悪': { color: 'entry.350150990', pattern: 'entry.1570778382', intensity: 'entry.833062927' },
    '驚き': { color: 'entry.286520453', pattern: 'entry.102870304', intensity: 'entry.1927795365' },
    '期待': { color: 'entry.652292470', pattern: 'entry.585916459', intensity: 'entry.944012706' },
    'ピンク、下へ流れる、速さ3600~3800ms': { color: 'entry.512180379', pattern: 'entry.2063122289', intensity: 'entry.1130457384' },
    '悲しみ': { color: 'entry.996065062', pattern: 'entry.5850225', intensity: 'entry.1817038972' },
    '喜び': { color: 'entry.1073520370', pattern: 'entry.1512407861', intensity: 'entry.1185022503' }
};

// 参加者情報の質問IDも追加する必要があります。
const PARTICIPANT_FORM_ENTRIES = {
    age: 'entry.835215867',
    gender: 'entry.63043184',
    colorBlind: 'entry.1928358724'
};

/**
 * canvasにグラデーションの円環を描画する関数
 */
function drawColorWheel(canvas, ctx) {
    if (!ctx) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 75;

    // グラデーションの作成
    const gradient = ctx.createConicGradient(0, centerX, centerY);
    gradient.addColorStop(0, '#FF0000');
    gradient.addColorStop(0.166, '#FFFF00');
    gradient.addColorStop(0.333, '#00FF00');
    gradient.addColorStop(0.5, '#00FFFF');
    gradient.addColorStop(0.666, '#0000FF');
    gradient.addColorStop(0.833, '#FF00FF');
    gradient.addColorStop(1, '#FF0000');

    // 円環の描画
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI, true);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
}

/**
 * canvasがクリックされた位置から色を取得する関数
 */
function getColorFromWheel(e, canvas, ctx) {
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // クリック位置の角度を計算する
    let angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
    // 角度を0〜360度の範囲に調整
    if (angle < 0) {
        angle += 360;
    }
    
    // 角度から色を計算
    const hue = angle;
    // HSLからRGBに変換
    const s = 1;
    const l = 0.5;
    
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, hue / 360 + 1 / 3);
        g = hue2rgb(p, q, hue / 360);
        b = hue2rgb(p, q, hue / 360 - 1 / 3);
    }

    const hexColor = '#' + ('00' + (Math.round(r * 255)).toString(16)).slice(-2) +
        ('00' + (Math.round(g * 255)).toString(16)).slice(-2) +
        ('00' + (Math.round(b * 255)).toString(16)).slice(-2);
    
    return hexColor;
}

/**
 * RGBから16進数に変換するヘルパー関数
 */
function rgbToHex(r, g, b) {
    if (typeof r === 'string' && r.startsWith('rgb')) {
        const parts = r.match(/\d+/g).map(Number);
        r = parts[0];
        g = parts[1];
        b = parts[2];
    }
    if (r > 255 || g > 255 || b > 255) throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

/**
 * 汎用的な目の状態更新関数
 */
function updateEyeState(targetLed, targetPattern, targetIntensity) {
    isEyeActive = true;
    hasMadeSelection = true;
    
    const pageId = targetLed === leftEyeLed ? 'robot-page' : 'practice-page';
    
    const color = (pageId === 'robot-page') ? selectedColorIndex : getComputedStyle(practiceLeftEyeLed).backgroundColor;
    const pattern = (pageId === 'robot-page') ? document.getElementById('pattern-select').value : document.getElementById('practice-pattern-select').value;
    const intensity = (pageId === 'robot-page') ? document.getElementById('intensity-range').value : document.getElementById('practice-intensity-range').value;

    updateLeds(
        targetLed,
        (targetLed === leftEyeLed) ? rightEyeLed : practiceRightEyeLed,
        color,
        pattern,
        intensity
    );

    if (pageId === 'robot-page') {
        selectedPatternIndex = document.getElementById('pattern-select').selectedIndex + 1;
        selectedIntensityIndex = intensity;
        intensityValueSpan.textContent = intensity;
        saveCurrentSelection();
    } else {
        practiceIntensityValueSpan.textContent = intensity;
    }
}

/**
 * LEDの表示を更新するメイン関数
 * ユーザーの選択に応じて、LEDのスタイルとアニメーションを適用します。
 * @param {HTMLElement} leftLed - 左目のLED要素
 * @param {HTMLElement} rightLed - 右目のLED要素
 * @param {string} color - 選択された色
 * @param {string} pattern - 選択されたパターン
 * @param {number} intensity - 選択された強度
 */
function updateLeds(leftLed, rightLed, color, pattern, intensity) {
    // もし目が非アクティブ状態なら、グレーのままアニメーションを停止
    if (!isEyeActive) {
        leftLed.style.cssText = '';
        rightLed.style.cssText = '';
        leftLed.style.backgroundColor = '#bdbdbd';
        rightLed.style.backgroundColor = '#bdbdbd';
        leftLed.style.animationName = 'none';
        rightLed.style.animationName = 'none';
        return;
    }
    
    // 速さの計算
    const duration = intensity;

    // すべてのスタイルをリセット
    leftLed.style.cssText = '';
    rightLed.style.cssText = '';
    leftLed.style.animationName = 'none';
    rightLed.style.animationName = 'none';
    leftLed.classList.remove('rotate', 'split-drop', 'split-up');
    rightLed.classList.remove('rotate', 'split-drop', 'split-up');
    
    // 疑似要素のスタイルをリセットするための処理
    leftLed.style.removeProperty('--split-drop-gradient');
    rightLed.style.removeProperty('--split-drop-gradient');
    leftLed.style.removeProperty('--split-up-gradient');
    rightLed.style.removeProperty('--split-up-gradient');
    leftLed.style.removeProperty('--animation-duration');
    rightLed.style.removeProperty('--animation-duration');

    // わずかな遅延を挟んでから、新しいアニメーションを適用
    void leftLed.offsetWidth;
    void rightLed.offsetWidth;
    
    // RGBから16進数に変換するヘルパー関数
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    const rgb = hexToRgb(color);
    const rgbaColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;

    // --- 各発光パターンの処理 ---
    if (pattern === 'step-blink') {
        // 点滅（断続）: 透明度を瞬間的に切り替えて点滅を表現
        leftLed.style.backgroundColor = rgbaColor;
        rightLed.style.backgroundColor = rgbaColor;
        leftLed.style.border = `4px solid ${color}`;
        rightLed.style.border = `4px solid ${color}`;
        leftLed.style.animationName = 'step-blink';
        rightLed.style.animationName = 'step-blink';
    } else if (pattern === 'fade-blink') {
        // 点滅（滑らか）: 透明度を滑らかに変化させてフェードイン・アウトを表現
        leftLed.style.backgroundColor = rgbaColor;
        rightLed.style.backgroundColor = rgbaColor;
        leftLed.style.border = `4px solid ${color}`;
        rightLed.style.border = `4px solid ${color}`;
        leftLed.style.animationName = 'fade-blink';
        rightLed.style.animationName = 'fade-blink';
    } else if (pattern === 'rotate' || pattern === 'asymmetric-rotate') {
        // 回転パターン: conic-gradientで光る扇形を表現
        const conicGradient = `conic-gradient(${rgbaColor} 0deg 5deg, transparent 60deg 300deg, ${rgbaColor} 355deg 360deg)`;
        leftLed.style.backgroundImage = conicGradient;
        rightLed.style.backgroundImage = conicGradient;
        leftLed.classList.add('rotate');
        rightLed.classList.add('rotate');
        if (pattern === 'rotate') {
            leftLed.style.animationName = 'rotate-sector';
            rightLed.style.animationName = 'rotate-sector';
        } else if (pattern === 'asymmetric-rotate') {
            leftLed.style.animationName = 'rotate-sector-reverse';
            rightLed.style.animationName = 'rotate-sector';
        }
    } else if (pattern === 'split-drop') {
        // 下へ流れる（左右分割）
        leftLed.classList.add('split-drop');
        rightLed.classList.add('split-drop');
        const splitGradient = `conic-gradient(${rgbaColor} 0deg 5deg, transparent 50deg 310deg, ${rgbaColor} 355deg 360deg)`;
        // LED本体の背景を透明にする
        leftLed.style.backgroundColor = 'transparent';
        rightLed.style.backgroundColor = 'transparent';
        leftLed.style.setProperty('--split-drop-gradient', splitGradient);
        rightLed.style.setProperty('--split-drop-gradient', splitGradient);
        leftLed.style.setProperty('--animation-duration', duration + 'ms');
        rightLed.style.setProperty('--animation-duration', duration + 'ms');
    } else if (pattern === 'split-up') {
        // 上へ流れる（左右分割）
        leftLed.classList.add('split-up');
        rightLed.classList.add('split-up');
        // LED本体の背景を透明にする
        leftLed.style.backgroundColor = 'transparent';
        rightLed.style.backgroundColor = 'transparent';
        const upGradient = `conic-gradient(from 180deg, ${rgbaColor} 0deg 5deg, transparent 50deg 310deg, ${rgbaColor} 355deg 360deg)`;
        leftLed.style.setProperty('--split-up-gradient', upGradient);
        rightLed.style.setProperty('--split-up-gradient', upGradient);
        leftLed.style.setProperty('--animation-duration', duration + 'ms');
        rightLed.style.setProperty('--animation-duration', duration + 'ms');
    }
    
    // 共通のアニメーション設定
    leftLed.style.animationDuration = duration + 'ms';
    rightLed.style.animationDuration = duration + 'ms';
    leftLed.style.animationPlayState = 'running';
    rightLed.style.animationPlayState = 'running';
}

/**
 * 説明画面を表示する関数
 */
function showIntroPage() {
    // 全ての画面を非表示に
    document.getElementById('intro-page').style.display = 'flex';
    document.getElementById('selection-page').style.display = 'none';
    document.getElementById('robot-page').style.display = 'none';
    document.getElementById('final-page').style.display = 'none';
    document.getElementById('exit-page').style.display = 'none';
    document.getElementById('forced-exit-page').style.display = 'none';
    
    // ラジオボタンの初期状態を未選択に
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    genderRadios.forEach(radio => radio.checked = false);
    const colorBlindRadios = document.querySelectorAll('input[name="color-blind"]');
    colorBlindRadios.forEach(radio => radio.checked = false);
}

/**
 * 参加者情報入力画面を表示する関数
 */
function showSelectionPage() {
    document.getElementById('intro-page').style.display = 'none';
    document.getElementById('selection-page').style.display = 'flex';
}

/**
 * タスク説明画面を表示する関数
 */
function showTaskIntroPage() {
    document.getElementById('selection-page').style.display = 'none';
    document.getElementById('task-intro-page').style.display = 'flex';
}

/**
 * 実験退出画面を表示する関数
 */
function showExitPage() {
    clearInterval(timerInterval);
    document.getElementById('selection-page').style.display = 'none';
    document.getElementById('exit-page').style.display = 'flex';
}

/**
 * 強制退出画面を表示する関数
 */
function showForcedExitPage() {
    clearInterval(timerInterval);
    document.getElementById('robot-page').style.display = 'none';
    document.getElementById('forced-exit-page').style.display = 'flex';
}

/**
 * 練習ページを表示する関数
 */
function showPracticePage() {
    document.getElementById('task-intro-page').style.display = 'none';
    document.getElementById('practice-page').style.display = 'flex';
    
    // 練習ページではタイマーを停止
    clearInterval(timerInterval);
    
    // 練習用のロボットの目を初期化（グレー表示）
    isEyeActive = false;
    updateLeds(practiceLeftEyeLed, practiceRightEyeLed, '#bdbdbd', 'step-blink', 2500);
    drawColorWheel(practiceColorWheelCanvas, practiceCtx); // 練習ページ用のカラーホイールも描画

    // 練習用コントロールパネルのイベントリスナーを設定
    document.getElementById('practice-color-wheel-canvas').addEventListener('click', (e) => {
        isEyeActive = true;
        practiceCurrentColor = getColorFromWheel(e, practiceColorWheelCanvas, practiceCtx);
        updateLeds(practiceLeftEyeLed, practiceRightEyeLed, practiceCurrentColor, document.getElementById('practice-pattern-select').value, document.getElementById('practice-intensity-range').value);
    });

    document.getElementById('practice-pattern-select').addEventListener('change', (e) => {
        isEyeActive = true;
        const selectedPattern = e.target.value;
        const currentIntensity = document.getElementById('practice-intensity-range').value;
        updateLeds(practiceLeftEyeLed, practiceRightEyeLed, practiceCurrentColor, selectedPattern, currentIntensity);
    });

    document.getElementById('practice-intensity-range').addEventListener('input', (e) => {
        isEyeActive = true;
        const selectedIntensity = e.target.value;
        practiceIntensityValueSpan.textContent = selectedIntensity;
        const currentPattern = document.getElementById('practice-pattern-select').value;
        updateLeds(practiceLeftEyeLed, practiceRightEyeLed, practiceCurrentColor, currentPattern, selectedIntensity);
    });
}


/**
 * ページの初期状態をリセットし、メインページを開始する関数
 */
function startMainPage() {
    document.getElementById('practice-page').style.display = 'none';
    document.getElementById('robot-page').style.display = 'block';
    document.querySelector('h1').style.display = 'block';
    document.querySelector('p').style.display = 'block';
    document.getElementById('timer-container').style.display = 'block';
    document.getElementById('end-button-container').style.display = 'block';
    document.querySelector('.container').style.display = 'flex';
    drawColorWheel(colorWheelCanvas, ctx);
    document.getElementById('final-page').style.display = 'none';
    document.getElementById('forced-exit-page').style.display = 'none';
    document.getElementById('end-button').style.display = 'none';

    // タスク1では戻るボタンを表示しない
    if (currentSet === 1) {
        document.querySelector('.back-button-container').style.display = 'none';
    } else {
        document.querySelector('.back-button-container').style.display = 'block';
    }

    // タイマーをリセットして再開
    clearInterval(timerInterval);
    seconds = 0;
    minutes = 0;
    document.getElementById('timer-display').textContent = '00:00';
    startTimer();

    // ここでendButtonの無効化・有効化を制御
    if (taskCompleted[currentSet - 1]) {
        document.getElementById('end-button').classList.remove('disabled');
    } else {
        document.getElementById('end-button').classList.add('disabled');
    }
    document.getElementById('end-button').style.display = 'block';

    // 進捗バーとテキストを更新
    document.querySelector('.progress-bar').style.width = `${(currentSet / totalSets) * 100}%`;
    document.getElementById('current-set').textContent = currentSet;

    // 上部の指示文の感情のテキストを更新
    const emotionTextSpan = document.getElementById('emotion-text');
    if (emotionTextSpan) {
        emotionTextSpan.textContent = emotionList[currentSet - 1];
    }

    // UIの状態を復元
    const currentSelection = savedSelections[currentSet - 1];
    const prevColor = currentSelection.color;
    const prevPatternValue = document.getElementById('pattern-select').options[currentSelection.pattern - 1].value;
    const prevIntensityValue = currentSelection.intensity;

    // UI要素の値を設定
    currentColor = prevColor;
    selectedColorIndex = prevColor;
    selectedPatternIndex = currentSelection.pattern;
    selectedIntensityIndex = prevIntensityValue;
    document.getElementById('pattern-select').value = prevPatternValue;
    document.getElementById('intensity-range').value = prevIntensityValue;
    intensityValueSpan.textContent = prevIntensityValue;

    // タスクへの初回アクセスかどうかをチェック
    if (!hasVisitedTask[currentSet - 1]) {
        isEyeActive = false; // 初回は非アクティブに
        hasMadeSelection = false; // 初回は未選択状態
        hasVisitedTask[currentSet - 1] = true; // 訪問済みとしてマーク
    } else {
        isEyeActive = true; // 2回目以降はアクティブに
        hasMadeSelection = true; // 2回目以降は選択済み状態
    }

    // ロボットの目を更新
    updateLeds(leftEyeLed, rightEyeLed, prevColor, prevPatternValue, prevIntensityValue);
    
    // 最終ページに到達した場合は戻るボタンを非表示にする
    if (currentSet === 1) {
        document.getElementById('back-button').textContent = '説明画面へ戻る'
    } else if (currentSet === totalSets) {
        document.getElementById('back-button').textContent = '前のタスクに戻る';
        document.getElementById('end-button').textContent = '終了';
    } else {
        document.getElementById('back-button').textContent = '前のタスクに戻る';
        document.getElementById('end-button').textContent = '次のタスクへ';
    }
}

/**
 * 最終ページを表示する関数
 */
function showFinalPage() {
    // すべてのUIを非表示にする
    document.querySelector('h1').style.display = 'none';
    document.querySelector('p').style.display = 'none';
    document.getElementById('timer-container').style.display = 'none';
    document.getElementById('end-button-container').style.display = 'none';
    document.querySelector('.container').style.display = 'none';
    document.getElementById('forced-exit-page').style.display = 'none';

    // 戻るボタンのコンテナを非表示にする
    document.querySelector('.back-button-container').style.display = 'none';

    // 最終ページを表示
    document.getElementById('final-page').style.display = 'flex';
    document.getElementById('password-display').textContent = 'RobotEye2025';
}

/**
 * 警告ポップアップを表示する関数
 * @param {string} message - ポップアップに表示するメッセージ
 */
function showWarningModal(message) {
    document.getElementById('confirmation-modal').style.display = 'flex';
    document.querySelector('#confirmation-modal .modal-content p').textContent = message;
    
    // 「はい」「いいえ」ボタンを非表示にする
    document.getElementById('confirm-yes').style.display = 'none';
    document.getElementById('confirm-no').style.display = 'none';
    
    // 警告ポップアップの場合、OKボタンだけを表示
    let okButton = document.getElementById('ok-button');
    if (!okButton) {
        okButton = document.createElement('button');
        okButton.id = 'ok-button';
        okButton.textContent = '続ける';
        // 警告ポップアップのボタンにスタイルを適用
        okButton.style.padding = '10px 20px';
        okButton.style.fontSize = '1rem';
        okButton.style.borderRadius = '5px';
        okButton.style.border = 'none';
        okButton.style.cursor = 'pointer';
        okButton.style.backgroundColor = '#007bff';
        okButton.style.color = 'white';
        okButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        okButton.style.marginTop = '20px';

        // ホバー効果も追加
        okButton.onmouseover = () => { okButton.style.backgroundColor = '#0056b3'; };
        okButton.onmouseout = () => { okButton.style.backgroundColor = '#007bff'; };

        document.querySelector('#confirmation-modal .modal-buttons').appendChild(okButton);
    }
    
    okButton.onclick = () => {
        closeModal();
    };
}

/**
 * 終了確認ポップアップを表示する関数
 */
function showEndConfirmationModal() {
    document.getElementById('confirmation-modal').style.display = 'flex';
    document.querySelector('#confirmation-modal .modal-content p').innerHTML = '終了すると設定の変更はできません。<br>よろしいですか？';

    // 「はい」「いいえ」ボタンを表示する
    document.getElementById('confirm-yes').style.display = 'inline-block';
    document.getElementById('confirm-no').style.display = 'inline-block';
    
    // 警告ポップアップのOKボタンを非表示にする
    const okButton = document.getElementById('ok-button');
    if (okButton) {
        okButton.remove();
    }
}

/**
 * モーダルを閉じる共通関数
 */
function closeModal() {
    document.getElementById('confirmation-modal').style.display = 'none';
    // 警告ポップアップから戻った際にOKボタンを削除
    const okButton = document.getElementById('ok-button');
    if (okButton) {
        okButton.remove();
    }
}

/**
 * 参加者情報がすべて入力されているか検証する関数
 */
function validateParticipantData() {
    const ageInput = document.getElementById('age-input');
    const age = ageInput.value;
    const gender = document.querySelector('input[name="gender"]:checked');
    const colorBlind = document.querySelector('input[name="color-blind"]:checked');
    const ageError = document.getElementById('age-error');
    const genderError = document.getElementById('gender-error');
    const colorBlindError = document.getElementById('color-blind-error');

    let isValid = true;

    ageInput.classList.remove('error');
    ageError.textContent = '';
    genderError.textContent = '';
    colorBlindError.textContent = '';
    
    // 年齢のチェック（半角数字か）
    if (!/^[0-9]+$/.test(age) || age === '') {
        ageInput.classList.add('error');
        ageError.textContent = '半角数字で入力してください';
        isValid = false;
    } else {
        ageInput.classList.remove('error');
        ageError.textContent = '';
    }

    if (gender === null) {
        genderError.textContent = '選択してください';
        isValid = false;
    }
    
    if (colorBlind === null) {
        colorBlindError.textContent = '選択してください';
        isValid = false;
    }

    return isValid;
}

/**
 * データをGoogleフォームに送信する関数
 */
async function sendDataToGoogleForm(allData) {
    const dataToSend = {};
    
    for (const key in participantData) {
        if (participantData.hasOwnProperty(key)) {
            if (PARTICIPANT_FORM_ENTRIES[key]) {
                dataToSend[PARTICIPANT_FORM_ENTRIES[key]] = participantData[key];
            }
        }
    }

    // 目のパターンデータ
    for (let i = 0; i < allData.length; i++) {
        const currentTask = allData[i];
        const emotion = emotionList[i];
        const entries = GOOGLE_FORM_ENTRIES[emotion];
        
        dataToSend[entries.color] = currentTask.color;
        dataToSend[entries.pattern] = currentTask.pattern;
        dataToSend[entries.intensity] = currentTask.intensity;
    }
    
    const params = new URLSearchParams(dataToSend);
    const url = `${GOOGLE_FORM_URL}?${params.toString()}`;
    
    console.log('--- Googleフォームに送信するデータ ---');
    console.log(dataToSend);
    console.log('---');

    try {
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors'
        });
        console.log('すべてのデータ送信に成功しました。');
    } catch (error) {
        console.error('データ送信中にエラーが発生しました:', error);
        // エラーが発生しても、次の処理に進む
    }
}

/**
 * タイマーのカウントアップを行うための関数
 */
// 時間を「00:00」形式にフォーマットする関数
function formatTime(num) {
    return num < 10 ? `0${num}` : num;
}
// 1秒ごとにタイマーを更新する関数
function updateTimer() {
    seconds++;
    if (seconds === 60) {
        seconds = 0;
        minutes++;
    }
    // 5分が経過したら強制退出画面を表示
    if (minutes >= 5) {
        closeModal();
        showForcedExitPage();
        return; // これ以上タイマーを更新しない
    }
    const formattedMinutes = formatTime(minutes);
    const formattedSeconds = formatTime(seconds);
    timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
    
    // タイマーが終了ボタンを表示するロジックを修正
    if (minutes >= 1) {
        document.getElementById('end-button').classList.remove('disabled');
        document.getElementById('end-button').style.display = 'block';
        taskCompleted[currentSet - 1] = true;
    }
    // 確認タスク（タスク2、8）では1秒で有効化
    if ((currentSet === 2 || currentSet === 8) && seconds >= 1) {
        document.getElementById('end-button').classList.remove('disabled');
        document.getElementById('end-button').style.display = 'block';
        taskCompleted[currentSet - 1] = true;
    }
}
// タイマーを開始する関数
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(updateTimer, 1000);
}

/**
 * 選択内容を保存する関数
 */
function saveCurrentSelection() {
    const currentTaskData = {
        color: selectedColorIndex,
        pattern: selectedPatternIndex,
        intensity: selectedIntensityIndex
    };
    savedSelections[currentSet - 1] = currentTaskData;
}

/**
 *ページの初期化処理とタイマー機能
 */ 
document.addEventListener('DOMContentLoaded', () => {
    endButton = document.getElementById('end-button');
    backButton = document.getElementById('back-button');
    startButton = document.getElementById('start-button');
    submitSelectionButton = document.getElementById('submit-selection-button');
    taskIntroButton = document.getElementById('task-intro-button');
    startMainButton = document.getElementById('start-main-button');
    confirmYesButton = document.getElementById('confirm-yes');
    confirmNoButton = document.getElementById('confirm-no');

    // savedSelections配列を初期値で埋める
    for (let i = 0; i < totalSets; i++) {
        savedSelections.push({
            color: '#ff0000',
            pattern: 1,
            intensity: 2500
        });
        taskCompleted.push(false);
        hasVisitedTask.push(false);
    }

    // 「同意して続ける」ボタンがクリックされたときの処理
    startButton.addEventListener('click', () => {
        showSelectionPage();
    });

    // 「次へ」ボタンがクリックされたときの処理
    submitSelectionButton.addEventListener('click', () => {
        if (validateParticipantData()) {
            const colorBlindOption = document.querySelector('input[name="color-blind"]:checked').value;
            if (colorBlindOption === 'あり') {
                showExitPage();
            } else {
                participantData = {
                    'age': document.getElementById('age-input').value,
                    'gender': document.querySelector('input[name="gender"]:checked').value,
                    'color-blind': colorBlindOption
                };
                showTaskIntroPage();
            }
        }
    });

    // 「タスクを開始する」ボタンがクリックされたときの処理
    taskIntroButton.addEventListener('click', () => {
        showPracticePage();
    });

    // 「本番のタスクを開始する」ボタンがクリックされたときの処理
    startMainButton.addEventListener('click', () => {
        startMainPage();
    });

    // 「戻る」ボタンがクリックされたときの処理
    backButton.addEventListener('click', () => {
        const isSelectionPageVisible = document.getElementById('selection-page').style.display === 'flex';
        const isTaskIntroPageVisible = document.getElementById('task-intro-page').style.display === 'flex';
        const isRobotPageVisible = document.getElementById('robot-page').style.display === 'block';
        const isPracticePageVisible = document.getElementById('practice-page').style.display === 'flex';

        if (isSelectionPageVisible) {
            showIntroPage();
        } else if (isTaskIntroPageVisible) {
            showSelectionPage();
        } else if (isPracticePageVisible) {
            showTaskIntroPage();
        } else if (isRobotPageVisible && currentSet === 1) {
            showPracticePage();
        } else if (isRobotPageVisible && currentSet > 1) {
            currentSet--;
            startMainPage();
        }
    });

    // 「次のタスクへ（終了）」ボタンがクリックされた時の処理
    endButton.addEventListener('click', () => {
        if (endButton.classList.contains('disabled')) {
            return;
        }
        
        if (!hasMadeSelection) {
            showWarningModal('組み合わせを作成してください');
            return;
        }
        
        if (currentSet === totalSets) {
            showEndConfirmationModal();
        } else {
            currentSet++;
            startMainPage();
        }
    });

    // ポップアップのボタンイベントリスナー
    confirmYesButton.addEventListener('click', async () => {
        closeModal();
        await sendDataToGoogleForm(savedSelections);
        showFinalPage();
    });
    confirmNoButton.addEventListener('click', () => {
        closeModal();
    });
    
    // 汎用イベントリスナーをまとめて設定
    document.getElementById('color-wheel-canvas').addEventListener('click', (e) => {
        isEyeActive = true;
        hasMadeSelection = true;
        selectedColorIndex = getColorFromWheel(e, colorWheelCanvas, ctx);
        updateLeds(leftEyeLed, rightEyeLed, selectedColorIndex, document.getElementById('pattern-select').value, document.getElementById('intensity-range').value);
        saveCurrentSelection();
    });
    document.getElementById('pattern-select').addEventListener('change', () => {
        isEyeActive = true;
        hasMadeSelection = true;
        selectedPatternIndex = document.getElementById('pattern-select').selectedIndex + 1;
        updateLeds(leftEyeLed, rightEyeLed, selectedColorIndex, document.getElementById('pattern-select').value, document.getElementById('intensity-range').value);
        saveCurrentSelection();
    });
    document.getElementById('intensity-range').addEventListener('input', () => {
        isEyeActive = true;
        hasMadeSelection = true;
        selectedIntensityIndex = document.getElementById('intensity-range').value;
        intensityValueSpan.textContent = selectedIntensityIndex;
        updateLeds(leftEyeLed, rightEyeLed, selectedColorIndex, document.getElementById('pattern-select').value, selectedIntensityIndex);
        saveCurrentSelection();
    });
    
    // 練習用ページ用のUIをアクティブにする
    document.getElementById('practice-color-wheel-canvas').addEventListener('click', (e) => {
        isEyeActive = true;
        practiceCurrentColor = getColorFromWheel(e, practiceColorWheelCanvas, practiceCtx);
        updateLeds(practiceLeftEyeLed, practiceRightEyeLed, practiceCurrentColor, document.getElementById('practice-pattern-select').value, document.getElementById('practice-intensity-range').value);
    });
    document.getElementById('practice-pattern-select').addEventListener('change', (e) => {
        isEyeActive = true;
        const selectedPattern = e.target.value;
        const currentIntensity = document.getElementById('practice-intensity-range').value;
        updateLeds(practiceLeftEyeLed, practiceRightEyeLed, practiceCurrentColor, selectedPattern, currentIntensity);
    });
    document.getElementById('practice-intensity-range').addEventListener('input', (e) => {
        isEyeActive = true;
        const selectedIntensity = e.target.value;
        practiceIntensityValueSpan.textContent = selectedIntensity;
        const currentPattern = document.getElementById('practice-pattern-select').value;
        updateLeds(practiceLeftEyeLed, practiceRightEyeLed, practiceCurrentColor, currentPattern, selectedIntensity);
    });

    // アプリケーションはここからスタート
    showIntroPage();
});
