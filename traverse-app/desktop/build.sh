#!/bin/sh
# Rebuilds the Windows program: a window that opens https://www.exceltokml.com/traverse/app, so it
# signs in with the website's accounts and saves jobs to the website's database. Needs Node.js 18+.
# Bump "version" in neutralino.config.json and the file name in lib/traverse.ts when you rebuild.
set -e
cd "$(dirname "$0")"
rm -rf resources dist && mkdir -p resources/icons && cp icon-256.png resources/icons/
npx -y @neutralinojs/neu@11.8.0 update
npx -y @neutralinojs/neu@11.8.0 build --embed-resources
v=$(node -p "require('./neutralino.config.json').version")
cp dist/Traverse-Level-Adjustment/Traverse-Level-Adjustment-win_x64.exe "../../public/traverse/Traverse-Level-Adjustment-$v.exe"
echo "Done: public/traverse/Traverse-Level-Adjustment-$v.exe"
