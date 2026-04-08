@echo off
color 0a
title Activador de Dominio PRO
echo ==============================================
echo Configurando "debugai.local" en tu computadora...
echo ==============================================

net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Permisos de Administrador concedidos.
) else (
    echo [!] Solicitando permisos de Administrador a Windows...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

findstr /C:"127.0.0.1 debugai.local" "C:\Windows\System32\drivers\etc\hosts" >nul
if %errorLevel% == 0 (
    echo [OK] El dominio local ya estaba agregado.
) else (
    echo.>> "C:\Windows\System32\drivers\etc\hosts"
    echo 127.0.0.1 debugai.local>> "C:\Windows\System32\drivers\etc\hosts"
    echo [OK] ¡Dominio inyectado con exito!
)

ipconfig /flushdns >nul
echo [OK] Cache de navegadores limpiado.

echo.
echo =========================================================
echo TODO LISTO. Ve a tu navegador y entra a:
echo http://debugai.local:3000
echo =========================================================
pause
