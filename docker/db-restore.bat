@echo off
echo ==================================================
echo   🔄 TV-DLOG - Restaurando Banco de Dados
echo ==================================================
echo.
if not exist "%~dp0db_backup.sql" (
    echo [ERRO] O arquivo db_backup.sql nao foi encontrado na pasta docker!
    goto end
)
echo Limpando esquema existente no container tv-dlog-bd...
docker exec -i tv-dlog-bd psql -U tvdlog -d tvdlog -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
echo Restaurando dados a partir de db_backup.sql...
docker exec -i tv-dlog-bd psql -U tvdlog -d tvdlog < "%~dp0db_backup.sql"
echo.
echo ==================================================
echo   ✅ Banco de dados restaurado com sucesso!
echo ==================================================
:end
pause
