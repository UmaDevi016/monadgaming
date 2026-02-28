@echo off
echo.
echo  ========================================
echo   ChainCraft on Monad - Setup Script
echo  ========================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    echo   Download from: https://nodejs.org/
    exit /b 1
)

echo [1/4] Setting up environment...
if not exist .env (
    copy .env.example .env
    echo      Created .env from template
    echo      IMPORTANT: Edit .env with your API keys before running!
) else (
    echo      .env already exists
)

echo.
echo [2/4] Installing root dependencies...
call npm install
if %errorlevel% neq 0 ( echo [ERROR] npm install failed & exit /b 1 )

echo.
echo [3/4] Installing contracts dependencies...
cd contracts
call npm install
if %errorlevel% neq 0 ( echo [ERROR] contracts npm install failed & exit /b 1 )
cd ..

echo.
echo [4/5] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 ( echo [ERROR] backend npm install failed & exit /b 1 )
cd ..

echo.
echo [5/5] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 ( echo [ERROR] frontend npm install failed & exit /b 1 )
cd ..

echo.
echo  ========================================
echo   Setup Complete!
echo  ========================================
echo.
echo  Next steps:
echo  1. Edit .env with your API keys:
echo     - OPENAI_API_KEY (required for AI)
echo     - DEPLOYER_PRIVATE_KEY (for on-chain deployment)
echo  2. Deploy contracts (optional):
echo     cd contracts ^&^& npm run deploy
echo  3. Start the app:
echo     - Terminal 1: cd backend ^&^& npm run dev
echo     - Terminal 2: cd frontend ^&^& npm run dev
echo  4. Open http://localhost:3000
echo.
