import React, { useState, useEffect } from 'react';
import { PlusCircle, Download, TrendingUp, TrendingDown, DollarSign, Trash2, Edit2, X, Check } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CashFlowTracker = () => {
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'income',
    category: 'Gaji',
    amount: '',
    description: ''
  });

  const incomeCategories = ['Gaji', 'Pendapatan lainnya'];
  const expenseCategories = ['Makanan/Minuman', 'Ngopi', 'Hiburan', 'Service', 'Lainnya'];
  const allCategories = [...incomeCategories, ...expenseCategories];

  // Load data dari localStorage saat aplikasi dijalankan
  useEffect(() => {
    loadData();
    loadPin();
  }, []);

  // Simpan data setiap kali ada perubahan pada transaksi
  useEffect(() => {
    saveData();
  }, [transactions]);

  const loadData = () => {
    try {
      const saved = localStorage.getItem('cashflow-transactions');
      if (saved) {
        setTransactions(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Tidak ada data tersimpan');
    }
  };

  const saveData = () => {
    try {
      localStorage.setItem('cashflow-transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Gagal menyimpan data:', error);
    }
  };

  const loadPin = () => {
    try {
      const saved = localStorage.getItem('cashflow-pin');
      if (saved) {
        setSavedPin(saved);
      } else {
        setIsSettingPin(true);
        setIsLocked(false);
      }
    } catch (error) {
      console.log('PIN tidak ditemukan');
    }
  };

  const savePin = (newPin) => {
    try {
      localStorage.setItem('cashflow-pin', newPin);
      setSavedPin(newPin);
    } catch (error) {
      console.error('Gagal menyimpan PIN:', error);
    }
  };

  const handlePinSubmit = () => {
    if (isSettingPin) {
      if (pin.length !== 6 || !/^\d+$/.test(pin)) {
        setPinError('PIN harus 6 digit angka');
        return;
      }
      if (pin !== confirmPin) {
        setPinError('PIN tidak cocok');
        return;
      }
      savePin(pin);
      setIsSettingPin(false);
      setIsLocked(false);
      setPin('');
      setConfirmPin('');
      setPinError('');
    } else {
      if (pin === savedPin) {
        setIsLocked(false);
        setPin('');
        setPinError('');
      } else {
        setPinError('PIN salah!');
        setPin('');
      }
    }
  };

  const handleLockApp = () => {
    setIsLocked(true);
    setPin('');
    setPinError('');
  };

  const handlePinChange = (value) => {
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setPin(value);
      setPinError('');
    }
  };

  const handleConfirmPinChange = (value) => {
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setConfirmPin(value);
      setPinError('');
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Mohon isi jumlah dengan benar');
      return;
    }
    
    if (editingId) {
      setTransactions(transactions.map(t => 
        t.id === editingId ? { ...formData, id: editingId, amount: parseFloat(formData.amount) } : t
      ));
      setEditingId(null);
    } else {
      const newTransaction = {
        ...formData,
        id: Date.now(),
        amount: parseFloat(formData.amount)
      };
      setTransactions([newTransaction, ...transactions]);
    }
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      category: 'Gaji',
      amount: '',
      description: ''
    });
  };

  const deleteTransaction = (id) => {
    if(window.confirm('Hapus transaksi ini?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const editTransaction = (transaction) => {
    setFormData(transaction);
    setEditingId(transaction.id);
    setShowModal(true);
  };

  const calculateTotals = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  };

  const getCategoryData = () => {
    const categories = {};
    transactions.forEach(t => {
      if (!categories[t.category]) {
        categories[t.category] = 0;
      }
      categories[t.category] += t.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const getDailyData = () => {
    const daily = {};
    transactions.forEach(t => {
      if (!daily[t.date]) {
        daily[t.date] = { date: t.date, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        daily[t.date].income += t.amount;
      } else {
        daily[t.date].expense += t.amount;
      }
    });
    return Object.values(daily).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-10);
  };

  const exportToExcel = () => {
    if (transactions.length === 0) {
      alert('Belum ada transaksi untuk diexport');
      return;
    }

    const totals = calculateTotals();
    let csv = '\ufeff'; 
    csv += 'Tanggal,Jenis,Kategori,Jumlah,Keterangan\n';
    
    transactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('id-ID');
      const type = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      const category = t.category;
      const amount = t.amount;
      const description = (t.description || '').replace(/"/g, '""');
      csv += `"${date}","${type}","${category}","${amount}","${description}"\n`;
    });
    
    csv += '\n';
    csv += `"Total Pemasukan","","","${totals.income}",""\n`;
    csv += `"Total Pengeluaran","","","${totals.expense}",""\n`;
    csv += `"Saldo","","","${totals.balance}",""\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `arus-kas-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totals = calculateTotals();
  const categoryData = getCategoryData();
  const dailyData = getDailyData();
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 font-sans">
      {isLocked || isSettingPin ? (
        /* UI LOGIN / SETUP PIN */
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {isSettingPin ? 'Buat PIN' : 'Masukkan PIN'}
              </h2>
              <p className="text-gray-600">
                {isSettingPin 
                  ? 'Buat PIN 6 digit untuk mengamankan data Anda'
                  : 'Masukkan PIN untuk mengakses aplikasi'}
              </p>
            </div>
            <div className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-4 text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500"
                placeholder="••••••"
                maxLength="6"
              />
              {isSettingPin && (
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => handleConfirmPinChange(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-4 text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500"
                  placeholder="Konfirmasi PIN"
                  maxLength="6"
                />
              )}
              {pinError && <div className="text-red-500 text-center font-medium">{pinError}</div>}
              <button
                onClick={handlePinSubmit}
                className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                {isSettingPin ? 'Simpan PIN' : 'Buka Kunci'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN DASHBOARD */
        <div className="max-w-7xl mx-auto">
          {/* Header & Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-black text-gray-800">💰 ARUS KAS</h1>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleLockApp} className="px-4 py-2 bg-gray-500 text-white rounded-lg flex items-center gap-2"><X size={18}/> Kunci</button>
              <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><PlusCircle size={18}/> Tambah</button>
              <button onClick={exportToExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"><Download size={18}/> Export</button>
            </div>
          </div>

          {/* Cards Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard title="Pemasukan" amount={totals.income} icon={<TrendingUp/>} color="bg-emerald-500" />
            <SummaryCard title="Pengeluaran" amount={totals.expense} icon={<TrendingDown/>} color="bg-rose-500" />
            <SummaryCard title="Saldo" amount={totals.balance} icon={<DollarSign/>} color={totals.balance >= 0 ? "bg-indigo-500" : "bg-orange-500"} />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-bold mb-4">Tren 10 Hari Terakhir</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-bold mb-4">Distribusi Kategori</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
               <input 
                type="text" 
                placeholder="Cari transaksi..." 
                className="border p-2 rounded-lg w-full md:w-64"
                onChange={(e) => setSearchTerm(e.target.value)}
               />
               <div className="flex gap-2">
                 <select className="border p-2 rounded-lg" onChange={(e) => setFilterType(e.target.value)}>
                   <option value="all">Semua Jenis</option>
                   <option value="income">Pemasukan</option>
                   <option value="expense">Pengeluaran</option>
                 </select>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Keterangan</th>
                    <th className="p-4 text-right">Jumlah</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="p-4">{t.date}</td>
                      <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{t.category}</span></td>
                      <td className="p-4">{t.description}</td>
                      <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="p-4 flex justify-center gap-2">
                        <button onClick={() => editTransaction(t)} className="text-blue-500"><Edit2 size={16}/></button>
                        <button onClick={() => deleteTransaction(t.id)} className="text-red-500"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingId ? 'Edit' : 'Tambah'} Transaksi</h2>
              <button onClick={() => {setShowModal(false); setEditingId(null);}}><X/></button>
            </div>
            <div className="space-y-4">
              <input type="date" className="w-full border p-3 rounded-lg" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              <select className="w-full border p-3 rounded-lg" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value, category: e.target.value === 'income' ? 'Gaji' : 'Makanan/Minuman'})}>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
              <select className="w-full border p-3 rounded-lg" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {(formData.type === 'income' ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="Jumlah Rp" className="w-full border p-3 rounded-lg" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              <textarea placeholder="Keterangan" className="w-full border p-3 rounded-lg" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <button onClick={handleSubmit} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                <Check size={18}/> Simpan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-komponen untuk Card Summary
const SummaryCard = ({ title, amount, icon, color }) => (
  <div className={`${color} p-6 rounded-2xl text-white shadow-lg`}>
    <div className="flex justify-between mb-2 opacity-80">
      <span>{title}</span>
      {icon}
    </div>
    <div className="text-2xl font-bold">
      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}
    </div>
  </div>
);

export default CashFlowTracker;
