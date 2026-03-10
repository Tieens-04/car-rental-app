# 🚀 Quick Start - Deploy trong 10 Phút

## Tóm Tắt Nhanh

Dự án sử dụng:
- **MongoDB Atlas** (database) - Free 512MB
- **Render.com** (backend) - Free tier
- **Vercel** (frontend) - Free unlimited

---

## ⚡ Các Bước Deploy Nhanh

### 1️⃣ Setup MongoDB Atlas (3 phút)
1. Đăng ký tại: https://www.mongodb.com/cloud/atlas/register
2. Tạo **M0 Free** cluster ở Singapore
3. Tạo database user: 
   - Username: `carrental_user`
   - Password: (tạo password mạnh)
4. Network Access: Add IP `0.0.0.0/0` (Allow from anywhere)
5. Lấy **Connection String**:
   ```
   mongodb+srv://carrental_user:YOUR_PASSWORD@cluster.xxxxx.mongodb.net/carRental?retryWrites=true&w=majority
   ```

### 2️⃣ Push Code Lên GitHub (2 phút)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/car-rental-app.git
git push -u origin main
```

### 3️⃣ Deploy Backend - Render.com (3 phút)
1. Đăng ký: https://render.com/
2. New Web Service → Connect GitHub → Chọn repo
3. Cấu hình:
   - Name: `car-rental-backend`
   - Region: `Singapore`
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
4. **Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=<YOUR_MONGODB_CONNECTION_STRING>
   JWT_SECRET=a1358de8b445b3932eda1e9f01761deaec8c2127c8eb581e5e8b11c17ef89a94f28186d9f82f648fdc5bb1776490a18087d6b5f993def451287d8ac4d8be2476
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=24a454a99eba0cfc4dee333a5cc6e9ec6c22cc70191c7bd6d8fb342ea7e3ea69a60ac2d8b7fbe058c810224342dcc8d18a7b71bee8806aa5db09879733ebbd35
   JWT_REFRESH_EXPIRES_IN=30d
   CORS_ORIGIN=https://your-app.vercel.app
   ```
5. Deploy → Copy Backend URL: `https://car-rental-backend.onrender.com`

### 4️⃣ Seed Database (1 phút)
Trong Render Dashboard:
- Shell tab → Run: `npm run seed`

### 5️⃣ Deploy Frontend - Vercel (2 phút)
1. Đăng ký: https://vercel.com/
2. Import Git Repository → Chọn repo
3. Cấu hình:
   - Framework: `Vite`
   - Root Directory: `frontend`
   - Build: `npm run build`
4. **Environment Variable:**
   ```
   VITE_API_URL=https://car-rental-backend.onrender.com
   ```
5. Deploy → Copy Frontend URL: `https://car-rental-app.vercel.app`

### 6️⃣ Update CORS (1 phút)
Quay lại Render.com:
- Service → Environment → `CORS_ORIGIN`
- Sửa thành: `https://car-rental-app.vercel.app` (URL frontend thực tế)
- Save Changes

---

## ✅ Kiểm Tra

1. Truy cập Frontend URL
2. Test đăng nhập:
   - Email: `admin@carrental.com`
   - Password: `Admin@123`

---

## 📌 Lưu Ý Quan Trọng

### ⚠️ Render Free Tier
- Backend sẽ **sleep** sau 15 phút không hoạt động
- Request đầu tiên sau khi sleep mất ~30 giây để wake up
- **Giải pháp**: Dùng cron-job.org hoặc UptimeRobot để ping mỗi 5 phút

### 🔐 Thông Tin Nộp Bài

**URLs:**
- Frontend: `___________________________`
- Backend: `___________________________`

**Tài khoản demo:**
- Admin: `admin@carrental.com` / `Admin@123`
- Customer: `customer1@example.com` / `Customer@123`

**GitHub:** `___________________________`

---

## 📚 Hướng Dẫn Chi Tiết

Xem file [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) để có hướng dẫn đầy đủ với screenshots và troubleshooting.

---

## 🆘 Gặp Vấn Đề?

### Frontend không kết nối Backend
- Kiểm tra `VITE_API_URL` trong Vercel
- Kiểm tra `CORS_ORIGIN` trong Render
- F12 → Console để xem lỗi

### Backend Error 500
- Render → Logs để xem lỗi
- Kiểm tra MongoDB connection string
- Kiểm tra environment variables

### Không thể đăng nhập
- Kiểm tra đã chạy `npm run seed` chưa
- Clear localStorage và thử lại

---

**Chúc bạn deploy thành công! 🎉**
