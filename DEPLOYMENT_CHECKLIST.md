# ✅ Deployment Checklist - Car Rental App

Sử dụng checklist này để đảm bảo bạn không bỏ sót bước nào khi deploy.

---

## 📋 Pre-Deployment Checklist

### ☑️ Chuẩn Bị
- [ ] Đã đọc [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [ ] Đã đọc [QUICK_START.md](./QUICK_START.md)
- [ ] Code chạy tốt trên localhost
- [ ] Đã test tất cả tính năng (login, CRUD, booking)

### ☑️ Tài Khoản
- [ ] GitHub account
- [ ] MongoDB Atlas account
- [ ] Render.com account
- [ ] Vercel account

---

## 🗄️ BƯỚC 1: MongoDB Atlas

- [ ] **1.1** Đăng ký MongoDB Atlas
- [ ] **1.2** Tạo M0 Free Cluster (Region: Singapore)
- [ ] **1.3** Đặt tên cluster: `CarRentalCluster` (hoặc tên khác)
- [ ] **1.4** Chờ cluster được tạo (2-3 phút)
- [ ] **1.5** Tạo Database User
  - Username: `_________________`
  - Password: `_________________` (LƯU LẠI!)
  - Role: Read & Write to any database
- [ ] **1.6** Network Access → Add IP `0.0.0.0/0` (Allow from anywhere)
- [ ] **1.7** Lấy Connection String
  - Click "Connect" → "Connect your application"
  - Copy connection string
  - Thay `<password>` bằng password thực
  - Thêm `/carRental` vào cuối
- [ ] **1.8** Lưu Connection String:
  ```
  mongodb+srv://_______________________________________________
  ```

---

## 📤 BƯỚC 2: GitHub

- [ ] **2.1** Tạo repository mới trên GitHub
  - Repository name: `car-rental-app` (hoặc tên khác)
  - Public hoặc Private
- [ ] **2.2** Clone/Open project trong VS Code
- [ ] **2.3** Chạy git commands:
  ```bash
  git init
  git add .
  git commit -m "Initial commit - Car Rental App"
  git remote add origin https://github.com/YOUR_USERNAME/car-rental-app.git
  git branch -M main
  git push -u origin main
  ```
- [ ] **2.4** Verify code đã lên GitHub
- [ ] **2.5** Lưu GitHub URL:
  ```
  https://github.com/_______________________________________
  ```

---

## 🖥️ BƯỚC 3: Deploy Backend (Render.com)

- [ ] **3.1** Đăng ký Render.com
- [ ] **3.2** Connect GitHub account
- [ ] **3.3** New Web Service
- [ ] **3.4** Chọn repository `car-rental-app`
- [ ] **3.5** Cấu hình service:
  - Name: `car-rental-backend`
  - Region: `Singapore`
  - Root Directory: `backend`
  - Runtime: `Node`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Instance Type: `Free`
- [ ] **3.6** Add Environment Variables:
  ```
  NODE_ENV=production
  PORT=3000
  MONGODB_URI=<your_mongodb_connection_string>
  JWT_SECRET=a1358de8b445b3932eda1e9f01761deaec8c2127c8eb581e5e8b11c17ef89a94f28186d9f82f648fdc5bb1776490a18087d6b5f993def451287d8ac4d8be2476
  JWT_EXPIRES_IN=7d
  JWT_REFRESH_SECRET=24a454a99eba0cfc4dee333a5cc6e9ec6c22cc70191c7bd6d8fb342ea7e3ea69a60ac2d8b7fbe058c810224342dcc8d18a7b71bee8806aa5db09879733ebbd35
  JWT_REFRESH_EXPIRES_IN=30d
  CORS_ORIGIN=https://your-app.vercel.app
  RATE_LIMIT_WINDOW_MS=900000
  RATE_LIMIT_MAX_REQUESTS=100
  ```
- [ ] **3.7** Click "Create Web Service"
- [ ] **3.8** Đợi build & deploy (3-5 phút)
- [ ] **3.9** Kiểm tra Logs - không có error
- [ ] **3.10** Lưu Backend URL:
  ```
  https://_______________________________________________
  ```
- [ ] **3.11** Test endpoint:
  - Truy cập: `https://your-backend.onrender.com/health`
  - Kết quả phải: `{"success":true,"status":"OK",...}`

### Seed Database
- [ ] **3.12** Trong Render dashboard → Shell tab
- [ ] **3.13** Run command: `npm run seed`
- [ ] **3.14** Đợi script chạy xong
- [ ] **3.15** Verify: `https://your-backend.onrender.com/api/cars`
  - Phải có danh sách cars (JSON)

---

## 🌐 BƯỚC 4: Deploy Frontend (Vercel)

- [ ] **4.1** Đăng ký Vercel.com
- [ ] **4.2** Connect GitHub account
- [ ] **4.3** Import repository `car-rental-app`
- [ ] **4.4** Cấu hình project:
  - Project Name: `car-rental-app`
  - Framework Preset: `Vite`
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist`
- [ ] **4.5** Add Environment Variable:
  ```
  VITE_API_URL=<your_render_backend_url>
  ```
  - Ví dụ: `https://car-rental-backend.onrender.com`
- [ ] **4.6** Click "Deploy"
- [ ] **4.7** Đợi build & deploy (2-3 phút)
- [ ] **4.8** Kiểm tra deploy status - phải "Ready"
- [ ] **4.9** Lưu Frontend URL:
  ```
  https://_______________________________________________
  ```

---

## 🔄 BƯỚC 5: Update CORS Origin

- [ ] **5.1** Copy Frontend URL từ Vercel
- [ ] **5.2** Quay lại Render dashboard
- [ ] **5.3** Vào service `car-rental-backend`
- [ ] **5.4** Tab "Environment"
- [ ] **5.5** Tìm biến `CORS_ORIGIN`
- [ ] **5.6** Update value thành Frontend URL:
  ```
  https://car-rental-app.vercel.app
  ```
  (Thay bằng URL thực tế của bạn)
- [ ] **5.7** Click "Save Changes"
- [ ] **5.8** Đợi service restart (1 phút)

---

## ✅ BƯỚC 6: Testing

### Test Frontend
- [ ] **6.1** Truy cập Frontend URL
- [ ] **6.2** Trang Home hiển thị đúng
- [ ] **6.3** Không có error trong Console (F12)

### Test Authentication
- [ ] **6.4** Click "Register" → Tạo account mới
  - Email: `_________________`
  - Password: `_________________`
- [ ] **6.5** Đăng ký thành công
- [ ] **6.6** Đăng nhập với account vừa tạo
- [ ] **6.7** Đăng nhập thành công, redirect về Home

### Test Admin Features
- [ ] **6.8** Logout
- [ ] **6.9** Đăng nhập với Admin account:
  - Email: `admin@carrental.com`
  - Password: `Admin@123`
- [ ] **6.10** Vào trang "Cars" → Xem danh sách xe
- [ ] **6.11** Vào trang "Bookings" → Xem danh sách bookings
- [ ] **6.12** (Optional) Tạo car mới
- [ ] **6.13** (Optional) Tạo booking mới

### Test Customer Features
- [ ] **6.14** Logout
- [ ] **6.15** Đăng nhập với Customer account:
  - Email: `customer1@example.com`
  - Password: `Customer@123`
- [ ] **6.16** Xem Cars List
- [ ] **6.17** Click "Book" một xe
- [ ] **6.18** Tạo booking thành công
- [ ] **6.19** Vào "My Bookings" → Thấy booking vừa tạo

### Test API Directly
- [ ] **6.20** Truy cập: `https://your-backend.onrender.com/api/cars`
  - Phải trả về JSON với danh sách cars
- [ ] **6.21** Truy cập: `https://your-backend.onrender.com/health`
  - Phải trả về: `{"success":true,"status":"OK",...}`

---

## 📝 BƯỚC 7: Hoàn Thiện Nộp Bài

### Thu Thập Thông Tin
- [ ] **7.1** Frontend URL: `_________________________________`
- [ ] **7.2** Backend URL: `_________________________________`
- [ ] **7.3** GitHub URL: `_________________________________`
- [ ] **7.4** Admin account: `admin@carrental.com` / `Admin@123`
- [ ] **7.5** Customer account: `customer1@example.com` / `Customer@123`

### Screenshots
- [ ] **7.6** Screenshot Home Page
- [ ] **7.7** Screenshot Cars List (Admin view)
- [ ] **7.8** Screenshot Bookings List
- [ ] **7.9** Screenshot Render Dashboard (Backend deployed)
- [ ] **7.10** Screenshot Vercel Dashboard (Frontend deployed)
- [ ] **7.11** Screenshot MongoDB Atlas Dashboard (Database)

### Documentation
- [ ] **7.12** File README.md đầy đủ
- [ ] **7.13** File DEPLOYMENT_GUIDE.md có trong repo
- [ ] **7.14** File này (DEPLOYMENT_CHECKLIST.md) có trong repo

### Nộp Bài
- [ ] **7.15** Tạo document/PDF với:
  - URLs (Frontend, Backend, GitHub)
  - Demo accounts
  - Screenshots
- [ ] **7.16** Submit lên hệ thống LMS/Google Classroom
- [ ] **7.17** Email cho giảng viên (nếu cần)

---

## 🆘 Troubleshooting

### ❌ Frontend không kết nối Backend
**Triệu chứng:** Trang web không load data, Console có lỗi CORS/Network

**Giải pháp:**
- [ ] Kiểm tra `VITE_API_URL` trong Vercel Environment Variables
- [ ] Kiểm tra `CORS_ORIGIN` trong Render Environment Variables
- [ ] Deploy lại Frontend (Vercel → Deployments → Redeploy)
- [ ] Clear cache browser (Ctrl + Shift + R)

### ❌ Backend Error 500
**Triệu chứng:** API trả về 500 Internal Server Error

**Giải pháp:**
- [ ] Vào Render → Logs để xem lỗi chi tiết
- [ ] Kiểm tra MongoDB connection string đúng chưa
- [ ] Kiểm tra tất cả Environment Variables
- [ ] Restart service (Render → Manual Deploy → Deploy latest commit)

### ❌ Không thể đăng nhập
**Triệu chứng:** Login luôn fail, hoặc không trả về token

**Giải pháp:**
- [ ] Kiểm tra đã chạy seed data chưa (Render → Shell → `npm run seed`)
- [ ] Clear localStorage (F12 → Application → Local Storage → Clear)
- [ ] Thử đăng ký account mới
- [ ] Kiểm tra Network tab (F12) xem API response

### ❌ CORS Error
**Triệu chứng:** Console error: "blocked by CORS policy"

**Giải pháp:**
- [ ] Verify `CORS_ORIGIN` trong Render = Frontend URL từ Vercel
- [ ] Không có http/https mismatch
- [ ] Restart Render service
- [ ] Hard refresh Frontend (Ctrl + Shift + R)

### ❌ Backend Sleep (Render Free Tier)
**Triệu chứng:** Request đầu tiên rất chậm (30s+)

**Giải pháp:**
- [ ] Đây là bình thường với Render free tier
- [ ] (Optional) Setup Cron Job để ping mỗi 5 phút:
  - UptimeRobot: https://uptimerobot.com/
  - Cron-Job.org: https://cron-job.org/
  - URL to ping: `https://your-backend.onrender.com/health`

---

## 📊 Final Checklist Summary

### Critical Items (PHẢI CÓ)
- [ ] ✅ MongoDB Atlas cluster running
- [ ] ✅ Backend deployed on Render (status: Running)
- [ ] ✅ Frontend deployed on Vercel (status: Ready)
- [ ] ✅ CORS configured correctly
- [ ] ✅ Seed data loaded
- [ ] ✅ Can login with admin account
- [ ] ✅ Can see cars list
- [ ] ✅ GitHub repository public/accessible

### Nice to Have (NÊN CÓ)
- [ ] 📸 Screenshots collected
- [ ] 📝 README.md updated
- [ ] 🔗 Custom domain (optional)
- [ ] 📊 Monitoring setup (optional)

### Before Submission
- [ ] 📋 All URLs noted
- [ ] 🖼️ All screenshots taken
- [ ] 📄 Document prepared
- [ ] ✉️ Ready to submit

---

## 🎯 Kết Quả Mong Đợi

Sau khi hoàn thành checklist này, bạn sẽ có:
- ✅ Ứng dụng chạy live trên internet
- ✅ URLs để demo cho giảng viên
- ✅ Screenshots để chứng minh
- ✅ Hiểu được quy trình deployment
- ✅ Kinh nghiệm thực tế với hosting platforms

---

**Completion Date:** ___________________

**Total Time Spent:** _________ minutes

**Status:** 
- [ ] ✅ Deployment successful
- [ ] ⚠️ Có issues nhỏ (ghi chú: _________________)
- [ ] ❌ Cần help

---

**Good luck! 🚀**
