#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "$DIR/db_backup.sql" ]; then
    echo "[ERRO] O arquivo db_backup.sql não foi encontrado!"
    exit 1
fi
docker exec -i tv-dlog-bd psql -U tvdlog -d tvdlog -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec -i tv-dlog-bd psql -U tvdlog -d tvdlog < "$DIR/db_backup.sql"
