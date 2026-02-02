# AWS CLI Setup (Optional - Not Required for Deployment Tasks)

## ⚠️ Important Note

**You do NOT need AWS CLI for tasks 13.2-13.10.** The deployment tasks are designed to be done manually through AWS Console and SSH.

This guide is provided for reference if you want to automate AWS operations in the future.

---

## Installing AWS CLI (Optional)

### Windows Installation

**Option 1: MSI Installer (Recommended)**
```powershell
# Download and install AWS CLI v2
# Visit: https://awscli.amazonaws.com/AWSCLIV2.msi
# Run the installer

# Verify installation
aws --version
```

**Option 2: Chocolatey**
```powershell
choco install awscli
```

### Verify Installation
```powershell
aws --version
# Should output: aws-cli/2.x.x Python/3.x.x Windows/10
```

---

## Configuring AWS CLI (Optional)

### Step 1: Create IAM User with Programmatic Access

1. **Go to AWS Console** → IAM → Users
2. **Click "Add users"**
3. **User name:** `lms-deployment`
4. **Access type:** Check "Programmatic access"
5. **Permissions:** Attach policies:
   - `AmazonEC2FullAccess`
   - `AmazonVPCFullAccess`
6. **Create user** and **save credentials**:
   - Access Key ID: `AKIA...`
   - Secret Access Key: `wJalrXUtn...` (shown only once!)

### Step 2: Configure AWS CLI

```powershell
# Run configuration
aws configure

# Enter when prompted:
AWS Access Key ID: AKIA...
AWS Secret Access Key: wJalrXUtn...
Default region name: ap-southeast-1  # or your preferred region
Default output format: json
```

### Step 3: Verify Configuration

```powershell
# Test connection
aws sts get-caller-identity

# Should output:
# {
#     "UserId": "AIDA...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/lms-deployment"
# }
```

---

## AWS CLI Commands (Reference Only)

### EC2 Operations

```powershell
# List EC2 instances
aws ec2 describe-instances

# List security groups
aws ec2 describe-security-groups

# List Elastic IPs
aws ec2 describe-addresses

# Create key pair
aws ec2 create-key-pair --key-name lms-key --query 'KeyMaterial' --output text > lms-key.pem
```

### Useful Commands

```powershell
# Get instance status
aws ec2 describe-instance-status --instance-ids i-1234567890abcdef0

# Get instance public IP
aws ec2 describe-instances --instance-ids i-1234567890abcdef0 --query 'Reservations[0].Instances[0].PublicIpAddress'

# List available regions
aws ec2 describe-regions --output table
```

---

## Security Best Practices

### 1. Never Commit AWS Credentials
```bash
# Add to .gitignore (already included)
.aws/
*.pem
*.key
```

### 2. Use IAM Roles Instead of Access Keys (Production)
- Attach IAM role to EC2 instance
- No need to store credentials on server

### 3. Rotate Access Keys Regularly
- Rotate every 90 days
- Delete unused keys

### 4. Use MFA for IAM Users
- Enable MFA for all IAM users
- Especially for users with admin access

---

## When to Use AWS CLI

**Use AWS CLI for:**
- ✅ Automating repetitive tasks
- ✅ Scripting infrastructure setup
- ✅ CI/CD pipelines (advanced)
- ✅ Bulk operations

**Don't use AWS CLI for:**
- ❌ Initial learning (use Console instead)
- ❌ One-time setup (manual is fine)
- ❌ Visual understanding (Console is better)

---

## Troubleshooting

### Issue: "aws: command not found"
```powershell
# Restart PowerShell after installation
# Or add to PATH manually:
$env:Path += ";C:\Program Files\Amazon\AWSCLIV2"
```

### Issue: "Unable to locate credentials"
```powershell
# Run configuration again
aws configure

# Or check credentials file
cat ~/.aws/credentials
```

### Issue: "Access Denied"
```powershell
# Check IAM user permissions
aws iam get-user

# Verify attached policies
aws iam list-attached-user-policies --user-name lms-deployment
```

---

## Alternative: AWS Console (Recommended for Beginners)

For tasks 13.2-13.10, **use AWS Console instead of CLI**:

1. **Open browser** → https://console.aws.amazon.com/
2. **Navigate to EC2** → Launch instance
3. **Configure visually** → Easier to understand
4. **No credentials needed** → Just login to AWS account

**AWS Console is recommended for:**
- ✅ First-time AWS users
- ✅ Visual learners
- ✅ One-time infrastructure setup
- ✅ Understanding AWS services

---

## Summary

**For Task 13.2 (Configure Production Environment):**
- ❌ **DO NOT** install AWS CLI (not required)
- ✅ **DO** use AWS Console (web browser)
- ✅ **DO** use SSH (PowerShell) to connect to EC2

**AWS CLI is optional** and only useful for automation later. The deployment tasks are designed to work without it.

