# Cloudinary Image Storage Setup

## Why Cloudinary?

Instead of using Supabase Storage (which is expensive), we're using **Cloudinary** which offers:
- **Free Tier**: 25GB storage + 25GB bandwidth/month
- **Image Optimization**: Automatic compression and format conversion
- **CDN**: Fast global delivery
- **Transformations**: Resize, crop, and optimize on-the-fly

## Setup Instructions

### 1. Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email

### 2. Get Your Credentials

1. Go to your Cloudinary Dashboard
2. Copy your:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

### 3. Add Environment Variables

Add these to your `.env.local` file:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Important**: 
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is public (safe to expose)
- `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are **private** (server-side only)

### 4. Restart Your Dev Server

```bash
npm run dev
```

## How It Works

1. **User uploads image** → Frontend sends to `/api/upload-image`
2. **API route validates** → Checks file type and size
3. **Uploads to Cloudinary** → Optimizes and stores image
4. **Returns URL** → Saves to database `avatar` field
5. **Displays image** → Uses Cloudinary CDN URL

## Alternative: ImgBB (Completely Free, No API Keys)

If you prefer a simpler solution with no API keys needed, you can use **ImgBB**:

### ImgBB Setup (Alternative)

1. Go to [imgbb.com](https://imgbb.com)
2. Get your API key from [api.imgbb.com](https://api.imgbb.com)
3. Update `app/api/upload-image/route.ts` to use ImgBB instead

**ImgBB Benefits**:
- ✅ Completely free
- ✅ No account needed for basic use
- ✅ Simple API
- ❌ Less features than Cloudinary
- ❌ No automatic optimization

## Usage

The image upload is now integrated into the profile edit dialog. Users can:
- Upload profile pictures (max 5MB)
- See preview before saving
- Remove uploaded images
- Images are automatically optimized by Cloudinary

## Cost Comparison

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| **Cloudinary** | 25GB storage + 25GB bandwidth | $89/month for 100GB |
| **Supabase Storage** | 1GB free | $0.021/GB/month |
| **ImgBB** | Unlimited (with API key) | Free |
| **Cloudflare R2** | 10GB free | $0.015/GB/month |

For a student project, **Cloudinary** or **ImgBB** are the best options!

