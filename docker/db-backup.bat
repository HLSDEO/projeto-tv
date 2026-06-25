@echo off
echo Executando pg_dump no container tv-dlog-bd...
docker exec -i tv-dlog-bd pg_dump -U tvdlog -d tvdlog > "%~dp0db_backup.sql"
echo Backup concluido!
