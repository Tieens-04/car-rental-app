import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { bookingAPI, carAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit2, FiX, FiCheck, FiDollarSign } from 'react-icons/fi';

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

export default function BookingEdit() {
  const { bookingId } = useParams();
  const fullNameRegex = /^[A-Za-zÀ-ỹ\s]+$/u;
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({ customerName: '', carNumber: '', startDate: '', endDate: '' });
  const [originalAmount, setOriginalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      bookingAPI.getById(bookingId),
      carAPI.getAll({ limit: 100 }),
    ]).then(([bookingRes, carsRes]) => {
      const b = bookingRes.data.data.booking;
      setForm({
        customerName: b.customerName,
        carNumber: b.carNumber,
        startDate: new Date(b.startDate).toISOString().split('T')[0],
        endDate: new Date(b.endDate).toISOString().split('T')[0],
      });
      setOriginalAmount(b.totalAmount);
      // Include non-maintenance cars + the currently booked car (even if in maintenance)
      const allCars = carsRes.data.data.cars;
      setCars(allCars.filter(c => c.status !== 'maintenance' || c.carNumber === b.carNumber));
    }).catch(() => {
      toast.error('Không tìm thấy booking');
      navigate('/bookings');
    }).finally(() => setFetching(false));
  }, [bookingId, navigate]);

  const onChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const priceInfo = useMemo(() => {
    const car = cars.find(c => c.carNumber === form.carNumber);
    if (!car || !form.startDate || !form.endDate) return null;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end < start) return null;
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    return { pricePerDay: car.pricePerDay, days, total: days * car.pricePerDay };
  }, [form.carNumber, form.startDate, form.endDate, cars]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || form.customerName.length < 3) {
      toast.error('Tên người đặt phải có ít nhất 3 ký tự'); return;
    }
    if (!fullNameRegex.test(form.customerName.trim())) {
      toast.error('Tên người đặt chỉ được chứa chữ cái (Tiếng Việt) và dấu cách'); return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('Ngày kết thúc không được trước ngày bắt đầu'); return;
    }

    setLoading(true);
    try {
      await bookingAPI.update(bookingId, {
        customerName: form.customerName.trim(),
        carNumber: form.carNumber,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      toast.success('Cập nhật thành công!');
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-white border-b px-6 py-4 flex items-center gap-2 font-semibold">
          <FiEdit2 /> Chỉnh sửa đặt xe
        </div>
        <div className="p-6">
          <div className="bg-blue-50 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Mã đặt xe</p>
              <code className="text-sm">{bookingId}</code>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tổng tiền hiện tại</p>
              <p className="font-bold text-green-600">{formatCurrency(originalAmount)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên người đặt <span className="text-red-500">*</span>
              </label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={form.customerName} onChange={onChange('customerName')} />
              <p className="text-xs text-gray-400 mt-1">Chỉ chữ cái Tiếng Việt và dấu cách</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chọn xe <span className="text-red-500">*</span>
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={form.carNumber} onChange={onChange('carNumber')}>
                {cars.map(car => (
                  <option key={car._id} value={car.carNumber}>
                    {car.carNumber} - {car.capacity} chỗ - {formatCurrency(car.pricePerDay)}/ngày
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.startDate} onChange={onChange('startDate')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.endDate} onChange={onChange('endDate')} />
              </div>
            </div>

            {priceInfo && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-5">
                <h6 className="font-semibold flex items-center gap-2 mb-3"><FiDollarSign /> Chi tiết giá mới</h6>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Giá thuê/ngày</p>
                    <p className="font-bold">{formatCurrency(priceInfo.pricePerDay)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Số ngày thuê</p>
                    <p className="font-bold">{priceInfo.days} ngày</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tổng tiền mới</p>
                    <p className="font-bold text-lg text-green-600">{formatCurrency(priceInfo.total)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50">
                {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <FiCheck />}
                Cập nhật
              </button>
              <Link to="/bookings" className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium flex items-center gap-2">
                <FiX /> Hủy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
