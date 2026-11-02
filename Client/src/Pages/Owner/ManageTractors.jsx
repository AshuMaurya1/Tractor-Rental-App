import { useCallback, useEffect, useState, useMemo } from "react";
import Title from "../../Components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { 
  Tractor, 
  Search, 
  Plus, 
  Trash2, 
  MapPin, 
  CheckCircle2,
  Clock,
  XCircle,
  Edit3,
  X,
} from "lucide-react";

const ManageTractors = () => {
  const { axios, currency = "₹", language = 'en' } = useAppContext();
  const [tractors, setTractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit modal state
  const [editingTractor, setEditingTractor] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAvailability, setEditAvailability] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOwnerTractors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/owner/tractors');
      if (data.success && Array.isArray(data.tractors)) {
        setTractors(data.tractors);
      } else {
        setTractors([]);
      }
    } catch {
      setTractors([]);
    } finally {
      setLoading(false);
    }
  }, [axios]);

  useEffect(() => {
    fetchOwnerTractors();
  }, [fetchOwnerTractors]);

  const toggleAvailability = async (tractorId) => {
    try {
      const { data } = await axios.put(`/api/owner/tractors/${tractorId}/availability`);
      if (data.success) {
        toast.success(data.message || "Availability status updated");
        setTractors(prev => prev.map(t => (t._id === tractorId || t.id === tractorId) ? { ...t, isAvailable: !t.isAvailable } : t));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to update tractor availability.');
    }
  };

  const deleteTractor = async (tractorId) => {
    try {
      const shouldDelete = window.confirm('Are you sure you want to remove this tractor from your fleet?');
      if (!shouldDelete) return;

      const { data } = await axios.delete(`/api/owner/tractors/${tractorId}`);
      if (data.success) {
        toast.success(data.message || "Tractor deleted successfully");
        setTractors(prev => prev.filter(t => t._id !== tractorId && t.id !== tractorId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to delete tractor.');
    }
  };

  const openEditModal = (tractor) => {
    setEditingTractor(tractor);
    setEditPrice(tractor.pricePerDay || "");
    setEditLocation(tractor.location || "");
    setEditDescription(tractor.description || "");
    setEditAvailability(Boolean(tractor.isAvailable));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTractor) return;

    setIsUpdating(true);
    try {
      const { data } = await axios.put(`/api/owner/tractors/${editingTractor._id}`, {
        pricePerDay: Number(editPrice),
        location: editLocation.trim(),
        description: editDescription.trim(),
        isAvailable: editAvailability,
      });

      if (data.success) {
        toast.success("Tractor details updated successfully!");
        setEditingTractor(null);
        fetchOwnerTractors();
      } else {
        toast.error(data.message || "Unable to update tractor.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update tractor.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTractors = useMemo(() => {
    return tractors.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        `${t.brand || ''} ${t.model || ''}`.toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t.location || "").toLowerCase().includes(q);
      
      const verificationStatus = String(t.status || 'pending').toLowerCase();
      const matchesStatus = statusFilter === "all" || verificationStatus === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [tractors, searchQuery, statusFilter]);

  const approvedCount = tractors.filter(t => t.status === 'approved').length;
  const pendingCount = tractors.filter(t => t.status === 'pending').length;
  const rejectedCount = tractors.filter(t => t.status === 'rejected').length;

  const verificationBadge = (status) => {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
          <CheckCircle2 size={12} /> Approved
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-300">
          <XCircle size={12} /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-300">
        <Clock size={12} /> Pending Verification
      </span>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 antialiased">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <Title
          title={language === 'hi' ? "मेरी कृषि उपकरण सूची" : "My Equipment"}
          subtitle={
            language === 'hi'
              ? "अपने पंजीकृत ट्रैक्टरों की सूची, सत्यापन स्थिति, दैनिक दरें और उपलब्धता प्रबंधित करें।"
              : "Review your registered equipment, approval status, rental rates, and availability."
          }
        />

        <Link
          to="/owner/add-tractor"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus size={16} />
          <span>Add Equipment</span>
        </Link>
      </div>

      {/* Fleet Stats Mini-Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Units</span>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{tractors.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Tractor size={18} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved</span>
            <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{approvedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Review</span>
            <p className="text-xl font-extrabold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rejected</span>
            <p className="text-xl font-extrabold text-rose-600 mt-0.5">{rejectedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <XCircle size={18} />
          </div>
        </div>
      </div>

      {/* Fleet Table Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tractor name, model, hub..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Statuses" },
              { id: "approved", label: "Approved" },
              { id: "pending", label: "Pending" },
              { id: "rejected", label: "Rejected" },
            ].map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                  statusFilter === f.id
                    ? "bg-slate-900 text-white font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tractors List Table */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filteredTractors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                  <th className="py-3 px-3">Tractor Machinery</th>
                  <th className="py-3 px-3">Specifications</th>
                  <th className="py-3 px-3">Daily Rental Price</th>
                  <th className="py-3 px-3">Field Availability</th>
                  <th className="py-3 px-3">Verification Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTractors.map((tractor) => {
                  const tractorId = tractor._id;
                  const price = Number(tractor.pricePerDay) || 0;
                  const isRejected = tractor.status === 'rejected';

                  return (
                    <tr key={tractorId} className="hover:bg-slate-50/80 transition-colors align-top">
                      {/* Image & Name */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-start gap-3 min-w-[200px]">
                          <img
                            src={tractor.image}
                            alt={`${tractor.brand} ${tractor.model}`}
                            className="h-12 w-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {tractor.brand} {tractor.model}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={11} className="text-slate-400" />
                              <span>{tractor.location || "Regional Hub"}</span>
                            </p>
                            {/* If rejected, show reason prominently under the tractor info! */}
                            {isRejected && tractor.rejectionReason && (
                              <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-snug">
                                <span className="font-bold block">Admin Rejection Reason:</span>
                                {tractor.rejectionReason}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 block">
                            {tractor.horsepower || 45} HP · {tractor.year || 2023}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {tractor.fuelType?.split(' ')[0] || 'Diesel'} · {tractor.transmission?.split(' ')[0] || 'Manual'}
                          </span>
                        </div>
                      </td>

                      {/* Daily Price */}
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {currency}{price.toLocaleString('en-IN')}
                          <span className="text-[10px] text-slate-400 font-normal block"> per day</span>
                        </div>
                      </td>

                      {/* Availability toggle */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => toggleAvailability(tractorId)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            tractor.isAvailable
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                          }`}
                          title="Click to toggle availability"
                        >
                          <span className={`w-2 h-2 rounded-full ${tractor.isAvailable ? "bg-emerald-600" : "bg-slate-400"}`}></span>
                          {tractor.isAvailable ? "Available" : "Busy"}
                        </button>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-3">
                        {verificationBadge(tractor.status, tractor.rejectionReason)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(tractor)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Edit Tractor Details"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteTractor(tractorId)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Remove Tractor"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <Tractor size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-800">No machinery units found</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {tractors.length === 0
                ? "You haven't registered any tractors yet. Click Add New Tractor to list your machinery."
                : "No tractors match your filter criteria."}
            </p>
            {tractors.length === 0 && (
              <Link
                to="/owner/add-tractor"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <Plus size={14} /> Register Your First Tractor
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Edit Tractor Modal */}
      {editingTractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingTractor(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900">
              Edit {editingTractor.brand} {editingTractor.model}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update daily rental pricing, hub location, or description.
            </p>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Daily Rental Price ({currency})
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                  min="300"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-emerald-600 focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Field Dispatch Hub / District
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Technical Description & Compatible Implements
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editAvailability}
                  onChange={(e) => setEditAvailability(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Available for Immediate Booking</span>
                  <span className="text-slate-500">Uncheck if machine is undergoing maintenance or busy in field.</span>
                </div>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTractor(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTractors;
