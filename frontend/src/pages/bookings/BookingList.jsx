import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiCalendar, FiPlus, FiTruck, FiCheckCircle, FiXCircle, FiClock, FiUser, FiEye, FiAlertTriangle, FiDownload } from 'react-icons/fi';

const statusMap = {
  'chờ xác nhận': { label: 'Chờ xác nhận', color: 'bg-gray-100 text-gray-800', icon: FiClock },
  'chờ xử lý': { label: 'Chờ xác nhận', color: 'bg-gray-100 text-gray-800', icon: FiClock },
  'chờ nhận xe': { label: 'Chờ nhận xe', color: 'bg-blue-100 text-blue-800', icon: FiTruck },
  'đã nhận xe': { label: 'Đã nhận xe', color: 'bg-cyan-100 text-cyan-800', icon: FiCheckCircle },
  'đã đón': { label: 'Đã nhận xe', color: 'bg-cyan-100 text-cyan-800', icon: FiCheckCircle },
  'quá hạn trả xe': { label: 'Quá hạn trả xe', color: 'bg-rose-100 text-rose-800', icon: FiAlertTriangle },
  'hoàn thành': { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
  'đã hủy': { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: FiXCircle },
};

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN');

export default function BookingList({ userOnly = false }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const isManageMode = isAdmin && !userOnly;

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await bookingAPI.getAll({ limit: 100, myBookings: userOnly ? 'true' : undefined });
      setBookings(data.data.bookings);
    } catch {
      toast.error('Không thể tải danh sách đặt xe');
    } finally {
      setLoading(false);
    }
  }, [userOnly]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const exportToCSV = () => {
    const headers = ['Mã', 'Khách hàng', 'Xe', 'Ngày bắt đầu', 'Ngày kết thúc', 'Tổng tiền', 'Đã cọc', 'Còn lại', 'Trạng thái'];
    
    const rows = bookings.map(b => {
      const st = statusMap[b.status] || statusMap['chờ xử lý'];
      return [
        b._id,
        b.customerName,
        b.carNumber,
        formatDate(b.startDate),
        formatDate(b.endDate),
        b.totalAmount,
        b.depositPaidAt ? b.depositAmount : 0,
        b.remainingPaidAt ? b.remainingAmount : 0,
        st.label
      ].map(field => `"${field}"`).join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <FiCalendar /> {isManageMode ? 'Quản lý đặt xe' : 'Đơn đặt xe của tôi'}
        </h2>
        {!isManageMode && (
          <Link to="/bookings/create" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
            <FiPlus /> Đặt xe mới
          </Link>
        )}
        {isManageMode && bookings.length > 0 && (
          <button onClick={exportToCSV} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <FiDownload /> Xuất CSV
          </button>
        )}
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
                  <th className="px-4 py-3 text-left">Thanh toán</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-center w-36">Chi tiết</th>
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
                      <td className="px-4 py-3 text-xs">
                        {b.depositPaidAt && b.remainingPaidAt ? (
                          <div className="text-green-600 font-semibold flex items-center gap-1">
                            <FiCheckCircle size={14} /> Đã thanh toán
                          </div>
                        ) : (
                          <>
                            <div>Cọc: <span className={b.depositPaidAt ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>{formatCurrency(b.depositAmount || 0)}</span></div>
                            <div>Còn lại: <span className={b.remainingPaidAt ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>{formatCurrency(b.remainingAmount || 0)}</span></div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>
                          <StatusIcon size={12} /> {st.label}
                        </span>
                        {b.overdue && b.status !== 'hoàn thành' && b.status !== 'đã hủy' && (
                          <p className="text-xs text-rose-600 mt-1">Đang quá hạn trả xe</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={isManageMode ? `/bookings/${b._id}` : `/my-bookings/${b._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
                        >
                          <FiEye size={14} /> Xem
                        </Link>
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
            <p className="mb-4">{isManageMode ? 'Chưa có đơn đặt xe nào trong hệ thống.' : 'Bạn chưa có đơn đặt xe nào.'}</p>
            <Link to="/bookings/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <FiPlus className="inline mr-1" /> Đặt xe mới
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
