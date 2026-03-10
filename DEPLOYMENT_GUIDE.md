# 🚀 Hướng Dẫn Deploy Ứng Dụng Car Rental

## Tổng Quan
Ứng dụng sẽ được deploy lên các nền tảng miễn phí:
- **Database**: MongoDB Atlas (Free 512MB)
- **Backend API**: Render.com (Free tier)
- **Frontend**: Vercel (Free unlimited)

---

## 📋 Chuẩn Bị

### 1. Tạo Tài Khoản
Đảm bảo bạn có:
- [x] Tài khoản GitHub (để push code)
- [x] Tài khoản MongoDB Atlas: https://www.mongodb.com/cloud/atlas/register
- [x] Tài khoản Render: https://render.com/
- [x] Tài khoản Vercel: https://vercel.com/

---

## 🗄️ BƯỚC 1: Setup MongoDB Atlas

### 1.1 Tạo Database
1. Đăng nhập vào https://cloud.mongodb.com/
2. Click **"Build a Database"** hoặc **"Create"**
3. Chọn **M0 Free** tier
4. Chọn Region gần Việt Nam nhất (Singapore - ap-southeast-1)
5. Đặt tên cluster (ví dụ: `CarRentalCluster`)
6. Click **"Create"**

### 1.2 Tạo Database User
1. Trong tab **"Database Access"**
2. Click **"Add New Database User"**
3. Chọn **"Password"** authentication
4. Tạo username và password (LƯU LẠI - cần dùng sau)
   - Username: `carrental_user`
   - Password: Tạo password mạnh (ví dụ: `CarRental2026!`)
5. Database User Privileges: chọn **"Read and write to any database"**
6. Click **"Add User"**

### 1.3 Cho Phép Kết Nối Từ Mọi Nơi
1. Trong tab **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"**
4. IP Address sẽ là: `0.0.0.0/0`
5. Click **"Confirm"**

### 1.4 Lấy Connection String
1. Quay lại tab **"Database"**
2. Click nút **"Connect"** của cluster
3. Chọn **"Connect your application"**
4. Driver: **Node.js**, Version: **4.1 or later**
5. Copy connection string, có dạng:
   ```
   mongodb+srv://carrental_user:<password>@carrentalcluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Thay `<password>` bằng password thực tế của bạn
7. Thêm tên database vào cuối: `/carRental`
   ```
   mongodb+srv://carrental_user:CarRental2026!@carrentalcluster.xxxxx.mongodb.net/carRental?retryWrites=true&w=majority
   ```

**LƯU LẠI CONNECTION STRING NÀY!**

---

## 📤 BƯỚC 2: Push Code Lên GitHub

### 2.1 Tạo GitHub Repository
1. Đăng nhập GitHub
2. Click **"New repository"**
3. Đặt tên: `car-rental-app`
4. Chọn **Public** hoặc **Private**
5. **KHÔNG** check "Initialize this repository with a README"
6. Click **"Create repository"**

### 2.2 Push Code
Mở terminal trong thư mục `student_carRental`:

```bash
# Khởi tạo git (nếu chưa có)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Car Rental App"

# Add remote (thay YOUR_USERNAME và YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/car-rental-app.git

# Push
git branch -M main
git push -u origin main
```

---

## 🖥️ BƯỚC 3: Deploy Backend Lên Render

### 3.1 Tạo Web Service
1. Đăng nhập https://render.com/
2. Click **"New +"** → chọn **"Web Service"**
3. Click **"Connect GitHub"** và authorize
4. Chọn repository `car-rental-app`
5. Click **"Connect"**

### 3.2 Cấu Hình Web Service
Điền thông tin:
- **Name**: `car-rental-backend`
- **Region**: Singapore (gần VN nhất)
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### 3.3 Thêm Environment Variables
Trong mục **"Environment Variables"**, click **"Add Environment Variable"** và thêm:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://carrental_user:CarRental2026!@carrentalcluster.xxxxx.mongodb.net/carRental?retryWrites=true&w=majority
JWT_SECRET=a1358de8b445b3932eda1e9f01761deaec8c2127c8eb581e5e8b11c17ef89a94f28186d9f82f648fdc5bb1776490a18087d6b5f993def451287d8ac4d8be2476
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=24a454a99eba0cfc4dee333a5cc6e9ec6c22cc70191c7bd6d8fb342ea7e3ea69a60ac2d8b7fbe058c810224342dcc8d18a7b71bee8806aa5db09879733ebbd35
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=https://your-app-name.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**LƯU Ý**: 
- Thay `MONGODB_URI` bằng connection string thực của bạn
- `CORS_ORIGIN` sẽ cập nhật sau khi deploy frontend

### 3.4 Deploy
1. Click **"Create Web Service"**
2. Đợi Render build và deploy (3-5 phút)
3. Khi deploy xong, bạn sẽ có URL backend: `https://car-rental-backend.onrender.com`

**LƯU LẠI URL BACKEND NÀY!**

### 3.5 Seed Data (Khởi Tạo Dữ Liệu Mẫu)
1. Trong Render dashboard, vào service `car-rental-backend`
2. Click tab **"Shell"**
3. Chạy lệnh: `npm run seed`
4. Đợi script chạy xong

---

## 🌐 BƯỚC 4: Deploy Frontend Lên Vercel

### 4.1 Import Project
1. Đăng nhập https://vercel.com/
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Chọn repository `car-rental-app`
5. Click **"Import"**

### 4.2 Cấu Hình Project
- **Project Name**: `car-rental-app`
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4.3 Thêm Environment Variables
Click **"Environment Variables"** và thêm:

