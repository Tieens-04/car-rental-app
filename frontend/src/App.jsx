import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CarList from './pages/cars/CarList';
import CarCreate from './pages/cars/CarCreate';
import CarEdit from './pages/cars/CarEdit';
import BookingList from './pages/bookings/BookingList';
import BookingCreate from './pages/bookings/BookingCreate';
import BookingEdit from './pages/bookings/BookingEdit';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Cars */}
              <Route path="/cars" element={<CarList />} />
              <Route path="/cars/create" element={
                <ProtectedRoute adminOnly>
                  <CarCreate />
                </ProtectedRoute>
              } />
              <Route path="/cars/edit/:carNumber" element={
                <ProtectedRoute adminOnly>
                  <CarEdit />
                </ProtectedRoute>
              } />

              {/* Bookings */}
              <Route path="/bookings" element={
                <ProtectedRoute>
                  <BookingList />
                </ProtectedRoute>
              } />
              <Route path="/bookings/create" element={
                <ProtectedRoute>
                  <BookingCreate />
                </ProtectedRoute>
              } />
              <Route path="/bookings/edit/:bookingId" element={
                <ProtectedRoute>
                  <BookingEdit />
                </ProtectedRoute>
              } />
            </Routes>
          </main>

          <footer className="bg-gray-900 text-gray-400 py-4 text-center text-sm">
            &copy; 2024 Car Rental System. All rights reserved.
          </footer>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', background: '#333', color: '#fff' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
