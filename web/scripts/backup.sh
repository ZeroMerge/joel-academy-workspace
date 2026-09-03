#!/bin/bash
# Nightly Supabase Backup Script for JOEL OS (Free Tier)
# Hook this up to a GitHub Actions cron job or a tiny VPS cron.

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set."
  exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="joel_os_backup_$TIMESTAMP.sql"

echo "Starting pg_dump..."
pg_dump "$DATABASE_URL" --clean --if-exists --no-owner --no-privileges > "$FILENAME"

if [ $? -eq 0 ]; then
  echo "Backup successful: $FILENAME"
  # Here you would add a curl command to upload to S3 or Cloudinary.
  # e.g., aws s3 cp "$FILENAME" s3://joel-os-backups/
else
  echo "Backup failed!"
  exit 1
fi
