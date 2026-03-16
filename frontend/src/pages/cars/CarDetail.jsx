import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { carAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCalendar, FiClock, FiTruck, FiUsers, FiTag, FiSettings, FiPlus } from 'react-icons/fi';

const statusMap = {
  available: { label: 'Sẵn sàng', color: 'bg-green-100 text-green-800' },
  rented: { label: 'Đang thuê', color: 'bg-yellow-100 text-yellow-800' },
  maintenance: { label: 'Bảo trì', color: 'bg-red-100 text-red-800' },
};

const bookingStatusMap = {
  'chờ xác nhận': { label: 'Chờ xác nhận', color: 'bg-gray-100 text-gray-700' },
  'chờ xử lý': { label: 'Chờ xác nhận', color: 'bg-gray-100 text-gray-700' },
  'chờ nhận xe': { label: 'Chờ nhận xe', color: 'bg-blue-100 text-blue-700' },
  'đã nhận xe': { label: 'Đã nhận xe', color: 'bg-cyan-100 text-cyan-700' },
  'đã đón': { label: 'Đã nhận xe', color: 'bg-cyan-100 text-cyan-700' },
  'hoàn thành': { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  'đã hủy': { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
const formatDate = (value) => new Date(value).toLocaleDateString('vi-VN');
const toStartOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};
const daysBetween = (start, end) => Math.max(1, Math.round((toStartOfDay(end) - toStartOfDay(start)) / (1000 * 60 * 60 * 24)) + 1);

export default function CarDetail() {
  const { carNumber } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [car, setCar] = useState(null);
  const [bookings, setBookings] = useState([]);
  const { isAdmin } = useAuth();

  useEffect(() => {
    carAPI.getByNumber(carNumber)
      .then(({ data }) => {
        setCar(data.data.car);
        setBookings(data.data.activeBookings || []);
      })
      .catch(() => {
        toast.error('Không thể tải chi tiết xe');
        navigate('/cars');
      })
      .finally(() => setLoading(false));
  }, [carNumber, navigate]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [bookings]);

  const nearestReturn = useMemo(() => {
    const ongoing = sortedBookings
      .filter((b) => ['chờ nhận xe', 'đã nhận xe', 'đã đón'].includes(b.status))
      .map((b) => new Date(b.endDate).getTime())
      .sort((a, b) => a - b);
    return ongoing.length > 0 ? new Date(ongoing[0]) : null;
  }, [sortedBookings]);

  const timeline = useMemo(() => {
    if (sortedBookings.length === 0) return null;

    const starts = sortedBookings.map((b) => toStartOfDay(b.startDate));
    const ends = sortedBookings.map((b) => toStartOfDay(b.endDate));
    const minDate = new Date(Math.min(...starts.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...ends.map((d) => d.getTime())));
    const totalDays = daysBetween(minDate, maxDate);

    const items = sortedBookings.map((b) => {
      const s = toStartOfDay(b.startDate);
      const e = toStartOfDay(b.endDate);
      const startOffset = daysBetween(minDate, s) - 1;
      const duration = daysBetween(s, e);
      const left = (startOffset / totalDays) * 100;
      const width = Math.max((duration / totalDays) * 100, 4);
      const style = bookingStatusMap[b.status] || bookingStatusMap['chờ xác nhận'];
      return {
        ...b,
        left,
        width,
        style,
      };
    });

    return {
      minDate,
      maxDate,
      totalDays,
      items,
    };
  }, [sortedBookings]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!car) {
    return null;
  }

  const statusStyle = statusMap[car.status] || statusMap.available;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FiTruck /> Chi tiết xe {car.carNumber}
        </h2>
        <div className="flex items-center gap-3">
          {!isAdmin && (
            <Link
              to={`/bookings/create?carNumber=${encodeURIComponent(car.carNumber)}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${car.status === 'available' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 pointer-events-none cursor-not-allowed'}`}
              aria-disabled={car.status !== 'available'}
            >
              <FiPlus /> Đặt xe này
            </Link>
          )}
          <Link to="/cars" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <FiArrowLeft /> Quay lại danh sách
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle.color}`}>{statusStyle.label}</span>
            {car.status === 'rented' && nearestReturn && (
              <span className="text-sm text-gray-500">Dự kiến trả: {formatDate(nearestReturn)}</span>
            )}
          </div>
          <p className="text-lg font-semibold">{car.brand || 'N/A'} {car.model || ''}</p>
          <p className="text-gray-600">Biển số: <span className="font-medium">{car.carNumber}</span></p>
          <p className="text-gray-600 flex items-center gap-2"><FiUsers /> {car.capacity} chỗ</p>
          <p className="text-gray-600 flex items-center gap-2"><FiTag /> {formatCurrency(car.pricePerDay)}/ngày</p>
          <p className="text-gray-600 flex items-center gap-2"><FiSettings /> {car.transmission || 'N/A'} - {car.fuelType || 'N/A'}</p>
          {car.description && <p className="text-gray-600">{car.description}</p>}
        </div>

        <div>
          <h3 className="font-semibold mb-3">Tính năng</h3>
          {car.features?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {car.features.map((feature, index) => (
                <span key={`${feature}-${index}`} className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                  {feature}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Chưa có thông tin tính năng.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b font-semibold flex items-center gap-2">
          <FiCalendar /> Lịch thuê xe
        </div>
        {timeline ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Bắt đầu: {formatDate(timeline.minDate)}</span>
              <span>{timeline.totalDays} ngày</span>
              <span>Kết thúc: {formatDate(timeline.maxDate)}</span>
            </div>

            <div className="space-y-3">
              {timeline.items.map((item) => (
                <div key={item._id} className="grid grid-cols-[170px_1fr] gap-3 items-center">
                  <div className="text-sm">
                    <p className="font-medium truncate">{item.customerName}</p>
                    <p className="text-gray-500 text-xs">{formatDate(item.startDate)} - {formatDate(item.endDate)}</p>
                  </div>
                  <div className="relative h-7 rounded-lg bg-gray-100 overflow-hidden">
                    <div
                      className={`absolute top-0.5 h-6 rounded-md px-2 flex items-center text-xs font-medium ${item.style.color}`}
                      style={{ left: `${item.left}%`, width: `${item.width}%` }}
                      title={`${item.customerName}: ${item.style.label}`}
                    >
                      <span className="truncate">{item.style.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(bookingStatusMap)
                .filter(([k]) => !['chờ xử lý', 'đã đón'].includes(k))
                .map(([key, value]) => (
                  <span key={key} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${value.color}`}>
                    <FiClock size={11} /> {value.label}
                  </span>
                ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-gray-500">Xe này chưa có lịch thuê nào.</div>
        )}
      </div>
    </div>
  );
}
