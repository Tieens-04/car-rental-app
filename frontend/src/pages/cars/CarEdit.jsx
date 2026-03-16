import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { carAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit2, FiX, FiCheck } from 'react-icons/fi';

export default function CarEdit() {
  const { carNumber } = useParams();
  const [form, setForm] = useState({
    capacity: '', pricePerDay: '', status: '', features: '',
    brand: '', model: '', year: '', fuelType: 'petrol', transmission: 'manual', description: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    carAPI.getByNumber(decodeURIComponent(carNumber))
      .then(({ data }) => {
        const car = data.data.car;
        setForm({
          capacity: car.capacity.toString(),
          pricePerDay: car.pricePerDay.toString(),
          status: car.status,
          features: car.features?.join(', ') || '',
          brand: car.brand || '',
          model: car.model || '',
          year: car.year ? car.year.toString() : '',
          fuelType: car.fuelType || 'petrol',
          transmission: car.transmission || 'manual',
          description: car.description || '',
        });
      })
      .catch(() => {
        toast.error('Không tìm thấy xe');
        navigate('/cars');
      })
      .finally(() => setFetching(false));
  }, [carNumber]);

  const onChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.capacity || parseInt(form.capacity) < 1) {
      toast.error('Số chỗ ngồi phải >= 1'); return;
    }
    if (parseInt(form.capacity) > 100) {
      toast.error('Số chỗ ngồi không vượt quá 100'); return;
    }
    if (!form.pricePerDay || parseFloat(form.pricePerDay) < 0) {
      toast.error('Giá thuê phải >= 0'); return;
    }
    if (form.year && (parseInt(form.year) < 1900 || parseInt(form.year) > new Date().getFullYear() + 1)) {
      toast.error('Năm sản xuất không hợp lệ'); return;
    }

    setLoading(true);
    try {
      const data = {
        capacity: parseInt(form.capacity),
        status: form.status,
        pricePerDay: parseFloat(form.pricePerDay),
        features: form.features.split(',').map(f => f.trim()).filter(Boolean),
        brand: form.brand.trim(),
        model: form.model.trim(),
        fuelType: form.fuelType,
        transmission: form.transmission,
        description: form.description.trim(),
      };
      if (form.year) data.year = parseInt(form.year);

      await carAPI.update(decodeURIComponent(carNumber), data);
      toast.success('Cập nhật xe thành công!');
      navigate('/cars');
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
          <FiEdit2 /> Chỉnh sửa xe: {decodeURIComponent(carNumber)}
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biển số xe</label>
              <input type="text" disabled className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                value={decodeURIComponent(carNumber)} />
              <p className="text-xs text-gray-400 mt-1">Biển số xe không thể thay đổi</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hãng xe</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="VD: Toyota" value={form.brand} onChange={onChange('brand')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model xe</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="VD: Camry" value={form.model} onChange={onChange('model')} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số chỗ ngồi <span className="text-red-500">*</span>
                </label>
                <input type="number" min="1" max="100" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.capacity} onChange={onChange('capacity')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá thuê/ngày (VND) <span className="text-red-500">*</span>
                </label>
                <input type="number" min="0" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.pricePerDay} onChange={onChange('pricePerDay')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Năm sản xuất</label>
                <input type="number" min="1900" max={new Date().getFullYear() + 1} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="VD: 2023" value={form.year} onChange={onChange('year')} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.status} onChange={onChange('status')}>
                  <option value="available">Sẵn sàng</option>
                  <option value="rented">Đang thuê</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhiên liệu</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.fuelType} onChange={onChange('fuelType')}>
                  <option value="petrol">Xăng</option>
                  <option value="diesel">Dầu diesel</option>
                  <option value="electric">Điện</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hộp số</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.transmission} onChange={onChange('transmission')}>
                  <option value="manual">Số sàn</option>
                  <option value="automatic">Tự động</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tính năng</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="VD: Điều hòa, GPS" value={form.features} onChange={onChange('features')} />
              <p className="text-xs text-gray-400 mt-1">Phân cách bằng dấu phẩy</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea rows="3" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Mô tả ngắn về xe..." value={form.description} onChange={onChange('description')} maxLength={500} />
              <p className="text-xs text-gray-400 mt-1">{form.description.length}/500 ký tự</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50">
                {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <FiCheck />}
                Cập nhật
              </button>
              <Link to="/cars" className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium flex items-center gap-2">
                <FiX /> Hủy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
