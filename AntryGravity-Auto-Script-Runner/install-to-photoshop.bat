@echo off
setlocal enabledelayedexpansion

echo ==============================================================
echo   AntryGravity Auto Script Runner - Photoshop Installer
echo ==============================================================
echo.

:: 1. Enable CEP Debug Mode in Registry
echo [1/3] Enabling CEP Developer Mode in Registry...
reg add "HKCU\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
echo       PlayerDebugMode enabled successfully.
echo.

:: 2. Create CEP Extensions Directory if not existing
set "TARGET_DIR=%APPDATA%\Adobe\CEP\extensions\com.antrygravity.autoscriptrunner"
if not exist "%APPDATA%\Adobe\CEP\extensions" (
    mkdir "%APPDATA%\Adobe\CEP\extensions" >nul 2>&1
)

:: 3. Link or Copy extension
echo [2/3] Linking extension into Adobe CEP extensions folder...
if exist "%TARGET_DIR%" (
    echo       Extension already linked or installed in:
    echo       %TARGET_DIR%
) else (
    mklink /J "%TARGET_DIR%" "%~dp0" >nul 2>&1
    if errorlevel 1 (
        echo       Junction failed, copying files...
        xcopy /E /I /Y "%~dp0" "%TARGET_DIR%" >nul 2>&1
    )
    echo       Extension linked successfully to:
    echo       %TARGET_DIR%
)
echo.

:: 4. Photoshop Restart Notification
echo [3/3] Final Step:
echo.
tasklist /FI "IMAGENAME eq Photoshop.exe" 2>NUL | find /I /N "Photoshop.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo **************************************************************
    echo   IMPORTANT: Adobe Photoshop is currently RUNNING!
    echo   Photoshop ONLY loads new extensions during startup.
    echo.
    echo   1. Please CLOSE Photoshop completely.
    echo   2. RE-OPEN Photoshop.
    echo   3. Click: Window ^> Extensions ^> AntryGravity Auto Script Runner
    echo **************************************************************
) else (
    echo **************************************************************
    echo   Installation complete!
    echo   1. Open Adobe Photoshop.
    echo   2. Click: Window ^> Extensions ^> AntryGravity Auto Script Runner
    echo **************************************************************
)

echo.
pause
