@echo off
chcp 65001 >nul
echo ========================================
echo   MULTAs v3.4 停止スクリプト
echo ========================================
echo.

echo [1/2] Node.js プロセス停止中...
taskkill /F /IM node.exe 2>nul
if "%ERRORLEVEL%"=="0" (
    echo       ✓ Node.js を停止しました
) else (
    echo       Node.js は起動していません
)

echo.
echo [2/2] Cloudflare Tunnel 停止中...
taskkill /F /IM cloudflared.exe 2>nul
if "%ERRORLEVEL%"=="0" (
    echo       ✓ Cloudflare Tunnel を停止しました
) else (
    echo       Cloudflare Tunnel は起動していません
)

echo.
echo ========================================
echo   MULTAs v3.4 停止完了！
echo ========================================
echo.
pause

