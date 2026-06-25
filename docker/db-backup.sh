#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
docker exec -i tv-dlog-bd pg_dump -U tvdlog -d tvdlog > "$DIR/db_backup.sql"
