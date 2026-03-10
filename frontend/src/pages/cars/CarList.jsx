import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { carAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiTruck, FiPlus, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';

const statusMap = {
  available: { label: 'Sẵn sàng', color: 'bg-green-100 text-green-800' },
  rented: { label: 'Đang thuê', color: 'bg-yellow-100 text-yellow-800' },
  maintenance: { label: 'Bảo trì', color: 'bg-red-100 text-red-800' },
};

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

export default function CarList() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  const fetchCars = async () => {
    try {
      const { data } = await carAPI.getAll({ limit: 100 });
      setCars(data.data.cars);
    } catch (err) {
      toast.error('Không thể tải danh sách xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCars(); }, []);

  const handleDelete = async (carNumber) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa xe này?')) return;
    try {
      await carAPI.delete(carNumber);
      toast.success('Xóa xe thành công!');
      fetchCars();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa xe thất bại');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FiTruck /> Quản lý xe
        </h2>
        {isAdmin && (
          <Link to="/cars/create" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
            <FiPlus /> Thêm xe mới
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {cars.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800 text-white text-sm uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Biển số xe</th>
                  <th className="px-4 py-3 text-left">Số chỗ</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Giá/Ngày</th>
                  <th className="px-4 py-3 text-left">Tính năng</th>
                  {isAdmin && <th className="px-4 py-3 text-center w-36">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cars.map((car) => {
                  const st = statusMap[car.status] || statusMap.available;
                  return (
                    <tr key={car._id} className="hover:bg-blue-50/50 transition">
                      <td className="px-4 py-3 font-semibold">{car.carNumber}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1"><FiUsers className="text-gray-400" /> {car.capacity} chỗ</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(car.pricePerDay)}</td>
                      <td className="px-4 py-3">
                        {car.features?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {car.features.map((f, i) => (
                              <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{f}</span>
                            ))}
                          </div>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link to={`/cars/edit/${encodeURIComponent(car.carNumber)}`}
                              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition">
                              <FiEdit2 size={14} />
                            </Link>
                            <button onClick={() => handleDelete(car.carNumber)}
                              className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition">
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <FiTruck className="text-6xl mx-auto mb-4 opacity-30" />
            <h4 className="text-lg font-semibold mb-2">Chưa có xe nào</h4>
            <p className="mb-4">Hãy thêm xe mới để bắt đầu quản lý.</p>
            {isAdmin && (
              <Link to="/cars/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <FiPlus className="inline mr-1" /> Thêm xe mới
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
