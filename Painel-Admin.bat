@echo off
title XGaming Admin Central
color 0b
echo ==========================================
echo        XGAMING - CENTRAL DE ADMIN
echo ==========================================
cd /d "%~dp0"

echo.
echo [1/3] Iniciando Servidor do Site (Vite)...
start /B npm run dev > nul 2>&1

echo [2/3] Iniciando Servidor do Scraper de Precos...
start /B npm run admin > nul 2>&1

echo [3/3] Preparando os modulos de IA e Banco de Dados...
timeout /t 4 /nobreak > nul

echo.
echo Tudo pronto! Abrindo o Painel no seu navegador...
start http://localhost:3000/admin.html

echo.
echo ==========================================
echo OS SERVIDORES ESTAO RODANDO!
echo. 
echo 1. Pode usar o painel no navegador normalmente.
echo 2. Quando terminar de adicionar os produtos, 
echo    basta fechar esta janela preta para 
echo    desligar o sistema com seguranca.
echo ==========================================
pause > nul
