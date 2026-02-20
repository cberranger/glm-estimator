#!/bin/bash

# GLM Estimator Setup Script
# Interactive first-run setup with database configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
DEFAULT_HOST="192.168.1.10"
DEFAULT_PORT="357"
DEFAULT_PG_HOST="192.168.1.10"
DEFAULT_PG_PORT="5432"
DEFAULT_PG_DB="glm-estimator"
DEFAULT_PG_USER="postgres"
CONFIG_FILE=".env"
SETUP_FLAG=".setup-complete"

# Print banner
print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              GLM Estimator - Setup Wizard                   ║"
    echo "║          Professional Construction Estimating               ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if setup already completed
check_existing_setup() {
    if [ -f "$SETUP_FLAG" ]; then
        echo -e "${YELLOW}⚠  Setup has already been completed.${NC}"
        echo -e "${YELLOW}   Run './start.sh' to start the application.${NC}"
        echo ""
        read -p "Do you want to reconfigure? (y/N): " reconfigure
        if [[ ! $reconfigure =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}Exiting. Run './start.sh' to start the application.${NC}"
            exit 0
        fi
        rm -f "$SETUP_FLAG"
    fi
}

# Detect existing database configuration
detect_config() {
    if [ -f "$CONFIG_FILE" ]; then
        echo -e "${BLUE}📁 Found existing .env file${NC}"
        source "$CONFIG_FILE" 2>/dev/null || true
        
        if [ -n "$DATABASE_URL" ]; then
            if [[ "$DATABASE_URL" == postgres* ]]; then
                echo -e "${BLUE}   Currently configured for: PostgreSQL${NC}"
            else
                echo -e "${BLUE}   Currently configured for: SQLite${NC}"
            fi
        fi
    fi
}

# Configure host and port
configure_host_port() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Network Configuration${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Configure the host and port for the web interface."
    echo "This determines where the application will be accessible."
    echo ""
    
    read -p "Host IP [${DEFAULT_HOST}]: " app_host
    APP_HOST=${app_host:-$DEFAULT_HOST}
    
    read -p "Port [${DEFAULT_PORT}]: " app_port
    APP_PORT=${app_port:-$DEFAULT_PORT}
    
    echo -e "${GREEN}✓ Application will be available at: http://${APP_HOST}:${APP_PORT}${NC}"
}

# Interactive database selection
select_database() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Database Configuration${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Select your database:"
    echo ""
    echo -e "  ${GREEN}[1]${NC} PostgreSQL (External) ${YELLOW}- Recommended for production${NC}"
    echo -e "      Default: ${DEFAULT_PG_HOST}:${DEFAULT_PG_PORT}/${DEFAULT_PG_DB}"
    echo ""
    echo -e "  ${GREEN}[2]${NC} SQLite (Local) ${YELLOW}- Good for development/testing${NC}"
    echo -e "      File: ./db/custom.db"
    echo ""
    read -p "Select database type [1-2] (default: 1): " db_choice
    
    case ${db_choice:-1} in
        1)
            configure_postgresql
            ;;
        2)
            configure_sqlite
            ;;
        *)
            echo -e "${RED}Invalid choice. Using PostgreSQL as default.${NC}"
            configure_postgresql
            ;;
    esac
}

# Configure PostgreSQL
configure_postgresql() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  PostgreSQL Configuration${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    read -p "PostgreSQL host [${DEFAULT_PG_HOST}]: " pg_host
    PG_HOST=${pg_host:-$DEFAULT_PG_HOST}
    
    read -p "PostgreSQL port [${DEFAULT_PG_PORT}]: " pg_port
    PG_PORT=${pg_port:-$DEFAULT_PG_PORT}
    
    read -p "Database name [${DEFAULT_PG_DB}]: " pg_db
    PG_DB=${pg_db:-$DEFAULT_PG_DB}
    
    read -p "Username [${DEFAULT_PG_USER}]: " pg_user
    PG_USER=${pg_user:-$DEFAULT_PG_USER}
    
    read -sp "Password: " pg_pass
    echo ""
    
    # Construct DATABASE_URL
    DATABASE_URL="postgresql://${PG_USER}:${pg_pass}@${PG_HOST}:${PG_PORT}/${PG_DB}?schema=public"
    
    # Test connection
    echo ""
    echo -e "${YELLOW}Testing database connection...${NC}"
    
    # Write .env file
    cat > "$CONFIG_FILE" << EOF
# Network Configuration
HOST="${APP_HOST}"
PORT="${APP_PORT}"

# Database Configuration
DATABASE_URL="${DATABASE_URL}"

# Application Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF
    
    echo -e "${GREEN}✓ Configuration saved to ${CONFIG_FILE}${NC}"
    
    # Test connection with psql if available
    if command -v psql &> /dev/null; then
        if PGPASSWORD="$pg_pass" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -c "SELECT 1" &> /dev/null; then
            echo -e "${GREEN}✓ Database connection successful!${NC}"
        else
            echo -e "${YELLOW}⚠  Could not connect to database. Please check your credentials.${NC}"
            echo -e "${YELLOW}   You may need to create the database first.${NC}"
            read -p "Continue anyway? (y/N): " continue_anyway
            if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        echo -e "${YELLOW}⚠  psql not found. Skipping connection test.${NC}"
    fi
    
    DB_TYPE="postgresql"
}

