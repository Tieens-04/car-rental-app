import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { carAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiCheck } from 'react-icons/fi';

export default function CarCreate() {
  const [form, setForm] = useState({
    carNumber: '', capacity: '', pricePerDay: '', status: 'available', features: '',
    brand: '', model: '', year: '', fuelType: 'petrol', transmission: 'manual', description: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    if (!form.carNumber.trim() || form.carNumber.length < 3) {
      toast.error('Biển số xe phải có ít nhất 3 ký tự'); return false;
    }
    if (!form.capacity || parseInt(form.capacity) < 1 || parseInt(form.capacity) > 100) {
      toast.error('Số chỗ ngồi phải từ 1-100'); return false;
    }
    if (!form.pricePerDay || parseFloat(form.pricePerDay) < 0) {
      toast.error('Giá thuê phải là số không âm'); return false;
    }
    if (form.year && (parseInt(form.year) < 1900 || parseInt(form.year) > new Date().getFullYear() + 1)) {
      toast.error('Năm sản xuất không hợp lệ'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = {
        carNumber: form.carNumber.trim(),
        capacity: parseInt(form.capacity),
        status: form.status,
        pricePerDay: parseFloat(form.pricePerDay),
        features: form.features.split(',').map(f => f.trim()).filter(Boolean),
      };
      if (form.brand.trim()) data.brand = form.brand.trim();
      if (form.model.trim()) data.model = form.model.trim();
      if (form.year) data.year = parseInt(form.year);
      if (form.fuelType) data.fuelType = form.fuelType;
      if (form.transmission) data.transmission = form.transmission;
      if (form.description.trim()) data.description = form.description.trim();

      await carAPI.create(data);
      toast.success('Thêm xe thành công!');
      navigate('/cars');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm xe thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-white border-b px-6 py-4 flex items-center gap-2 font-semibold">
          <FiPlus /> Thêm xe mới
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biển số xe <span className="text-red-500">*</span>
              </label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="VD: 51A-12345" value={form.carNumber} onChange={onChange('carNumber')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hãng xe
                </label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="VD: Toyota" value={form.brand} onChange={onChange('brand')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model xe
                </label>
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
                  placeholder="VD: 7" value={form.capacity} onChange={onChange('capacity')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá thuê/ngày (VND) <span className="text-red-500">*</span>
                </label>
                <input type="number" min="0" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="VD: 500000" value={form.pricePerDay} onChange={onChange('pricePerDay')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Năm sản xuất
                </label>
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
                placeholder="VD: Điều hòa, GPS, Camera lùi" value={form.features} onChange={onChange('features')} />
              <p className="text-xs text-gray-400 mt-1">Phân cách các tính năng bằng dấu phẩy</p>
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
                Thêm xe
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
