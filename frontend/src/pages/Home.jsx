import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiTruck, FiCalendar, FiShield, FiClock, FiHeadphones, FiArrowRight } from 'react-icons/fi';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-12 text-white text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <FiTruck className="text-5xl" /> Car Rental System
        </h1>
        <p className="text-lg opacity-90">Hệ thống quản lý cho thuê xe hiện đại và hiệu quả</p>
        {user && <p className="mt-2 text-sm opacity-75">Xin chào, {user.fullName || user.username}!</p>}
      </div>

      {/* Feature cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition text-center">
          <FiTruck className="text-5xl text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Quản lý xe</h3>
          <p className="text-gray-500 mb-4">Thêm, sửa và quản lý danh sách xe. Theo dõi tình trạng sẵn sàng và bảo trì.</p>
          <Link to="/cars" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <FiArrowRight /> Xem danh sách xe
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition text-center">
          <FiCalendar className="text-5xl text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Quản lý đặt xe</h3>
          <p className="text-gray-500 mb-4">Tạo và quản lý đặt xe của khách hàng. Tự động tính toán chi phí thuê xe.</p>
          <Link to="/bookings" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <FiArrowRight /> Xem danh sách đặt xe
          </Link>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <FiShield className="text-4xl text-green-500 mx-auto mb-3" />
          <h5 className="font-semibold mb-1">An toàn & Tin cậy</h5>
          <p className="text-gray-500 text-sm">Đảm bảo an toàn cho mọi giao dịch</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <FiClock className="text-4xl text-blue-500 mx-auto mb-3" />
          <h5 className="font-semibold mb-1">Nhanh chóng</h5>
          <p className="text-gray-500 text-sm">Quy trình đặt xe đơn giản, nhanh gọn</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <FiHeadphones className="text-4xl text-cyan-500 mx-auto mb-3" />
          <h5 className="font-semibold mb-1">Hỗ trợ 24/7</h5>
          <p className="text-gray-500 text-sm">Luôn sẵn sàng hỗ trợ khách hàng</p>
        </div>
      </div>
    </div>
  );
}
