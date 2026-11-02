import { useState, useEffect } from 'react';
import Title from '../../Components/owner/Title';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import {
  Phone,
  Mail,
  Camera,
  ShieldCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import { assets } from '../../assets/assets';

const OwnerProfile = () => {
  const { user, setUser, axios, fetchUser, language = 'en' } = useAppContext();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('image', avatarFile);

      const { data } = await axios.post('/api/owner/update-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success('Profile photo updated successfully!');
        setAvatarFile(null);
        fetchUser();
      } else {
        toast.error(data.message || 'Unable to update photo.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Photo upload failed.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    setIsUpdating(true);
    try {
      const { data } = await axios.put('/api/user/profile', {
        name: name.trim(),
        phone: phone.trim(),
      });

      if (data.success && data.user) {
        setUser(data.user);
        toast.success('Owner profile details updated successfully.');
      } else {
        toast.error(data.message || 'Unable to update profile.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile update failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 antialiased">
      <Title
        title={language === 'hi' ? 'मालिक प्रोफ़ाइल व सेटिंग्स' : 'Owner Profile & Depot Settings'}
        subtitle={
          language === 'hi'
            ? 'अपनी संपर्क जानकारी, फ्लीट विवरण और प्रोफ़ाइल फ़ोटो प्रबंधित करें।'
            : 'Manage your partner profile, contact credentials, and custom hiring center details.'
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        {/* Avatar & Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100">
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100">
              <img
                src={avatarPreview || user?.image || assets.user1 || assets.user}
                alt={user?.name || 'Owner'}
                className="h-full w-full object-cover"
              />
            </div>
            <label
              htmlFor="owner-photo-input"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 cursor-pointer transition-colors"
              title="Upload new profile photo"
            >
              <Camera size={14} />
              <input
                id="owner-photo-input"
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 truncate">
              {user?.name || 'Tractor Fleet Partner'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                <ShieldCheck size={12} /> Verified Tractor Owner
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{user?.email || '—'}</span>
            </div>

            {avatarFile && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={uploadAvatar}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isUploadingPhoto ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Check size={12} /> Save Uploaded Photo
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Owner / Enterprise Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs outline-none focus:border-emerald-600 focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Direct Contact Phone
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-emerald-600 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Registered Account Email (Read-only)
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isUpdating}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OwnerProfile;
