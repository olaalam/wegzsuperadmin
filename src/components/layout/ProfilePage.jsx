import { useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Phone, Shield, RefreshCw, 
  Edit3, Lock, X, Check, AtSign, Camera, KeyRound, UserCheck 
} from "lucide-react";
import { toast } from "sonner";

import { useMutation } from "../hooks/useMutation";

import Loader from "../components/common/Loader";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { localizeApiLabel } from "../utils/localization";
import { API_ENDPOINTS } from "../utils/constants";
import { useGet } from "../hooks/useGet";
// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  en: {
    name: "Full Name",
    username: "Username",
    email: "Email",
    phone: "Phone Number",
    role: "Account Role",
    notSet: "Not set",
    loading: "Loading profile...",
    errorTitle: "Failed to load profile",
    retry: "Try again",
    info: "Personal Information",
    security: "Account Security",
    editProfile: "Edit Profile",
    changePassword: "Change Password",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    currentPassword: "Current Password",
    newPassword: "New Password",
    profileUpdated: "Profile updated successfully!",
    passwordUpdated: "Password changed successfully!",
    activeStatus: "Active Account",
  },
  ar: {
    name: "الاسم الكامل",
    username: "اسم المستخدم",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    role: "دور الحساب",
    notSet: "غير محدد",
    loading: "جاري تحميل الملف الشخصي...",
    errorTitle: "فشل تحميل البيانات",
    retry: "إعادة المحاولة",
    info: "البيانات الشخصية",
    security: "أمان الحساب",
    editProfile: "تعديل البيانات",
    changePassword: "تغيير كلمة المرور",
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    profileUpdated: "تم تحديث الملف الشخصي بنجاح!",
    passwordUpdated: "تم تغيير كلمة المرور بنجاح!",
    activeStatus: "حساب نشط",
  },
};

// ─── Info Tile Component ──────────────────────────────────────────────────────

function InfoTile({ icon: Icon, label, value, badge }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]/60 hover:border-[var(--primary)]/30 transition-all">
      <div className="p-3 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--muted-foreground)] font-medium mb-0.5">{label}</p>
        {badge ? (
          <div>{badge}</div>
        ) : (
          <p className="text-sm font-semibold text-[var(--foreground)] truncate">
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const lang = useSelector((s) => s.ui.lang);
  const t = T[lang] ?? T.en;
  const cachedUser = useSelector((s) => s.auth.user);

  const { data, loading, error, refetch } = useGet(API_ENDPOINTS.USER.PROFILE);
  const { mutate, loading: mutationLoading } = useMutation();

  const apiResponse = data?.user ?? data?.data ?? data;
  const u = apiResponse ?? cachedUser;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: u?.name || "",
    email: u?.email || "",
    phone: u?.phone || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  if (loading && !u) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Loader fullScreen text={t.loading} />
      </div>
    );
  }

  if (error && !u) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <EmptyState
          icon={User}
          title={t.errorTitle}
          description={error}
          action={
            <button
              type="button"
              onClick={refetch}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 transition-opacity shadow-md shadow-[var(--primary)]/20"
            >
              <RefreshCw className="w-4 h-4" />
              {t.retry}
            </button>
          }
        />
      </div>
    );
  }

  const initials = u?.name
    ? u.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const result = await mutate("/api/auth/me", "PATCH", formData);
    if (result.success) {
      toast.success(t.profileUpdated);
      setIsEditModalOpen(false);
      refetch();
    } else {
      toast.error(result.error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const result = await mutate("/api/auth/change-password", "PATCH", passwordData);
    if (result.success) {
      toast.success(t.passwordUpdated);
      setIsPasswordModalOpen(false);
      setPasswordData({ currentPassword: "", newPassword: "" });
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Banner & Profile Header Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden"
        >
          {/* Cover Header */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-[var(--primary)]/20 via-[var(--primary)]/10 to-transparent relative">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
          </div>

          {/* Profile Header Details */}
          <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
            
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
              {/* Avatar Container */}
              <div className="relative">
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-[var(--card)] flex items-center justify-center text-white text-3xl font-extrabold shadow-xl"
                  style={{ background: "var(--primary)" }}
                >
                  {initials}
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[var(--card)]" title={t.activeStatus} />
              </div>

              {/* Name & Role */}
              <div className="mt-2 sm:mt-12">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
                  {u?.name ?? "—"}
                </h1>
                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                  <span className="text-xs text-[var(--muted-foreground)]">@{u?.username}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <Badge variant="default" className="capitalize text-xs px-2.5 py-0.5 rounded-lg">
                    {localizeApiLabel(u?.role, lang)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
              <button
                onClick={() => {
                  setFormData({ name: u?.name || "", email: u?.email || "", phone: u?.phone || "" });
                  setIsEditModalOpen(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20 hover:opacity-95 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>{t.editProfile}</span>
              </button>
              
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>{t.changePassword}</span>
              </button>
            </div>

          </div>
        </motion.div>

        {/* ── Main Information Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[var(--card)] rounded-3xl border border-[var(--border)] p-6 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">{t.info}</h2>

            </div>
            <UserCheck className="w-5 h-5 text-[var(--muted-foreground)]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoTile icon={AtSign} label={t.username} value={u?.username ?? t.notSet} />
            <InfoTile icon={User} label={t.name} value={u?.name} />
            <InfoTile icon={Mail} label={t.email} value={u?.email ?? t.notSet} />
            <InfoTile icon={Phone} label={t.phone} value={u?.phone ?? t.notSet} />
            <InfoTile
              icon={Shield}
              label={t.role}
              badge={
                <Badge variant="default" className="capitalize text-xs">
                  {localizeApiLabel(u?.role, lang)}
                </Badge>
              }
            />
          </div>
        </motion.div>

      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[var(--card)] rounded-3xl border border-[var(--border)] p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
                <h2 className="text-base font-bold text-[var(--foreground)]">{t.editProfile}</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">{t.name}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">{t.email}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">{t.phone}</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80 transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={mutationLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-[var(--primary)]/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.saveChanges}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[var(--card)] rounded-3xl border border-[var(--border)] p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[var(--primary)]" />
                  <h2 className="text-base font-bold text-[var(--foreground)]">{t.changePassword}</h2>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">{t.currentPassword}</label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">{t.newPassword}</label>
                  <input
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80 transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={mutationLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-[var(--primary)]/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.saveChanges}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}