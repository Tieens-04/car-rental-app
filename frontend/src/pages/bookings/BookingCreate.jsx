import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { bookingAPI, carAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiCheck, FiDollarSign } from 'react-icons/fi';

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

export default function BookingCreate() {
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({ customerName: '', carNumber: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    carAPI.getAll({ limit: 100 }).then(({ data }) => {
      setCars(data.data.cars.filter(c => c.status !== 'maintenance'));
    }).catch(() => toast.error('Không thể tải danh sách xe'));
  }, []);

  const onChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const priceInfo = useMemo(() => {
    const car = cars.find(c => c.carNumber === form.carNumber);
    if (!car || !form.startDate || !form.endDate) return null;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end <= start) return null;
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return { pricePerDay: car.pricePerDay, days, total: days * car.pricePerDay };
  }, [form.carNumber, form.startDate, form.endDate, cars]);

  const today = new Date().toISOString().split('T')[0];

  const validate = () => {
    if (!form.customerName.trim() || form.customerName.length < 3) {
      toast.error('Tên khách hàng phải có ít nhất 3 ký tự'); return false;
    }
    if (!form.carNumber) { toast.error('Vui lòng chọn xe'); return false; }
    if (!form.startDate) { toast.error('Vui lòng chọn ngày bắt đầu'); return false; }
    if (!form.endDate) { toast.error('Vui lòng chọn ngày kết thúc'); return false; }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu'); return false;
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
      });
      toast.success('Đặt xe thành công!');
      navigate('/bookings');
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên khách hàng <span className="text-red-500">*</span>
              </label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="VD: Nguyễn Văn A" value={form.customerName} onChange={onChange('customerName')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chọn xe <span className="text-red-500">*</span>
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={form.carNumber} onChange={onChange('carNumber')}>
                <option value="">-- Chọn xe --</option>
                {cars.map(car => (
                  <option key={car._id} value={car.carNumber}>
                    {car.carNumber} - {car.capacity} chỗ - {formatCurrency(car.pricePerDay)}/ngày
                    {car.status === 'rented' ? ' (Đang thuê)' : ''}
                  </option>
                ))}
              </select>
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

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50">
                {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <FiCheck />}
                Đặt xe
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
