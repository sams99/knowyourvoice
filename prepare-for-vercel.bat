@echo off
echo Preparing files for Vercel deployment...

REM Create a temporary folder for deployment
if exist "vercel-deploy" rmdir /s /q "vercel-deploy"
mkdir "vercel-deploy"

REM Copy all necessary files
echo Copying source files...
xcopy "src" "vercel-deploy\src" /E /I /Y
xcopy "supabase" "vercel-deploy\supabase" /E /I /Y
xcopy "dist" "vercel-deploy\dist" /E /I /Y

REM Copy configuration files
echo Copying configuration files...
copy "package.json" "vercel-deploy\"
copy "package-lock.json" "vercel-deploy\"
copy "vercel.json" "vercel-deploy\"
copy "vite.config.ts" "vercel-deploy\"
copy "tailwind.config.js" "vercel-deploy\"
copy "postcss.config.js" "vercel-deploy\"
copy "tsconfig.json" "vercel-deploy\"
copy "tsconfig.app.json" "vercel-deploy\"
copy "tsconfig.node.json" "vercel-deploy\"
copy "eslint.config.js" "vercel-deploy\"
copy "index.html" "vercel-deploy\"
copy "README.md" "vercel-deploy\"

REM Copy public folder if it exists
if exist "public" (
    echo Copying public folder...
    xcopy "public" "vercel-deploy\public" /E /I /Y
)

echo.
echo ✅ Files prepared in 'vercel-deploy' folder!
echo.
echo Next steps:
echo 1. Go to vercel.com
echo 2. Sign up/Login
echo 3. Click "New Project"
echo 4. Click "Browse all templates" or "Import"
echo 5. Drag and drop the 'vercel-deploy' folder
echo 6. Add your environment variables
echo 7. Click Deploy
echo.
pause

