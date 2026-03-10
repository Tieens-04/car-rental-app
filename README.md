# 🚗 Car Rental Management System

Full-stack Car Rental application với React + Node.js + MongoDB + JWT Authentication.

## 📋 Tính Năng

### 🔐 Authentication & Authorization
- Đăng ký/Đăng nhập với JWT
- Role-based access (Admin/Customer)
- Token refresh mechanism
- Password hashing với bcrypt

### 🚙 Car Management (Admin)
- CRUD operations cho xe
- Upload hình ảnh xe
- Quản lý trạng thái xe (Available, Rented, Maintenance)
- Thống kê xe

### 📅 Booking Management
- Tạo booking cho customer
- Admin quản lý tất cả bookings
- Customer xem bookings của mình
- Trạng thái booking: Pending, Confirmed, Picked Up, Completed, Cancelled
- Pick up / Complete / Cancel booking

### 👥 User Management (Admin)
- Xem danh sách users
- Cập nhật role
- Xóa user

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting, bcrypt
- **Validation**: Express Validator

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS v4
- **Icons**: React Icons
- **Notifications**: React Hot Toast

---

## 📁 Cấu Trúc Project

```
student_carRental/
├── backend/                 # Backend API (Node.js + Express)
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── scripts/           # Utility scripts (seed data)
│   ├── utils/             # Utilities (JWT)
│   └── app.js             # Entry point
│
├── frontend/               # Frontend (React + Vite)
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React Context (Auth)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services (Axios)
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   └── vite.config.js     # Vite configuration
│
├── DEPLOYMENT_GUIDE.md        # 📘 Hướng dẫn deploy chi tiết
├── QUICK_START.md             # ⚡ Quick start guide (10 phút)
└── DEPLOYMENT_ALTERNATIVES.md # 🌐 Các phương án deploy khác
```

---

## 🚀 Deployment - **ĐỌC ĐI!**

### 📚 Hướng Dẫn Deploy Đầy Đủ
👉 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Hướng dẫn chi tiết từng bước với screenshots

### ⚡ Deploy Nhanh trong 10 Phút
👉 **[QUICK_START.md](./QUICK_START.md)** - Tóm tắt các bước cần thiết

### 🌐 Các Phương Án Hosting Khác
👉 **[DEPLOYMENT_ALTERNATIVES.md](./DEPLOYMENT_ALTERNATIVES.md)** - Railway, Fly.io, Cyclic, etc.

### 🎯 Phương Án Đề Xuất (Miễn Phí)
- **Database**: MongoDB Atlas (Free 512MB)
- **Backend**: Render.com (Free tier)
- **Frontend**: Vercel (Free unlimited)

---

## 💻 Local Development

### Yêu Cầu
- Node.js >= 18.x
- MongoDB (local hoặc MongoDB Atlas)
- npm hoặc yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd student_carRental
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Tạo file .env (copy từ .env.example)
cp .env.example .env

# Sửa .env với thông tin của bạn:
# MONGODB_URI=mongodb://localhost:27017/carRental
# JWT_SECRET=your_secret_here
# CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Seed database với dữ liệu mẫu
npm run seed

# Start backend
npm run dev
```

Backend sẽ chạy tại: http://localhost:3000

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Tạo file .env (copy từ .env.example)
cp .env.example .env

# File .env:
# VITE_API_URL=http://localhost:3000

# Start frontend
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

---

## 🔑 Tài Khoản Mặc Định (Sau Seed Data)

### Admin Account
```
Email: admin@carrental.com
Password: Admin@123
```

### Customer Accounts
```
Email: customer1@example.com
Password: Customer@123

Email: customer2@example.com
Password: Customer@123
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile
- `PUT /api/auth/password` - Change password

