import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { bookingAPI, carAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiCheck, FiDollarSign, FiAlertCircle } from 'react-icons/fi';

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

export default function BookingCreate() {
  const [searchParams] = useSearchParams();
  const presetCarNumber = searchParams.get('carNumber') || '';
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [form, setForm] = useState({ customerName: '', carNumber: presetCarNumber, startDate: '', endDate: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  const fullNameRegex = /^[A-Za-zÀ-ỹ\s]+$/u;

  // Pre-fill customerName with logged-in user's fullName once available
  useEffect(() => {
    if (user?.fullName && !form.customerName) {
      setForm((prev) => ({ ...prev, customerName: user.fullName }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.fullName]);

  useEffect(() => {
    setCarsLoading(true);
    carAPI.getAll({ limit: 100 }).then(({ data }) => {
      setCars(data.data.cars.filter(c => c.status === 'available'));
    }).catch(() => toast.error('Không thể tải danh sách xe'))
      .finally(() => setCarsLoading(false));
  }, []);

  useEffect(() => {
    if (!presetCarNumber || cars.length === 0) return;
    const matched = cars.find((c) => c.carNumber === presetCarNumber);
    if (matched && form.carNumber !== presetCarNumber) {
      setForm((prev) => ({ ...prev, carNumber: presetCarNumber }));
    }
  }, [presetCarNumber, cars, form.carNumber]);

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

  const today = new Date().toISOString().split('T')[0];

  const validate = () => {
    if (!form.customerName.trim() || form.customerName.length < 3) {
      toast.error('Tên người đặt phải có ít nhất 3 ký tự'); return false;
    }
    if (!fullNameRegex.test(form.customerName.trim())) {
      toast.error('Tên người đặt chỉ được chứa chữ cái (Tiếng Việt) và dấu cách'); return false;
    }
    if (!form.carNumber) { toast.error('Vui lòng chọn xe'); return false; }
    if (!form.startDate) { toast.error('Vui lòng chọn ngày bắt đầu'); return false; }
    if (!form.endDate) { toast.error('Vui lòng chọn ngày kết thúc'); return false; }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('Ngày kết thúc không được trước ngày bắt đầu'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await bookingAPI.create({
        customerName: form.customerName.trim(),
        carNumber: form.carNumber,
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes.trim() || undefined,
      }).then(async ({ data }) => {
        const bookingId = data?.data?._id;
        if (bookingId) {
          await bookingAPI.payDeposit(bookingId);
        }
      });
      toast.success('Đặt xe và thanh toán cọc thành công!');
      navigate(isAdmin ? '/bookings' : '/my-bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt xe thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-white border-b px-6 py-4 flex items-center gap-2 font-semibold">
          <FiPlus /> Đặt xe mới
        </div>
        <div className="p-6">
          {isAdmin ? (
            <div className="text-center py-10">
              <FiAlertCircle className="text-amber-500 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Không thể đặt xe</h3>
              <p className="text-gray-600 mb-6">Tài khoản Admin không thể thực hiện chức năng đặt xe.</p>
              <Link to="/cars" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition inline-block">
                Quay lại danh sách xe
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên người đặt <span className="text-red-500">*</span>
              </label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="VD: Nguyễn Văn A" value={form.customerName} onChange={onChange('customerName')} />
              <p className="text-xs text-gray-400 mt-1">Chỉ chữ cái Tiếng Việt và dấu cách</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chọn xe <span className="text-red-500">*</span>
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={form.carNumber} onChange={onChange('carNumber')} disabled={carsLoading || cars.length === 0}>
                <option value="">{carsLoading ? 'Đang tải xe...' : '-- Chọn xe --'}</option>
                {cars.map(car => (
                  <option key={car._id} value={car.carNumber}>
                    {car.carNumber} - {car.capacity} chỗ - {formatCurrency(car.pricePerDay)}/ngày
                  </option>
                ))}
              </select>
              {!carsLoading && cars.length === 0 && (
                <p className="text-sm text-amber-700 mt-2">Hiện không có xe nào sẵn sàng để đặt.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input type="date" min={today}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.startDate} onChange={onChange('startDate')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input type="date" min={form.startDate || today}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.endDate} onChange={onChange('endDate')} />
                <p className="text-xs text-gray-400 mt-1">Thuê trong ngày hoặc trả ngày hôm sau tính tối thiểu 1 ngày</p>
              </div>
            </div>

            {priceInfo && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-5">
                <h6 className="font-semibold flex items-center gap-2 mb-3"><FiDollarSign /> Chi tiết giá</h6>
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
                    <p className="text-xs text-gray-500">Tổng tiền</p>
                    <p className="font-bold text-lg text-green-600">{formatCurrency(priceInfo.total)}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea rows="2" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Ghi chú thêm (không bắt buộc)" value={form.notes} onChange={onChange('notes')} maxLength={500} />
              <p className="text-xs text-gray-400 mt-1">{form.notes.length}/500 ký tự</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50">
                {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <FiCheck />}
                Đặt xe & thanh toán cọc
              </button>
              <Link to={isAdmin ? '/bookings' : '/my-bookings'} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium flex items-center gap-2">
                <FiX /> Hủy
              </Link>
            </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
