#!/bin/bash

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking Amenly Backend Installation...${NC}\n"

# Check Python version
echo -e "${BLUE}1. Python Version:${NC}"
python3 --version
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Python is installed${NC}\n"
else
    echo -e "${RED}✗ Python is not installed${NC}\n"
    exit 1
fi

# Check Poetry
echo -e "${BLUE}2. Poetry:${NC}"
if command -v poetry &> /dev/null; then
    poetry --version
    echo -e "${GREEN}✓ Poetry is installed${NC}\n"
else
    echo -e "${RED}✗ Poetry is not installed${NC}\n"
    echo -e "${YELLOW}Installing Poetry...${NC}"
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
fi

# Check virtual environment
echo -e "${BLUE}3. Virtual Environment:${NC}"
if [ -d ".venv" ]; then
    echo -e "${GREEN}✓ Virtual environment exists${NC}\n"
else
    echo -e "${YELLOW}⚠ Virtual environment not found${NC}"
    echo -e "${YELLOW}Run 'make install' to create it${NC}\n"
fi

# Check dependencies
echo -e "${BLUE}4. Dependencies:${NC}"
if [ -f "poetry.lock" ]; then
    echo -e "${GREEN}✓ poetry.lock exists${NC}"
    if [ -d ".venv" ]; then
        source .venv/bin/activate
        if python -c "import fastapi" 2>/dev/null; then
            echo -e "${GREEN}✓ Dependencies are installed${NC}\n"
        else
            echo -e "${YELLOW}⚠ Dependencies not fully installed${NC}"
            echo -e "${YELLOW}Run 'make install' to install them${NC}\n"
        fi
        deactivate
    fi
else
    echo -e "${YELLOW}⚠ poetry.lock not found${NC}"
    echo -e "${YELLOW}Run 'poetry lock' to create it${NC}\n"
fi

# Check environment file
echo -e "${BLUE}5. Environment Configuration:${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}\n"
else
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo -e "${YELLOW}Copy .env.example to .env and configure it${NC}\n"
fi

# Check Docker
echo -e "${BLUE}6. Docker (optional):${NC}"
if command -v docker &> /dev/null; then
    docker --version
    echo -e "${GREEN}✓ Docker is installed${NC}\n"
else
    echo -e "${YELLOW}⚠ Docker is not installed (optional)${NC}\n"
fi

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Installation check complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. ${GREEN}make install${NC}     - Install dependencies"
echo -e "  2. ${GREEN}make migrate${NC}     - Run database migrations"
echo -e "  3. ${GREEN}make dev${NC}         - Start development server"
echo -e "  4. ${GREEN}make help${NC}        - Show all available commands\n"
