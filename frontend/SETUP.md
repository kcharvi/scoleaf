# Scoleaf Setup Guide

## 🚨 **Quick Setup:**

You need to set up your Supabase project for authentication. Here's how:

### **Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for it to finish setting up (2-3 minutes)

### **Step 2: Get Your Keys**
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - `Project URL`
   - `anon public` key

### **Step 3: Create Environment File**
Create a `.env` file in `/Users/charvikusuma/Documents/Charvi/github/scoleaf/frontend/`:
```bash
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### **Step 4: Run the App**
```bash
cd /Users/charvikusuma/Documents/Charvi/github/scoleaf/frontend
npm run dev
```

## ✅ **What's Been Fixed:**

1. **✅ Upload Button Functionality** - Now working properly
2. **✅ Simplified Upload UI** - No more complex dropdowns
3. **✅ Z-index Issues Fixed** - Dialogs now appear above all content
4. **✅ Email Authentication** - Clean, simple sign up/sign in
5. **✅ PDF Limit Updated** - 1 PDF with 3 upload attempts per user

## 🎯 **Current Features:**

- **Landing Page** with modern bento box design
- **Email Authentication** (sign up/sign in with email & password)
- **Single PDF Upload** with 3 replacement attempts  
- **Working User Menu** with sign-out
- **Fixed Z-index** - All dialogs appear properly
- **Simplified UI** - Clean and functional

## 📱 **Upload System:**

- ✅ Users can upload **1 PDF at a time**
- ✅ **3 upload attempts** total per user
- ✅ Can **replace** current PDF if attempts remaining
- ✅ **Clear indication** of remaining attempts
- ✅ **Simple interface** - just click "Upload PDF"

Your app will work immediately after creating the `.env` file! 🎉 