```
VITE_API_URL=https://car-rental-backend.onrender.com
```

**LƯU Ý**: Thay URL bằng URL backend thực của bạn từ Render

### 4.4 Deploy
1. Click **"Deploy"**
2. Đợi Vercel build và deploy (2-3 phút)
3. Khi deploy xong, bạn sẽ có URL frontend: `https://car-rental-app.vercel.app`

**LƯU LẠI URL FRONTEND NÀY!**

---

## 🔄 BƯỚC 5: Cập Nhật CORS Origin

### 5.1 Quay Lại Render
1. Vào Render dashboard → service `car-rental-backend`
2. Click tab **"Environment"**
3. Tìm biến `CORS_ORIGIN`
4. Sửa giá trị thành URL frontend của bạn:
   ```
   CORS_ORIGIN=https://car-rental-app.vercel.app
   ```
5. Click **"Save Changes"**
6. Service sẽ tự động restart

---

## ✅ BƯỚC 6: Kiểm Tra Ứng Dụng

### 6.1 Truy Cập Frontend
1. Mở trình duyệt, truy cập: `https://car-rental-app.vercel.app`
2. Ứng dụng sẽ hiển thị trang Home

### 6.2 Test Tính Năng
1. **Register**: Tạo tài khoản mới
2. **Login**: Đăng nhập với tài khoản vừa tạo
3. **Cars**: Xem danh sách xe
4. **Bookings**: Tạo booking mới

### 6.3 Kiểm Tra Backend API
Truy cập: `https://car-rental-backend.onrender.com/api/cars`
- Nếu thấy danh sách JSON cars → Backend hoạt động ✅

---

## 🎯 Tài Khoản Mặc Định (Sau Khi Seed Data)

### Admin Account
```
Email: admin@carrental.com
Password: Admin@123
```

### Customer Account
```
Email: customer1@example.com
Password: Customer@123
```

---

## 🔧 Cập Nhật Code Sau Này

### Cập Nhật Backend
```bash
# Từ thư mục student_carRental
cd backend
# Sửa code...
git add .
git commit -m "Update backend"
git push
# Render sẽ tự động deploy lại
```

### Cập Nhật Frontend
```bash
# Từ thư mục student_carRental
cd frontend
# Sửa code...
git add .
git commit -m "Update frontend"
git push
# Vercel sẽ tự động deploy lại
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Free Tier Limitations

**Render Free Tier:**
- Service sẽ **tự động sleep** sau 15 phút không hoạt động
- Request đầu tiên sau khi sleep sẽ mất 30-50 giây để wake up
- Giới hạn 750 giờ/tháng

**MongoDB Atlas Free Tier:**
- Giới hạn 512MB storage
- Kết nối tối đa 500 connections
- Không có backup tự động

**Vercel Free Tier:**
- Không giới hạn bandwidth
- 100GB bandwidth/tháng
- Build time: 6000 phút/tháng

### 2. Tốc Độ Loading Lần Đầu
- Vì Render free tier sleep sau 15 phút, lần đầu truy cập sẽ chậm
- Giải pháp: Dùng UptimeRobot để ping backend mỗi 5 phút (giữ service active)

### 3. Bảo Mật
- ✅ JWT secrets đã được tạo ngẫu nhiên
- ✅ CORS đã được cấu hình
- ✅ Helmet security headers
- ✅ Rate limiting

---

## 📝 Checklist Hoàn Thành

- [ ] Tạo MongoDB Atlas cluster và lấy connection string
- [ ] Push code lên GitHub
- [ ] Deploy backend lên Render
- [ ] Chạy seed data trên Render
- [ ] Deploy frontend lên Vercel
- [ ] Cập nhật CORS_ORIGIN trên Render
- [ ] Test đăng ký/đăng nhập
- [ ] Test xem danh sách cars
- [ ] Test tạo booking

---

## 🆘 Troubleshooting

### Frontend không kết nối được Backend
- Kiểm tra `VITE_API_URL` trong Vercel environment variables
- Kiểm tra `CORS_ORIGIN` trong Render environment variables
- Mở Console (F12) để xem lỗi

### Backend trả về 500 Error
- Kiểm tra Render logs: Dashboard → Service → Logs
- Kiểm tra MongoDB connection string
- Kiểm tra environment variables

### Không thể đăng nhập
- Kiểm tra đã chạy seed data chưa
- Mở Console (F12) xem lỗi API
- Thử clear localStorage và đăng nhập lại

---

## 📱 URLs Tham Khảo

**Ví dụ URLs sau khi deploy:**
- Frontend: `https://car-rental-app.vercel.app`
- Backend: `https://car-rental-backend.onrender.com`
- API Cars: `https://car-rental-backend.onrender.com/api/cars`

**YOUR ACTUAL URLs** (điền sau khi deploy):
- Frontend: `_______________________________`
- Backend: `_______________________________`

---

## 🎓 Nộp Bài Cho Giảng Viên

Cung cấp thông tin sau:

1. **URLs:**
   - Frontend URL: `https://car-rental-app.vercel.app`
   - Backend URL: `https://car-rental-backend.onrender.com`

2. **Tài khoản test:**
   - Admin: `admin@carrental.com` / `Admin@123`
   - Customer: `customer1@example.com` / `Customer@123`

3. **GitHub Repository:** `https://github.com/YOUR_USERNAME/car-rental-app`

4. **Screenshots:**
   - Trang Home
   - Trang Cars List
   - Trang Booking List
   - Render Dashboard (backend deployed)
   - Vercel Dashboard (frontend deployed)
   - MongoDB Atlas Dashboard

---

**Chúc bạn deploy thành công! 🎉**
