#!/bin/bash
# Quick test script to verify MOAA Dashboard + Backend integration

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "MOAA Dashboard Local Test"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check backend is running
echo "1. Checking if backend is running on http://localhost:4000..."
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "   ✓ Backend is running"
else
    echo "   ✗ Backend not found on localhost:4000"
    echo "   Start it with: cd infra && docker compose up --build"
    exit 1
fi

# Check /api/bills endpoint
echo ""
echo "2. Checking /api/bills endpoint..."
BILLS_COUNT=$(curl -s http://localhost:4000/api/bills | jq '.count // 0')
echo "   ✓ API returned $BILLS_COUNT bills"

if [ "$BILLS_COUNT" -eq 0 ]; then
    echo ""
    echo "   ⚠ No bills in database yet. Run ingest:"
    echo "     gh workflow run daily-ingest.yml"
    echo "   Or manually populate database with test data."
else
    echo "   ✓ Sample bills found, dashboard will show live data"
fi

# Show bill sample
echo ""
echo "3. Sample bill structure:"
curl -s http://localhost:4000/api/bills | jq '.bills[0]' 2>/dev/null || echo "   (No bills to display)"

# Check dashboard files
echo ""
echo "4. Checking dashboard files..."
if [ -f "index.html" ] && [ -f "js/api.js" ] && [ -f "js/dashboard.js" ]; then
    echo "   ✓ All dashboard files present"
else
    echo "   ✗ Missing dashboard files"
    exit 1
fi

# Instructions
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✓ Setup looks good! Next steps:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1. Start the dashboard web server:"
echo "   python3 -m http.server 8000"
echo "   (or: npx http-server -p 8000)"
echo ""
echo "2. Open browser to:"
echo "   http://localhost:8000"
echo ""
echo "3. Check browser console (F12 → Console) for:"
echo "   [moaa-legi] Loaded XX bills from live API"
echo ""
echo "4. If you see that, the integration is working!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
