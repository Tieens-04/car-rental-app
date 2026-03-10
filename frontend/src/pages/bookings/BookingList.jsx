import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiTruck, FiCheckCircle, FiXCircle, FiClock, FiUser } from 'react-icons/fi';

const statusMap = {
  'chờ xử lý': { label: 'Chờ xử lý', color: 'bg-gray-100 text-gray-800', icon: FiClock },
  'đã đón': { label: 'Đã nhận xe', color: 'bg-cyan-100 text-cyan-800', icon: FiCheckCircle },
  'hoàn thành': { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
  'đã hủy': { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: FiXCircle },
};

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN');

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  const fetchBookings = async () => {
    try {
      const { data } = await bookingAPI.getAll({ limit: 100 });
      setBookings(data.data.bookings);
    } catch (err) {
      toast.error('Không thể tải danh sách đặt xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa booking này?')) return;
    try {
      await bookingAPI.delete(id);
      toast.success('Xóa booking thành công!');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handlePickup = async (id) => {
    if (!window.confirm('Xác nhận khách hàng đã nhận xe?')) return;
    try {
      await bookingAPI.pickup(id);
      toast.success('Nhận xe thành công!');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Xác nhận hoàn thành booking?')) return;
    try {
      await bookingAPI.complete(id);
      toast.success('Hoàn thành booking!');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt('Lý do hủy (không bắt buộc):');
    if (reason === null) return; // user clicked cancel on prompt
    try {
      await bookingAPI.cancel(id, reason);
      toast.success('Đã hủy booking!');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
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
          <FiCalendar /> Quản lý đặt xe
        </h2>
        <Link to="/bookings/create" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
          <FiPlus /> Đặt xe mới
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800 text-white text-sm uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Mã</th>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-left">Xe</th>
                  <th className="px-4 py-3 text-left">Ngày bắt đầu</th>
                  <th className="px-4 py-3 text-left">Ngày kết thúc</th>
                  <th className="px-4 py-3 text-left">Tổng tiền</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-center w-52">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => {
                  const st = statusMap[b.status] || statusMap['chờ xử lý'];
                  const StatusIcon = st.icon;
                  return (
                    <tr key={b._id} className="hover:bg-blue-50/50 transition">
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{b._id.substring(0, 8)}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1"><FiUser className="text-gray-400" /> {b.customerName}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{b.carNumber}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(b.startDate)}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(b.endDate)}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(b.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>
                          <StatusIcon size={12} /> {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {b.status === 'chờ xử lý' && (
                            <>
                              <button onClick={() => handlePickup(b._id)} title="Nhận xe"
                                className="bg-cyan-500 text-white p-1.5 rounded-lg hover:bg-cyan-600 transition">
                                <FiTruck size={14} />
                              </button>
                              <button onClick={() => handleCancel(b._id)} title="Hủy"
                                className="bg-orange-500 text-white p-1.5 rounded-lg hover:bg-orange-600 transition">
                                <FiXCircle size={14} />
                              </button>
                            </>
                          )}
                          {b.status === 'đã đón' && (
                            <button onClick={() => handleComplete(b._id)} title="Hoàn thành"
                              className="bg-green-600 text-white p-1.5 rounded-lg hover:bg-green-700 transition">
                              <FiCheckCircle size={14} />
                            </button>
                          )}
                          {(b.status === 'chờ xử lý' || b.status === 'đã đón') && (
                            <Link to={`/bookings/edit/${b._id}`} title="Sửa"
                              className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition">
                              <FiEdit2 size={14} />
                            </Link>
                          )}
                          {isAdmin && (
                            <button onClick={() => handleDelete(b._id)} title="Xóa"
                              className="bg-red-600 text-white p-1.5 rounded-lg hover:bg-red-700 transition">
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <FiCalendar className="text-6xl mx-auto mb-4 opacity-30" />
            <h4 className="text-lg font-semibold mb-2">Chưa có đặt xe nào</h4>
            <p className="mb-4">Hãy tạo đặt xe mới để bắt đầu.</p>
            <Link to="/bookings/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <FiPlus className="inline mr-1" /> Đặt xe mới
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
