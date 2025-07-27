// Phase 0: 基盤構築 - LocalStorageテストとモバイル対応確認

// LocalStorage キー
const STORAGE_KEY = 'multas_v3_test';

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    updateScreenInfo();
    testLoad();
});

// 画面情報更新
function updateScreenInfo() {
    document.getElementById('screen-width').textContent = window.innerWidth;
    document.getElementById('user-agent').textContent = navigator.userAgent;
    
    // リサイズ時も更新
    window.addEventListener('resize', () => {
        document.getElementById('screen-width').textContent = window.innerWidth;
    });
}

// LocalStorage保存テスト
function testSave() {
    const input = document.getElementById('test-input');
    const value = input.value.trim();
    
    if (!value) {
        alert('データを入力してください');
        return;
    }
    
    try {
        // 既存データを読み込み
        const existingData = localStorage.getItem(STORAGE_KEY);
        const data = existingData ? JSON.parse(existingData) : { records: [] };
        
        // 新しいレコードを追加
        data.records.push({
            id: Date.now(),
            text: value,
            timestamp: new Date().toISOString()
        });
        
        // 保存
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        alert('保存成功！');
        input.value = '';
        testLoad(); // 表示を更新
        
    } catch (error) {
        console.error('保存エラー:', error);
        alert('保存に失敗しました: ' + error.message);
    }
}

// LocalStorage読み込みテスト
function testLoad() {
    const output = document.getElementById('test-output');
    
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        
        if (!data) {
            output.innerHTML = '<p>保存されたデータはありません</p>';
            return;
        }
        
        const parsed = JSON.parse(data);
        
        if (!parsed.records || parsed.records.length === 0) {
            output.innerHTML = '<p>レコードがありません</p>';
            return;
        }
        
        // データを表示
        const html = parsed.records.map(record => `
            <div class="record">
                <strong>ID:</strong> ${record.id}<br>
                <strong>テキスト:</strong> ${record.text}<br>
                <strong>日時:</strong> ${new Date(record.timestamp).toLocaleString('ja-JP')}
            </div>
        `).join('');
        
        output.innerHTML = `
            <h3>保存されたデータ (${parsed.records.length}件)</h3>
            ${html}
        `;
        
    } catch (error) {
        console.error('読み込みエラー:', error);
        output.innerHTML = '<p style="color: red;">データの読み込みに失敗しました</p>';
    }
}

// LocalStorageクリアテスト
function testClear() {
    if (confirm('すべてのテストデータを削除しますか？')) {
        try {
            localStorage.removeItem(STORAGE_KEY);
            alert('クリア成功！');
            testLoad(); // 表示を更新
        } catch (error) {
            console.error('クリアエラー:', error);
            alert('クリアに失敗しました: ' + error.message);
        }
    }
}

// デバッグ用: LocalStorage容量チェック
function checkStorageUsage() {
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
        }
    }
    console.log(`LocalStorage使用量: ${(totalSize / 1024).toFixed(2)} KB`);
}

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('グローバルエラー:', event.error);
});