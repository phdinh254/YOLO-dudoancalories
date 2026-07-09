@echo off
cd /d %~dp0
set PORT=8000
set DEPS_MARKER=.venv\.requirements-installed

powershell -NoProfile -ExecutionPolicy Bypass -Command "$conn = Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($conn) { $proc = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $conn.OwningProcess); Write-Host 'Port %PORT% dang duoc su dung boi PID' $conn.OwningProcess; Write-Host $proc.CommandLine; exit 1 }"
if errorlevel 1 (
    echo.
    echo Backend co the dang chay san tai http://127.0.0.1:%PORT%
    echo Neu muon chay lai, hay tat terminal backend cu hoac dung:
    echo   taskkill /PID ^<PID^> /F
    pause
    exit /b 1
)

py -3.12 -V >nul 2>nul
if %errorlevel%==0 (
    set "PYTHON_CMD=py -3.12"
) else (
    py -3.11 -V >nul 2>nul
    if %errorlevel%==0 (
        set "PYTHON_CMD=py -3.11"
    ) else (
        py -3.10 -V >nul 2>nul
        if %errorlevel%==0 (
            set "PYTHON_CMD=py -3.10"
        ) else (
            where py >nul 2>nul
            if %errorlevel%==0 (
                set "PYTHON_CMD=py"
            ) else (
                set "PYTHON_CMD=python"
            )
        )
    )
)

if not exist .venv\Scripts\python.exe (
    %PYTHON_CMD% -m venv .venv
)

call .venv\Scripts\activate.bat
if not exist %DEPS_MARKER% (
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo Khong cai duoc dependencies. Hay kiem tra Python/pip va thu lai.
        pause
        exit /b 1
    )
    type nul > %DEPS_MARKER%
) else (
    echo Dependencies da duoc cai truoc do. Xoa %DEPS_MARKER% neu muon cai lai.
)
python -m uvicorn app:app --reload --host 127.0.0.1 --port %PORT%
pause
