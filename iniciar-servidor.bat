@echo off
REM ============================================
REM  Servidor local Inmuebles sXX
REM  Version IPv4 (compatible con localhost)
REM ============================================

echo.
echo ====================================
echo  Tepuku - Inmuebles sXX
echo  Servidor local en puerto 8000
echo ====================================
echo.
echo Sitio disponible en:
echo   http://localhost:8000
echo   http://127.0.0.1:8000
echo.
echo Para detener: Ctrl + C
echo.

cd /d "%~dp0"

REM Forzar bind a IPv4
python -m http.server 8000 --bind 127.0.0.1 2>nul
if %errorlevel% neq 0 (
    py -m http.server 8000 --bind 127.0.0.1
)

pause
