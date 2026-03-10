import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiTruck, FiCalendar, FiLogIn, FiUserPlus, FiLogOut, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <FiTruck className="text-2xl" />
            Car Rental System
          </Link>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-700 transition">
              <FiHome /> Trang chủ
            </Link>
            <Link to="/cars" className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-700 transition">
              <FiTruck /> Quản lý xe
            </Link>
            {user && (
              <Link to="/bookings" className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-700 transition">
                <FiCalendar /> Đặt xe
              </Link>
            )}

            <div className="ml-4 flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300 flex items-center gap-1">
                    <FiUser /> {user.fullName || user.username}
                    {isAdmin && <span className="ml-1 text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded">{user.role}</span>}
                  </span>
                  <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition text-sm">
                    <FiLogOut /> Đăng xuất
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-700 transition">
                    <FiLogIn /> Đăng nhập
                  </Link>
                  <Link to="/register" className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition">
                    <FiUserPlus /> Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700">
              <FiHome /> Trang chủ
            </Link>
            <Link to="/cars" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700">
              <FiTruck /> Quản lý xe
            </Link>
            {user && (
              <Link to="/bookings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700">
                <FiCalendar /> Đặt xe
              </Link>
            )}
            <hr className="border-gray-700" />
            {user ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-400 flex items-center gap-1">
                  <FiUser /> {user.fullName || user.username}
                </div>
                <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-gray-700">
                  <FiLogOut /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700">
                  <FiLogIn /> Đăng nhập
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700">
                  <FiUserPlus /> Đăng ký
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
