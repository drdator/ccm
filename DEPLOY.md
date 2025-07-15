# CCM EC2 Deployment Guide

This guide walks through deploying CCM on an Amazon EC2 instance using Docker Compose.

## Prerequisites

- AWS EC2 instance (t3.small or larger recommended)
- Ubuntu 22.04 LTS or Amazon Linux 2023
- Security group with ports 22 (SSH), 80 (HTTP), 443 (HTTPS), and 3000 (API) open
- Domain name (optional, for SSL)

## Step 1: EC2 Instance Setup

1. **Launch EC2 Instance**
   - Choose Ubuntu 22.04 LTS or Amazon Linux 2023
   - Instance type: t3.small (minimum)
   - Storage: 20GB minimum
   - Security group rules:
     - SSH (22) from your IP
     - HTTP (80) from anywhere
     - HTTPS (443) from anywhere
     - Custom TCP (3000) from anywhere (for API)

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-public-ip
   # or for Amazon Linux
   ssh -i your-key.pem ec2-user@your-ec2-public-ip
   ```

## Step 2: Install Docker and Docker Compose

### For Ubuntu 22.04:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Logout and login again for group changes to take effect
exit
```

### For Amazon Linux 2023:
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
```

## Step 3: Deploy CCM

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/ccm.git
   cd ccm
   ```

2. **Create Environment File**
   ```bash
   cp .env.example .env
   
   # Generate a secure JWT secret
   openssl rand -hex 32
   
   # Edit .env file
   nano .env
   ```

   Update these values in `.env`:
   ```env
   JWT_SECRET=your-generated-secret-here
   CORS_ORIGIN=http://your-domain.com
   API_URL=http://your-domain.com:3000
   ```

3. **Build Docker Images**
   ```bash
   # Build all services
   docker-compose build
   
   # Or build individually
   docker-compose build api
   docker-compose build web
   docker-compose build cli
   ```

4. **Start Services**
   ```bash
   # Start in detached mode
   docker-compose up -d
   
   # Check logs
   docker-compose logs -f
   
   # Verify services are running
   docker-compose ps
   ```

## Step 4: Configure Nginx for SSL (Optional)

1. **Install Certbot**
   ```bash
   # Ubuntu
   sudo apt install certbot python3-certbot-nginx -y
   
   # Amazon Linux
   sudo yum install certbot python3-certbot-nginx -y
   ```

2. **Create Nginx SSL Configuration**
   ```bash
   nano nginx.prod.conf
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /.well-known/acme-challenge/ {
           root /var/www/certbot;
       }
       
       location / {
           return 301 https://$server_name$request_uri;
       }
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /etc/nginx/ssl/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/nginx/ssl/live/your-domain.com/privkey.pem;
       
       # SSL configuration
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       ssl_prefer_server_ciphers on;
       
       location / {
           proxy_pass http://web;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       location /api {
           proxy_pass http://api:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Obtain SSL Certificate**
   ```bash
   sudo certbot certonly --nginx -d your-domain.com
   ```

4. **Update Docker Compose for Production**
   ```bash
   # Stop current services
   docker-compose down
   
   # Use production compose file
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Step 5: Maintenance and Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
```

### Backup Database
```bash
# Create backup directory
mkdir -p ~/backups

# Backup SQLite database
docker-compose exec api cp /app/data/ccm-registry.db /app/data/ccm-registry.backup.db
docker cp ccm-api:/app/data/ccm-registry.backup.db ~/backups/ccm-registry-$(date +%Y%m%d-%H%M%S).db
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Monitor Resources
```bash
# Check container stats
docker stats

# Check disk usage
df -h

# Check system resources
htop
```

## Step 6: Security Best Practices

1. **Enable UFW Firewall**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 3000/tcp
   sudo ufw enable
   ```

2. **Set Up Automated Backups**
   ```bash
   # Create backup script
   nano ~/backup-ccm.sh
   ```

   Add:
   ```bash
   #!/bin/bash
   BACKUP_DIR=~/backups
   TIMESTAMP=$(date +%Y%m%d-%H%M%S)
   
   mkdir -p $BACKUP_DIR
   
   # Backup database
   docker cp ccm-api:/app/data/ccm-registry.db $BACKUP_DIR/ccm-registry-$TIMESTAMP.db
   
   # Keep only last 7 days of backups
   find $BACKUP_DIR -name "ccm-registry-*.db" -mtime +7 -delete
   ```

   ```bash
   chmod +x ~/backup-ccm.sh
   
   # Add to crontab (daily at 2 AM)
   crontab -e
   # Add: 0 2 * * * /home/ubuntu/backup-ccm.sh
   ```

3. **Monitor with CloudWatch (Optional)**
   ```bash
   # Install CloudWatch agent
   wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
   sudo rpm -U ./amazon-cloudwatch-agent.rpm
   ```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs api
docker-compose logs web

# Check container status
docker ps -a

# Restart specific service
docker-compose restart api
```

### Database Issues
```bash
# Access API container
docker-compose exec api sh

# Check database file
ls -la /app/data/

# Test database connection
sqlite3 /app/data/ccm-registry.db ".tables"
```

### Port Conflicts
```bash
# Check what's using ports
sudo lsof -i :80
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>
```

### SSL Certificate Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Set up auto-renewal (crontab)
sudo crontab -e
# Add: 0 0,12 * * * certbot renew --quiet
```

## Production Checklist

- [ ] Environment variables properly set
- [ ] JWT_SECRET is secure and unique
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Automated backups enabled
- [ ] Monitoring set up
- [ ] Log rotation configured
- [ ] Resource limits set in docker-compose
- [ ] Health checks verified
- [ ] Domain DNS configured

## Support

For issues or questions:
1. Check container logs: `docker-compose logs`
2. Review this deployment guide
3. Check project issues on GitHub
4. Contact support team