#!/bin/bash

# GLM Estimator Start Script
# Starts the application in production or development mode

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SETUP_FLAG=".setup-complete"
CONFIG_FILE=".env"

# Check if setup has been completed
if [ ! -f "$SETUP_FLAG" ]; then
    echo -e "${YELLOW}⚠  Setup not completed.${NC}"
    echo -e "${YELLOW}   Running setup wizard...${NC}"
    echo ""
    ./setup.sh
    exit 0
fi

# Load environment
if [ -f "$CONFIG_FILE" ]; then
    export $(grep -v '^#' "$CONFIG_FILE" | xargs 2>/dev/null || true)
fi

# Default values
HOST="${HOST:-localhost}"
PORT="${PORT:-3000}"

# Parse arguments
MODE="dev"
for arg in "$@"; do
    case $arg in
        --prod|--production)
            MODE="prod"
            shift
            ;;
        --dev|--development)
            MODE="dev"
            shift
            ;;
        --build)
            MODE="build"
            shift
            ;;
        --help|-h)
            echo "Usage: ./start.sh [options]"
            echo ""
            echo "Options:"
            echo "  --prod, --production    Start in production mode"
            echo "  --dev, --development    Start in development mode (default)"
            echo "  --build                Build for production"
            echo "  --help, -h             Show this help message"
            exit 0
            ;;
    esac
done

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              GLM Estimator                                  ║"
echo "║          Professional Construction Estimating               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check database type
if [[ "$DATABASE_URL" == postgres* ]]; then
    DB_TYPE="PostgreSQL"
else
    DB_TYPE="SQLite"
fi

echo -e "${GREEN}✓ Database: ${DB_TYPE}${NC}"
echo ""

case $MODE in
    prod)
        echo -e "${CYAN}Starting in production mode...${NC}"
        echo ""
        
        # Build if needed
        if [ ! -d ".next" ]; then
            echo -e "${YELLOW}Building application...${NC}"
            npm run build
        fi
        
        # Generate Prisma client
        npx prisma generate
        
        # Start production server
        echo -e "${GREEN}Starting server on http://${HOST}:${PORT}${NC}"
        HOSTNAME="$HOST" PORT="$PORT" npm run start
        ;;
        
    build)
        echo -e "${CYAN}Building for production...${NC}"
        npm run build
        echo -e "${GREEN}✓ Build complete${NC}"
        ;;
        
    dev|*)
        echo -e "${CYAN}Starting in development mode...${NC}"
        echo -e "${GREEN}Server will be available at http://${HOST}:${PORT}${NC}"
        echo ""
        
        # Generate Prisma client
        npx prisma generate
        
        # Start development server with custom host/port
        HOSTNAME="$HOST" PORT="$PORT" npm run dev
        ;;
esac
