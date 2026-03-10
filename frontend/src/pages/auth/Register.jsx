import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiUserPlus, FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';

export default function Register() {
  const [form, setForm] = useState({
    username: '', email: '', fullName: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const validate = () => {
    if (!form.username.trim() || form.username.length < 3 || form.username.length > 30) {
      toast.error('Tên đăng nhập phải từ 3-30 ký tự'); return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      toast.error('Tên đăng nhập chỉ được chứa chữ cái, số và dấu _'); return false;
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Email không hợp lệ'); return false;
    }
    if (!form.fullName.trim() || form.fullName.length < 2) {
      toast.error('Họ tên phải có ít nhất 2 ký tự'); return false;
    }
    if (form.phone && !/^[0-9]{10,11}$/.test(form.phone)) {
      toast.error('Số điện thoại phải có 10-11 số'); return false;
    }
    if (!form.password || form.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu không khớp'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <FiUserPlus className="text-6xl text-green-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold">Đăng ký tài khoản</h3>
            <p className="text-gray-500">Tạo tài khoản để sử dụng dịch vụ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiUser className="inline mr-1" /> Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Tên đăng nhập" value={form.username} onChange={onChange('username')} />
                <p className="text-xs text-gray-400 mt-1">3-30 ký tự, chỉ chữ, số và _</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiMail className="inline mr-1" /> Email <span className="text-red-500">*</span>
                </label>
                <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="example@email.com" value={form.email} onChange={onChange('email')} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiUser className="inline mr-1" /> Họ và tên <span className="text-red-500">*</span>
              </label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Nhập họ và tên" value={form.fullName} onChange={onChange('fullName')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiPhone className="inline mr-1" /> Số điện thoại
              </label>
              <input type="tel" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="VD: 0912345678" value={form.phone} onChange={onChange('phone')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiLock className="inline mr-1" /> Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12"
                    placeholder="Mật khẩu" value={form.password} onChange={onChange('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Tối thiểu 6 ký tự</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiLock className="inline mr-1" /> Xác nhận <span className="text-red-500">*</span>
                </label>
                <input type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Nhập lại mật khẩu" value={form.confirmPassword} onChange={onChange('confirmPassword')} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              ) : (
                <><FiUserPlus /> Đăng ký</>
              )}
            </button>
          </form>

          <hr className="my-6" />
          <p className="text-center text-gray-600">
            Đã có tài khoản? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập</Link>
          </p>
        </div>
        <div className="text-center mt-4">
          <Link to="/" className="text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
            <FiArrowLeft /> Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
