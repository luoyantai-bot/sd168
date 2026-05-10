#!/bin/sh
set -e

echo "🔄 Syncing database schema..."
npx prisma db push --skip-generate 2>&1 || echo "⚠️ prisma db push warning (tables may already exist)"

echo "🚀 Starting Next.js server on port 3000..."
node server.js