# Configure SQLite
configure_sqlite() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  SQLite Configuration${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    mkdir -p ./db
    
    # Write .env file
    cat > "$CONFIG_FILE" << EOF
# Network Configuration
HOST="${APP_HOST}"
PORT="${APP_PORT}"

# Database Configuration
DATABASE_URL="file:./db/custom.db"

# Application Settings
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
EOF
    
    echo -e "${GREEN}✓ Configuration saved to ${CONFIG_FILE}${NC}"
    echo -e "${GREEN}✓ SQLite database will be created at ./db/custom.db${NC}"
    
    DB_TYPE="sqlite"
}

# Install dependencies
install_dependencies() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Installing Dependencies${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing npm dependencies...${NC}"
        npm install
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Dependencies already installed${NC}"
    fi
}

# Run Prisma migrations
run_migrations() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Database Migration${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${YELLOW}Generating Prisma client...${NC}"
    npx prisma generate
    
    echo ""
    echo -e "${YELLOW}Running database migrations...${NC}"
    
    if [ "$DB_TYPE" = "postgresql" ]; then
        # For PostgreSQL, use migrate
        npx prisma migrate deploy || npx prisma migrate dev --name init
    else
        # For SQLite, use db push
        npx prisma db push
    fi
    
    echo -e "${GREEN}✓ Database schema created${NC}"
}

# Import JSON data
import_data() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Data Import${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    JSON_DIR="./db/json"
    
    if [ -d "$JSON_DIR" ] && [ "$(ls -A $JSON_DIR/*.json 2>/dev/null)" ]; then
        echo -e "${GREEN}Found JSON data files in ${JSON_DIR}${NC}"
        echo ""
        ls -la "$JSON_DIR"/*.json 2>/dev/null || true
        echo ""
        
        read -p "Import JSON cost data? (Y/n): " do_import
        if [[ ! $do_import =~ ^[Nn]$ ]]; then
            echo -e "${YELLOW}Importing cost data...${NC}"
            npx tsx scripts/import-json-data.ts
            echo -e "${GREEN}✓ Data import complete${NC}"
        else
            echo -e "${YELLOW}Skipping data import. You can run it later with:${NC}"
            echo -e "${YELLOW}  npx tsx scripts/import-json-data.ts${NC}"
        fi
    else
        echo -e "${YELLOW}No JSON files found in ${JSON_DIR}${NC}"
        echo -e "${YELLOW}Skipping data import. Add JSON files and run:${NC}"
        echo -e "${YELLOW}  npx tsx scripts/import-json-data.ts${NC}"
    fi
}

# Create sample project
create_sample_data() {
    echo ""
    read -p "Create sample project with sample data? (Y/n): " create_sample
    if [[ ! $create_sample =~ ^[Nn]$ ]]; then
        echo -e "${YELLOW}Creating sample data...${NC}"
        npx tsx prisma/seed.ts
        echo -e "${GREEN}✓ Sample data created${NC}"
    fi
}

# Mark setup complete
complete_setup() {
    touch "$SETUP_FLAG"
    
    # Load config for display
    source "$CONFIG_FILE" 2>/dev/null || true
    
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ✓ Setup Complete!                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Application will be available at: ${CYAN}http://${HOST:-localhost}:${PORT:-3000}${NC}"
    echo ""
    echo -e "To start the application, run:"
    echo -e "  ${CYAN}./start.sh${NC}"
    echo ""
    echo -e "Or for development mode:"
    echo -e "  ${CYAN}npm run dev${NC}"
    echo ""
}

# Main execution
main() {
    print_banner
    check_existing_setup
    detect_config
    configure_host_port
    select_database
    install_dependencies
    run_migrations
    import_data
    create_sample_data
    complete_setup
}

main "$@"
