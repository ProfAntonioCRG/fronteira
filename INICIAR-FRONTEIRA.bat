@echo off
title Fronteira - Sistema de Pedidos
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js LTS uma vez em https://nodejs.org e tente novamente.
  pause
  exit /b 1
)
node tools\servidor-local.mjs --open
if errorlevel 1 pause