import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCalendar, FiDollarSign, FiTruck, FiCheckCircle, FiUser, FiX, FiEye, FiXCircle } from 'react-icons/fi';

const statusMap = {
  'chờ xác nhận': { label: 'Chờ xác nhận', color: 'bg-gray-100 text-gray-800', icon: FiCheckCircle },
  'chờ xử lý': { label: 'Chờ xác nhận', color: 'bg-gray-100 text-gray-800', icon: FiCheckCircle },
  'chờ nhận xe': { label: 'Chờ nhận xe', color: 'bg-blue-100 text-blue-800', icon: FiTruck },
  'đã nhận xe': { label: 'Đã nhận xe', color: 'bg-cyan-100 text-cyan-800', icon: FiCheckCircle },
  'đã đón': { label: 'Đã nhận xe', color: 'bg-cyan-100 text-cyan-800', icon: FiCheckCircle },
  'quá hạn trả xe': { label: 'Quá hạn trả xe', color: 'bg-rose-100 text-rose-800', icon: FiCheckCircle },
  'hoàn thành': { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
  'đã hủy': { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: FiCheckCircle },
};
const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount || 0) + ' VND';
const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN');
const formatDateTime = (d) => new Date(d).toLocaleString('vi-VN', {
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const normalizeStatus = (status) => (status === 'chờ xử lý' ? 'chờ xác nhận' : (status === 'đã đón' ? 'đã nhận xe' : status));
const toEndOfDay = (dateValue) => {
  const d = new Date(dateValue);
  d.setHours(23, 59, 59, 999);
  return d;
};

export default function BookingDetailUser() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [booking, setBooking] = useState(null);
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const backPath = '/my-bookings';

  const fetchBooking = async () => {
    try {
      const { data } = await bookingAPI.getById(bookingId);
      setBooking(data.data.booking);
      setCar(data.data.car || null);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Bạn không có quyền truy cập đơn này');
      } else {
        toast.error('Không tìm thấy đơn đặt xe');
      }
      setTimeout(() => navigate(backPath), 1500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      toast.error('Admin không được xem chi tiết này');
      navigate('/bookings');
      return;
    }
    fetchBooking();
  }, [bookingId, isAdmin, navigate]);

  const bookingStatus = normalizeStatus(booking?.status);
  const statusMeta = statusMap[bookingStatus] || statusMap['chờ xác nhận'];
  const StatusIcon = statusMeta.icon;

  const timelineEvents = useMemo(() => {
    if (!booking) return [];
    const events = [
      { at: booking.createdAt, title: 'Tạo đơn đặt xe', subtitle: 'Đơn được khởi tạo trên hệ thống', tone: 'slate' },
      { at: booking.startDate, title: 'Bắt đầu thuê (dự kiến)', subtitle: 'Mốc bắt đầu thời gian thuê', tone: 'blue' },
      { at: toEndOfDay(booking.endDate), title: 'Hạn trả xe', subtitle: 'Mốc kết thúc thời gian thuê', tone: booking.overdue ? 'rose' : 'amber' },
    ];
    if (booking.depositPaidAt) {
      events.push({ at: booking.depositPaidAt, title: 'Đã thanh toán cọc', subtitle: formatCurrency(booking.depositAmount), tone: 'green' });
    }
    if (booking.confirmedAt) {
      events.push({ at: booking.confirmedAt, title: 'Admin đã xác nhận đơn', subtitle: 'Sẵn sàng nhận xe', tone: 'indigo' });
    }
    if (booking.remainingPaidAt) {
      events.push({ at: booking.remainingPaidAt, title: 'Đã thanh toán phần còn lại', subtitle: formatCurrency(booking.remainingAmount), tone: 'green' });
    }
    if (booking.pickupAt) {
      events.push({ at: booking.pickupAt, title: 'Đã nhận xe', subtitle: 'Bắt đầu sử dụng xe', tone: 'cyan' });
    }
    if (booking.updatedAt && (bookingStatus === 'hoàn thành' || bookingStatus === 'đã hủy' || bookingStatus === 'quá hạn trả xe')) {
      const byStatus = bookingStatus === 'hoàn thành'
        ? 'Booking đã hoàn thành'
        : bookingStatus === 'đã hủy'
          ? 'Booking đã bị hủy'
          : 'Booking được đánh dấu quá hạn';
      events.push({ at: booking.updatedAt, title: byStatus, subtitle: 'Cập nhật trạng thái mới nhất', tone: bookingStatus === 'quá hạn trả xe' ? 'rose' : 'slate' });
    }
    if (booking.overdue && bookingStatus !== 'hoàn thành' && bookingStatus !== 'đã hủy') {
      events.push({ at: new Date(), title: 'Đang quá hạn trả xe', subtitle: 'Cần xử lý trả xe sớm', tone: 'rose' });
    }
    return events
      .filter((e) => e.at)
      .map((e) => ({ ...e, atDate: new Date(e.at) }))
      .sort((a, b) => a.atDate.getTime() - b.atDate.getTime());
  }, [booking, bookingStatus]);
  const toneToClass = (tone) => {
    if (tone === 'green') return 'bg-green-500';
    if (tone === 'blue') return 'bg-blue-500';
    if (tone === 'amber') return 'bg-amber-500';
    if (tone === 'indigo') return 'bg-indigo-500';
    if (tone === 'cyan') return 'bg-cyan-500';
    if (tone === 'rose') return 'bg-rose-500';
    return 'bg-slate-500';
  };
  const runAction = async (action, successMessage) => {
    setActing(true);
    try {
      await action();
      toast.success(successMessage);
      await fetchBooking();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setActing(false);
    }
  };
  const onPayDeposit = () => {
    if (!window.confirm('Thanh toán tiền cọc 10% cho booking này?')) return;
    runAction(() => bookingAPI.payDeposit(booking._id), 'Thanh toán cọc thành công');
  };
  const onPayRemaining = () => {
    if (!window.confirm('Thanh toán số tiền còn lại cho booking này?')) return;
    runAction(() => bookingAPI.payRemaining(booking._id), 'Thanh toán phần còn lại thành công');
  };
  const onPickup = () => {
    if (!window.confirm('Xác nhận đã nhận xe?')) return;
    runAction(() => bookingAPI.pickup(booking._id), 'Nhận xe thành công');
  };
  const onCancel = () => {
    const reason = window.prompt('Lý do hủy (không bắt buộc):');
    if (reason === null) return;
    runAction(() => bookingAPI.cancel(booking._id, reason), 'Đã hủy booking');
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!booking) return null;
  const canPayDeposit = bookingStatus === 'chờ xác nhận' && !booking.depositPaidAt;
  const canPayRemaining = bookingStatus === 'chờ nhận xe' && !booking.remainingPaidAt;
  const canPickup = bookingStatus === 'chờ nhận xe' && Boolean(booking.remainingPaidAt);
  const canCancel = bookingStatus === 'chờ xác nhận' || bookingStatus === 'chờ nhận xe';
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to={backPath} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border hover:bg-gray-50 transition text-sm">
          <FiArrowLeft /> Quay lại danh sách
        </Link>
        <span className="text-xs text-gray-500">Mã đơn: {booking._id}</span>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><FiEye /> Chi tiết đặt xe của tôi</h2>
            <p className="text-gray-500 mt-1">Theo dõi đầy đủ các mốc ngày giờ của đơn đặt xe</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${statusMeta.color}`}>
            <StatusIcon size={14} /> {statusMeta.label}
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-gray-500">Tên người đặt</p>
            <p className="font-semibold mt-1 flex items-center gap-2"><FiUser className="text-gray-500" /> {booking.customerName}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-gray-500">Xe</p>
            <p className="font-semibold mt-1">{booking.carNumber}</p>
            {car && <p className="text-xs text-gray-500 mt-1">{car.capacity} chỗ • {formatCurrency(car.pricePerDay)}/ngày</p>}
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-gray-500">Khoảng thuê</p>
            <p className="font-semibold mt-1 flex items-center gap-2"><FiCalendar className="text-gray-500" /> {formatDate(booking.startDate)} - {formatDate(booking.endDate)}</p>
            {booking.overdue && bookingStatus !== 'hoàn thành' && bookingStatus !== 'đã hủy' && (
              <p className="text-xs text-rose-600 mt-1">Đơn đang quá hạn trả xe</p>
            )}
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
            <p className="text-xs text-emerald-700">Tổng tiền</p>
            <p className="text-lg font-bold text-emerald-700 mt-1">{formatCurrency(booking.totalAmount)}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <p className="text-xs text-amber-700">Tiền cọc</p>
            <p className="text-lg font-bold text-amber-700 mt-1">{formatCurrency(booking.depositAmount)}</p>
            <p className="text-xs mt-1 text-gray-500">{booking.depositPaidAt ? `Đã thanh toán lúc ${formatDateTime(booking.depositPaidAt)}` : 'Chưa thanh toán'}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-xs text-blue-700">Số tiền còn lại</p>
            <p className="text-lg font-bold text-blue-700 mt-1">{formatCurrency(booking.remainingAmount)}</p>
            <p className="text-xs mt-1 text-gray-500">{booking.remainingPaidAt ? `Đã thanh toán lúc ${formatDateTime(booking.remainingPaidAt)}` : 'Chưa thanh toán'}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Timeline trạng thái (Ngày giờ)</h3>
        <div className="space-y-4">
          {timelineEvents.map((event, index) => (
            <div key={`${event.title}-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`w-3 h-3 rounded-full mt-1 ${toneToClass(event.tone)}`}></span>
                {index < timelineEvents.length - 1 && <span className="w-px flex-1 bg-gray-200 mt-1"></span>}
              </div>
              <div className="pb-4">
                <p className="text-sm font-semibold">{event.title}</p>
                <p className="text-xs text-gray-500">{formatDateTime(event.atDate)}</p>
                <p className="text-sm text-gray-600 mt-1">{event.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Thao tác</h3>
        <div className="flex flex-wrap gap-2">
          {canPayDeposit && (
            <button disabled={acting} onClick={onPayDeposit} className="bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600 transition text-sm inline-flex items-center gap-2 disabled:opacity-60">
              <FiDollarSign /> Thanh toán cọc
            </button>
          )}
          {canPayRemaining && (
            <button disabled={acting} onClick={onPayRemaining} className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition text-sm inline-flex items-center gap-2 disabled:opacity-60">
              <FiDollarSign /> Thanh toán còn lại
            </button>
          )}
          {canPickup && (
            <button disabled={acting} onClick={onPickup} className="bg-cyan-600 text-white px-3 py-2 rounded-lg hover:bg-cyan-700 transition text-sm inline-flex items-center gap-2 disabled:opacity-60">
              <FiTruck /> Xác nhận nhận xe
            </button>
          )}
          {canCancel && (
            <button disabled={acting} onClick={onCancel} className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition text-sm inline-flex items-center gap-2 disabled:opacity-60">
              <FiXCircle /> Hủy đơn
            </button>
          )}
          {!canPayDeposit && !canPayRemaining && !canPickup && !canCancel && (
            <span className="text-sm text-gray-500">Không có thao tác khả dụng cho trạng thái hiện tại</span>
          )}
        </div>
        {booking.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
            <p className="font-medium mb-1">Ghi chú</p>
            <p>{booking.notes}</p>
          </div>
        )}
        <div className="mt-4">
          <Link to={backPath} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
            <FiX /> Đóng chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}
