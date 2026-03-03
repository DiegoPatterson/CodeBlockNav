#!/bin/bash

# BLOCK: Deployment Script

set -e  # Exit on error

# SUBBLOCK1: Configuration Variables

APP_NAME="myapp"
DEPLOY_ENV="${1:-production}"
BACKUP_DIR="/var/backups"
APP_DIR="/var/www/$APP_NAME"
LOG_FILE="/var/log/deploy.log"

# SUBBLOCK1: Pre-deployment Checks

echo "Starting deployment for $APP_NAME to $DEPLOY_ENV..."

# SUBBLOCK2: Check if Running as Root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exit 1
fi

# SUBBLOCK2: Verify Git Repository
if [ ! -d ".git" ]; then
    echo "Error: Not a git repository"
    exit 1
fi

# SUBBLOCK2: Check Disk Space
AVAILABLE_SPACE=$(df -h / | awk 'NR==2 {print $4}')
echo "Available disk space: $AVAILABLE_SPACE"

# SUBBLOCK1: Backup Current Version

# SUBBLOCK2: Create Backup Directory
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# SUBBLOCK2: Archive Current Files
if [ -d "$APP_DIR" ]; then
    echo "Backing up current version..."
    tar -czf "$BACKUP_DIR/$BACKUP_NAME/app.tar.gz" -C "$APP_DIR" .
    echo "Backup created: $BACKUP_DIR/$BACKUP_NAME"
fi

# SUBBLOCK1: Pull Latest Code

# SUBBLOCK2: Fetch Updates
echo "Fetching latest code..."
git fetch origin

# SUBBLOCK2: Checkout Branch
if [ "$DEPLOY_ENV" == "production" ]; then
    git checkout main
else
    git checkout develop
fi

# SUBBLOCK2: Pull Changes
git pull origin $(git branch --show-current)

# SUBBLOCK1: Build Application

# SUBBLOCK2: Install Dependencies
echo "Installing dependencies..."
if [ -f "package.json" ]; then
    npm install --production
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi

# SUBBLOCK2: Run Build Process
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    echo "Building application..."
    npm run build
fi

# SUBBLOCK1: Deploy Application

# SUBBLOCK2: Stop Running Services
echo "Stopping services..."
systemctl stop $APP_NAME || echo "Service not running"

# SUBBLOCK2: Copy Files
echo "Deploying files..."
rsync -av --exclude='.git' --exclude='node_modules' ./ $APP_DIR/

# SUBBLOCK2: Set Permissions
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# SUBBLOCK1: Post-deployment Tasks

# SUBBLOCK2: Run Database Migrations
if [ -f "migrate.sh" ]; then
    echo "Running database migrations..."
    bash migrate.sh
fi

# SUBBLOCK2: Start Services
echo "Starting services..."
systemctl start $APP_NAME
systemctl status $APP_NAME

# SUBBLOCK2: Health Check
sleep 5
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✓ Deployment successful!"
    echo "$(date): Deployment to $DEPLOY_ENV successful" >> $LOG_FILE
else
    echo "✗ Health check failed! Rolling back..."
    # SUBBLOCK3: Rollback on Failure
    tar -xzf "$BACKUP_DIR/$BACKUP_NAME/app.tar.gz" -C "$APP_DIR"
    systemctl restart $APP_NAME
    echo "$(date): Deployment failed, rolled back" >> $LOG_FILE
    exit 1
fi
