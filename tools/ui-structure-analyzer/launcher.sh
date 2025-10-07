#!/bin/bash

# UI Structure Analyzer Launcher
# This script runs the analyzer in watch mode alongside your dev server

echo "🚀 Starting UI Structure Analyzer in watch mode..."
cd tools/ui-structure-analyzer
npx tsx run.ts --watch &
ANALYZER_PID=$!

echo "📊 UI Structure Analyzer running (PID: $ANALYZER_PID)"
echo "📝 Output: ui-structure-map.yaml"
echo "👁️  Watching for changes..."

# Trap to cleanup on exit
trap "echo 'Stopping analyzer...'; kill $ANALYZER_PID 2>/dev/null" EXIT

# Keep script running
wait $ANALYZER_PID