### Cars (Admin only for CUD, GET public)
- `GET /api/v1/cars` - Get all cars (with pagination, filter)
- `GET /api/v1/cars/:carNumber` - Get car by number
- `POST /api/v1/cars` - Create car (Admin)
- `PUT /api/v1/cars/:carNumber` - Update car (Admin)
- `DELETE /api/v1/cars/:carNumber` - Delete car (Admin)
- `GET /api/v1/cars/stats` - Get statistics (Admin)

### Bookings
- `GET /api/v1/bookings` - Get bookings (Admin: all, Customer: own)
- `GET /api/v1/bookings/:id` - Get booking by ID
- `POST /api/v1/bookings` - Create booking
- `PUT /api/v1/bookings/:id` - Update booking
- `DELETE /api/v1/bookings/:id` - Delete booking (Admin)
- `PATCH /api/v1/bookings/:id/pickup` - Mark as picked up (Admin)
- `PATCH /api/v1/bookings/:id/complete` - Mark as completed (Admin)
- `PATCH /api/v1/bookings/:id/cancel` - Cancel booking
- `GET /api/v1/bookings/stats` - Get statistics (Admin)

---

## 🔒 Security Features

- ✅ **JWT Authentication** với access & refresh tokens
- ✅ **Password Hashing** với bcryptjs
- ✅ **CORS Protection** với whitelist origins
- ✅ **Rate Limiting** để chống DDoS
- ✅ **Helmet** security headers
- ✅ **Input Validation** với express-validator
- ✅ **Role-based Access Control**
- ✅ **Cookie-based Token Storage** với httpOnly flag

---

## 📦 Scripts

### Backend
```bash
npm start          # Start production server
npm run dev        # Start development server (nodemon)
npm run seed       # Seed database with sample data
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 🌍 Environment Variables

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/carRental
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

---

## 🐛 Troubleshooting

### Backend không kết nối được MongoDB
- Kiểm tra MongoDB đang chạy (nếu dùng local)
- Kiểm tra `MONGODB_URI` trong `.env`
- Kiểm tra network access trong MongoDB Atlas

### Frontend không gọi được API
- Kiểm tra backend đang chạy
- Kiểm tra `VITE_API_URL` trong frontend `.env`
- Kiểm tra CORS settings trong backend
- Mở Console (F12) để xem lỗi

### Lỗi 401 Unauthorized
- Token hết hạn → Đăng nhập lại
- Token không hợp lệ → Clear localStorage
- Refresh token failed → Đăng nhập lại

---

## 📸 Screenshots

### Home Page
- Hiển thị danh sách xe available
- Filter theo brand, price range
- Search theo tên xe

### Admin Dashboard
- Quản lý tất cả cars
- Quản lý tất cả bookings
- Xem statistics

### Customer Dashboard
- Xem xe available
- Tạo booking
- Xem lịch sử bookings của mình

---

## 🎓 Assignment Submission

Khi nộp bài cho giảng viên, cung cấp:

1. **URLs:**
   - Frontend URL: `https://your-app.vercel.app`
   - Backend URL: `https://your-backend.onrender.com`

2. **GitHub Repository:**
   - Link: `https://github.com/YOUR_USERNAME/car-rental-app`

3. **Demo Accounts:**
   - Admin: `admin@carrental.com` / `Admin@123`
   - Customer: `customer1@example.com` / `Customer@123`

4. **Screenshots:**
   - Homepage
   - Admin Dashboard
   - Booking Flow
   - Deployment Dashboards (Render + Vercel + MongoDB Atlas)

5. **Documentation:**
   - README.md (file này)
   - DEPLOYMENT_GUIDE.md (các bước deploy)

---

## 📄 License

ISC

---

## 👨‍💻 Author

Student - SE18D01 - SDN Assignment

---

## 🙏 Acknowledgments

- MongoDB Atlas for free database hosting
- Render.com for free backend hosting
- Vercel for free frontend hosting
- React + Vite for amazing DX
- Tailwind CSS for rapid styling

---

**Happy Coding! 🚀**
