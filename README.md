# Vault - Modern File Storage Platform

A production-ready, full-stack file storage web application built with React, Node.js, and modern web technologies.

![Vault Screenshot](https://via.placeholder.com/800x400/1f2937/ffffff?text=Vault%20-%20File%20Storage)

## ✨ Features

### 🔐 Authentication & Security
- Email/password authentication with bcrypt encryption
- JWT sessions with httpOnly cookies
- Rate limiting and security headers
- CSRF protection and input validation

### 📁 File Management
- **Upload**: Drag-and-drop with progress tracking, multipart uploads for large files
- **Organization**: Create, rename, move, and delete folders and files
- **Preview**: In-app preview for PDF, images, audio, and video files
- **Search**: Find files by name, extension, type with filtering
- **Trash**: Soft delete with restore functionality and auto-purge

### 🎨 Modern Interface
- **Three Themes**: Light, Dim (gray), and Pure Black (AMOLED)
- **Responsive Design**: Mobile-first with bottom navigation and touch-friendly UI
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and ARIA labels
- **PWA Ready**: Service worker support with offline capabilities

### 🔗 Sharing & Collaboration  
- **Share Links**: Create secure links with expiry and password protection
- **Permissions**: View-only or download access control
- **Batch Operations**: Multi-select for bulk download, sharing, and deletion

### ☁️ Storage Options
- **S3 Compatible**: AWS S3, Cloudflare R2, MinIO support via presigned URLs
- **Local Fallback**: Filesystem storage for development and self-hosting
- **Range Requests**: Efficient media streaming with HTTP range support

## 🚀 Quick Start

### Prerequisites
- Node.js (>=20)
- PostgreSQL database (for production) or SQLite (for development)
- Optional: S3-compatible storage credentials

### Environment Setup

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL="file:./dev.db"  # SQLite for development
# DATABASE_URL="postgresql://user:pass@host:port/dbname"  # PostgreSQL for production

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Storage Configuration
STORAGE_DRIVER="local"  # or "s3"
LOCAL_STORAGE_PATH="/data/storage"  # Local storage path

# S3 Configuration (if using S3)
S3_ENDPOINT="https://s3.amazonaws.com"
S3_REGION="us-east-1"
S3_BUCKET="your-bucket-name"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"

# Application
SHARE_BASE_URL="http://localhost:5000"
TRASH_TTL_DAYS=30
PORT=5000
