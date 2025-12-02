@echo off
chcp 65001 >nul
echo ========================================
echo   MULTAs v3.4 起動スクリプト
echo ========================================
echo.

REM Ollamaが起動しているか確認
echo [1/3] Ollama確認中...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       ✓ Ollama は既に起動しています
) else (
    echo       Ollamaを起動します...
    start "" "C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe"
    timeout /t 3 /nobreak >nul
)

REM v3.4起動
echo.
echo [2/3] MULTAs v3.4 起動中...
cd /d C:\projects\multas_auto-record-system2025\multas-v3-vercel
start "MULTAs-v3.4" cmd /k "npm run dev"

REM 5秒待つ
echo       サーバー起動を待機中...
timeout /t 5 /nobreak >nul

REM Cloudflare Tunnel起動
echo.
echo [3/3] Cloudflare Tunnel 起動中...
start "Cloudflare-Tunnel" cmd /k "cloudflared tunnel --url http://localhost:3000"

echo.
echo ========================================
echo   MULTAs v3.4 起動完了！
echo ========================================
echo.
echo   ローカル:   http://localhost:3000
echo   スマホ:     Cloudflare Tunnelのウィンドウに
echo               表示されるURLを使用してください
echo.
echo   停止方法:   各ウィンドウで Ctrl+C
echo ========================================
echo.
pause

