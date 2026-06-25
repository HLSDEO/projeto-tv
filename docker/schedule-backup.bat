@echo off
setlocal
set SCRIPT_PATH=%~dp0db-backup.bat

echo ==================================================
echo   ⏰ TV-DLOG - Agendando Backup Semanal (7 dias)
echo ==================================================
echo.
echo Este script agendara a execucao automatica do backup
echo a cada 7 dias no Windows Task Scheduler.
echo.
echo ATENCAO: E necessario rodar este script como Administrador.
echo.

:: Cria uma tarefa agendada semanal que roda todo domingo às 03:00 da manhã
schtasks /create /tn "TV-DLOG-Backup-Semanal" /tr "\"%SCRIPT_PATH%\"" /sc weekly /mo 1 /d SUN /st 03:00 /f

if %errorlevel% equ 0 (
    echo.
    echo ==================================================
    echo   ✅ Agendamento criado com sucesso!
    echo   O backup rodara toda semana (domingo as 03:00).
    echo ==================================================
) else (
    echo.
    echo ==================================================
    echo   ❌ Falha ao criar o agendamento.
    echo   Certifique-se de executar este prompt como Administrador.
    echo ==================================================
)
pause
