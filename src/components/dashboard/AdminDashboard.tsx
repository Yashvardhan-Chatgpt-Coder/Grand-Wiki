import { useState, useEffect } from "react";
import { useSearch } from "@tanstack/react-router";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { adminApi, notificationsApi, type ApiNotification } from "@/lib/api";
import { queue } from "@/components/ui/Toast";
import { Trash2, Edit2, Plus, Heart, Bell, Clock, Link as LinkIcon } from "lucide-react";
import { CountUp } from "@/components/dashboard/CountUp";
import { formatDonationAmount } from "@/lib/philanthropists";
import * as LucideIcons from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Donation {
  _id: string;
  id: string;
  name: string;
  amount: number;
  server: string;
  status: string;
  proofUrl?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function AdminDashboard() {
  const search = useSearch({ from: "/admin" });
  const tab = (search as { tab?: string }).tab || "philanthropists";

  if (tab === "notifications") {
    return <NotificationsTab />;
  }

  return <PhilanthropistsTab />;
}

function PhilanthropistsTab() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    server: "EN1",
    status: "active",
    proofUrl: "",
    notes: ""
  });

  const loadDonations = async () => {
    try {
      const data = await adminApi.getDonations();
      setDonations(data);
    } catch (error) {
      console.error(error);
      queue.add(
        { title: "Error", description: "Failed to load donations", variant: "error" },
        { timeout: 3000 }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = Number(formData.amount);
    if (!formData.name.trim() || !formData.server.trim() || isNaN(amount) || amount < 0) {
      queue.add(
        { title: "Validation Error", description: "Please fill all required fields", variant: "error" },
        { timeout: 3000 }
      );
      return;
    }

    try {
      if (editingId) {
        await adminApi.updateDonation(editingId, {
          name: formData.name.trim(),
          amount,
          server: formData.server.trim(),
          status: formData.status,
          proofUrl: formData.proofUrl || null,
          notes: formData.notes || ""
        });
        queue.add(
          { title: "Success", description: "Donation updated successfully", variant: "success" },
          { timeout: 3000 }
        );
      } else {
        await adminApi.createDonation({
          name: formData.name.trim(),
          amount,
          server: formData.server.trim(),
          status: formData.status,
          proofUrl: formData.proofUrl || null,
          notes: formData.notes || ""
        });
        queue.add(
          { title: "Success", description: "Donation added successfully", variant: "success" },
          { timeout: 3000 }
        );
      }
      
      setFormData({ name: "", amount: "", server: "EN1", status: "active", proofUrl: "", notes: "" });
      setEditingId(null);
      setModalOpen(false);
      loadDonations();
    } catch (error) {
      console.error(error);
      queue.add(
        { title: "Error", description: "Failed to save donation", variant: "error" },
        { timeout: 3000 }
      );
    }
  };

  const handleEdit = (donation: Donation) => {
    setFormData({
      name: donation.name,
      amount: String(donation.amount),
      server: donation.server,
      status: donation.status,
      proofUrl: donation.proofUrl || "",
      notes: donation.notes || ""
    });
    setEditingId(donation._id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this donation?")) return;
    
    try {
      await adminApi.deleteDonation(id);
      queue.add(
        { title: "Success", description: "Donation deleted successfully", variant: "success" },
        { timeout: 3000 }
      );
      loadDonations();
    } catch (error) {
      console.error(error);
      queue.add(
        { title: "Error", description: "Failed to delete donation", variant: "error" },
        { timeout: 3000 }
      );
    }
  };

  const totalDonations = donations
    .filter(d => d.status === "active")
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <OrganizerLayout header={<SoftwareHeader />}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[720px] space-y-10 p-8">
            {/* Header with Total */}
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center rounded-full bg-[#fef2f2] p-3">
                <Heart className="h-6 w-6 text-red-500 fill-red-500" />
              </div>

              <div>
                <p className="text-[13px] font-medium uppercase tracking-wider text-[#8a90a0]">
                  Total Active Donations
                </p>
                <CountUp
                  value={totalDonations}
                  format={formatDonationAmount}
                  className="mt-2 block text-[56px] font-bold leading-none tracking-tight text-[#000000] sm:text-[64px]"
                />
              </div>

              <button
                onClick={() => {
                  setFormData({ name: "", amount: "", server: "EN1", status: "active", proofUrl: "", notes: "" });
                  setEditingId(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-[8px] border border-[#e2e5ec] bg-white px-4 py-2 text-[14px] font-medium text-[#000000] hover:bg-[#f7f8fb] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Donation
              </button>
            </div>

            {/* Donations List */}
            <div className="space-y-5">
              <h2 className="text-center text-[22px] font-semibold tracking-tight text-[#000000]">
                Manage All Donations
              </h2>

              <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-5 space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-[14px] text-[#8a90a0]">
                      Loading donations...
                    </p>
                  </div>
                ) : donations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[14px] text-[#8a90a0]">
                      No donations yet. Click "Add Donation" to create one.
                    </p>
                  </div>
                ) : (
                  donations.map((donation, index) => (
                    <div key={donation._id}>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="text-[15px] font-semibold text-[#000000]">
                              {donation.name}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              donation.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-zinc-100 text-zinc-700"
                            }`}>
                              {donation.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-[13px] text-[#8a90a0]">
                              {formatDonationAmount(donation.amount)}
                            </span>
                            <span className="text-[13px] text-[#8a90a0]">
                              {donation.server}
                            </span>
                            <span className="text-[11px] text-[#9ca3af]">
                              {new Date(donation.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(donation)}
                            className="rounded-[6px] p-1.5 text-[#8a90a0] hover:bg-[#f7f8fb] hover:text-[#000000] transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(donation._id)}
                            className="rounded-[6px] p-1.5 text-[#8a90a0] hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {index !== donations.length - 1 && (
                        <div className="h-px bg-[#f0f1f3] my-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && setModalOpen(false)}>
        <DialogContent className="!max-w-[680px] !w-[92vw] p-7 overflow-hidden rounded-[18px] border border-[#e2e5ec] bg-white shadow-2xl">
          <div className="flex items-center justify-center gap-2.5 pb-1">
            <Heart className="h-6 w-6 text-red-500 fill-red-500 shrink-0" />
            <DialogTitle className="text-[22px] font-bold tracking-tight text-[#000000]">
              {editingId ? "Edit Donation" : "Add Donation"}
            </DialogTitle>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                  Donor Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                  Server *
                </label>
                <select
                  value={formData.server}
                  onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                  className="w-full rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
                  required
                >
                  <option value="EN1">EN1</option>
                  <option value="EN2">EN2</option>
                  <option value="EN3">EN3</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                Proof URL
              </label>
              <input
                type="url"
                value={formData.proofUrl}
                onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
                className="w-full rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all resize-none"
                rows={3}
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 rounded-[10px] bg-black px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-zinc-900 transition-colors"
              >
                {editingId ? "Update Donation" : "Add Donation"}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-[10px] border border-[#e2e5ec] px-6 py-2.5 text-[13px] font-semibold text-[#4b5563] hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </OrganizerLayout>
  );
}

const NOTIFICATION_COLORS = [
  { value: "blue", label: "Blue", bg: "bg-blue-500" },
  { value: "green", label: "Green", bg: "bg-green-500" },
  { value: "red", label: "Red", bg: "bg-red-500" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-500" },
  { value: "purple", label: "Purple", bg: "bg-purple-500" },
  { value: "pink", label: "Pink", bg: "bg-pink-500" },
  { value: "indigo", label: "Indigo", bg: "bg-indigo-500" },
  { value: "orange", label: "Orange", bg: "bg-orange-500" },
];

function NotificationsTab() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "Bell",
    stopAfter: "",
    stopAfterUnit: "Days" as "Mins" | "Hours" | "Days",
    color: "blue",
    link: "",
    status: "draft" as "draft" | "active",
  });

  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
    } catch (error) {
      console.error(error);
      queue.add(
        { title: "Error", description: "Failed to load notifications", variant: "error" },
        { timeout: 3000 }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleSubmit = async (e: React.FormEvent, publishNow: boolean = false) => {
    e.preventDefault();

    const stopAfter = Number(formData.stopAfter);
    if (!formData.title.trim() || !formData.description.trim() || isNaN(stopAfter) || stopAfter <= 0) {
      queue.add(
        { title: "Validation Error", description: "Please fill all required fields", variant: "error" },
        { timeout: 3000 }
      );
      return;
    }

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        stopAfter,
        stopAfterUnit: formData.stopAfterUnit,
        color: formData.color,
        link: formData.link.trim(),
        status: publishNow ? "active" : formData.status,
      };

      if (editingId) {
        await notificationsApi.update(editingId, payload);
        queue.add(
          { title: "Success", description: `Notification ${publishNow ? 'published' : 'updated'} successfully`, variant: "success" },
          { timeout: 3000 }
        );
      } else {
        await notificationsApi.create(payload);
        queue.add(
          { title: "Success", description: `Notification ${publishNow ? 'published' : 'saved as draft'} successfully`, variant: "success" },
          { timeout: 3000 }
        );
      }

      setFormData({
        title: "",
        description: "",
        icon: "Bell",
        stopAfter: "",
        stopAfterUnit: "Days",
        color: "blue",
        link: "",
        status: "draft",
      });
      setEditingId(null);
      setModalOpen(false);
      loadNotifications();
    } catch (error) {
      console.error(error);
      queue.add(
        { title: "Error", description: "Failed to save notification", variant: "error" },
        { timeout: 3000 }
      );
    }
  };

  const handleEdit = (notification: ApiNotification) => {
    setFormData({
      title: notification.title,
      description: notification.description,
      icon: notification.icon,
      stopAfter: String(notification.stopAfter),
      stopAfterUnit: notification.stopAfterUnit,
      color: notification.color,
      link: notification.link || "",
      status: notification.status === "expired" ? "draft" : (notification.status as "draft" | "active"),
    });
    setEditingId(notification._id);
    setModalOpen(true);
  };

  const handlePublish = async (id: string) => {
    try {
      await notificationsApi.update(id, { status: "active" });
      queue.add(
        { title: "Success", description: "Notification published successfully", variant: "success" },
        { timeout: 3000 }
      );
      loadNotifications();
    } catch (error) {
      console.error(error);
      queue.add(
        { title: "Error", description: "Failed to publish notification", variant: "error" },
        { timeout: 3000 }
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      await notificationsApi.delete(id);
      queue.add(
        { title: "Success", description: "Notification deleted successfully", variant: "success" },
        { timeout: 3000 }
      );
      loadNotifications();
    } catch (error) {
      console.error(error);
      queue.add(
        { title: "Error", description: "Failed to delete notification", variant: "error" },
        { timeout: 3000 }
      );
    }
  };

  const activeNotifications = notifications.filter(n => n.status === "active");
  const draftNotifications = notifications.filter(n => n.status === "draft");
  const expiredNotifications = notifications.filter(n => n.status === "expired");

  const getIconComponent = (iconData: string) => {
    // If it's a base64 data URL, decode it first
    if (iconData && iconData.startsWith('data:image/svg+xml;base64,')) {
      try {
        const base64Data = iconData.replace('data:image/svg+xml;base64,', '');
        const decodedSvg = atob(base64Data);
        return null; // Will be rendered as HTML
      } catch (e) {
        console.error('Failed to decode base64 icon:', e);
      }
    }
    // If it's raw SVG code, return null (we'll render it directly)
    if (iconData && iconData.includes('<svg')) {
      return null;
    }
    // Fallback to Lucide icon if it's a name
    const IconComponent = (LucideIcons as any)[iconData];
    return IconComponent || LucideIcons.Bell;
  };

  const renderIcon = (iconData: string, className: string = "h-4 w-4 text-white") => {
    // Handle base64 data URL
    if (iconData && iconData.startsWith('data:image/svg+xml;base64,')) {
      try {
        const base64Data = iconData.replace('data:image/svg+xml;base64,', '');
        const decodedSvg = atob(base64Data);
        return (
          <div 
            className={className}
            dangerouslySetInnerHTML={{ __html: decodedSvg }}
          />
        );
      } catch (e) {
        console.error('Failed to decode base64 icon:', e);
      }
    }
    // Handle raw SVG
    if (iconData && iconData.includes('<svg')) {
      return (
        <div 
          className={className}
          dangerouslySetInnerHTML={{ __html: iconData }}
        />
      );
    }
    // Handle icon name
    const IconComponent = getIconComponent(iconData);
    return IconComponent ? <IconComponent className={className} /> : <Bell className={className} />;
  };

  return (
    <OrganizerLayout header={<SoftwareHeader />}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[720px] space-y-10 p-8">
            {/* Header */}
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center rounded-full bg-[#eff6ff] p-3">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>

              <div>
                <p className="text-[13px] font-medium uppercase tracking-wider text-[#8a90a0]">
                  Active / Drafts
                </p>
                <p className="mt-2 text-[56px] font-bold leading-none tracking-tight text-[#000000] sm:text-[64px]">
                  {activeNotifications.length} / {draftNotifications.length}
                </p>
              </div>

              <button
                onClick={() => {
                  setFormData({
                    title: "",
                    description: "",
                    icon: "Bell",
                    stopAfter: "",
                    stopAfterUnit: "Days",
                    color: "blue",
                    link: "",
                    status: "draft",
                  });
                  setEditingId(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-[8px] border border-[#e2e5ec] bg-white px-4 py-2 text-[14px] font-medium text-[#000000] hover:bg-[#f7f8fb] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Notification
              </button>
            </div>

            {/* Notifications List */}
            <div className="space-y-5">
              <h2 className="text-center text-[22px] font-semibold tracking-tight text-[#000000]">
                All Notifications
              </h2>

              <div className="rounded-[10px] border border-[#e2e5ec] bg-white p-5 space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-[14px] text-[#8a90a0]">
                      Loading notifications...
                    </p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[14px] text-[#8a90a0]">
                      No notifications yet. Click "Create Notification" to add one.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification, index) => {
                    const colorClass = NOTIFICATION_COLORS.find(c => c.value === notification.color)?.bg || "bg-blue-500";
                    const isExpired = notification.status === "expired";
                    const expiresAt = new Date(notification.expiresAt);
                    const now = new Date();
                    const timeLeft = expiresAt.getTime() - now.getTime();
                    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                    const daysLeft = Math.floor(hoursLeft / 24);

                    return (
                      <div key={notification._id}>
                        <div className="flex items-start gap-3 py-2">
                          <div className={`rounded-[8px] ${colorClass} p-2.5 shrink-0 flex items-center justify-center w-10 h-10`}>
                            {renderIcon(notification.icon, "h-5 w-5 text-white")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[15px] font-semibold text-[#000000]">
                                    {notification.title}
                                  </span>
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    notification.status === "draft"
                                      ? "bg-amber-100 text-amber-700"
                                      : isExpired
                                        ? "bg-zinc-100 text-zinc-700"
                                        : "bg-emerald-100 text-emerald-700"
                                  }`}>
                                    {notification.status === "draft" ? "Draft" : isExpired ? "Expired" : "Active"}
                                  </span>
                                </div>
                                <p className="mt-1 text-[13px] text-[#8a90a0] leading-relaxed">
                                  {notification.description}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-[11px] text-[#9ca3af]">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {isExpired 
                                      ? "Expired" 
                                      : daysLeft > 0 
                                        ? `${daysLeft}d left`
                                        : hoursLeft > 0
                                          ? `${hoursLeft}h left`
                                          : "Expiring soon"
                                    }
                                  </span>
                                  {notification.link && (
                                    <span className="flex items-center gap-1">
                                      <LinkIcon className="h-3 w-3" />
                                      Has link
                                    </span>
                                  )}
                                  <span>
                                    Created {new Date(notification.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {notification.status === "draft" && (
                                  <button
                                    onClick={() => handlePublish(notification._id)}
                                    className="rounded-[6px] px-2.5 py-1 text-[11px] font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                                    title="Publish"
                                  >
                                    Publish
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEdit(notification)}
                                  className="rounded-[6px] p-1.5 text-[#8a90a0] hover:bg-[#f7f8fb] hover:text-[#000000] transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(notification._id)}
                                  className="rounded-[6px] p-1.5 text-[#8a90a0] hover:bg-red-50 hover:text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index !== notifications.length - 1 && (
                          <div className="h-px bg-[#f0f1f3] my-2" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && setModalOpen(false)}>
        <DialogContent className="!max-w-[680px] !w-[92vw] p-7 overflow-hidden rounded-[18px] border border-[#e2e5ec] bg-white shadow-2xl">
          <div className="flex items-center justify-center gap-2.5 pb-1">
            <Bell className="h-6 w-6 text-blue-600 shrink-0" />
            <DialogTitle className="text-[22px] font-bold tracking-tight text-[#000000]">
              {editingId ? "Edit Notification" : "Create Notification"}
            </DialogTitle>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
                  placeholder="Notification title"
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                  Icon SVG Data URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="flex-1 rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
                    placeholder='data:image/svg+xml;base64,... or <svg...'
                    required
                  />
                  <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-[#e2e5ec] bg-[#f8fafc] shrink-0">
                    {formData.icon && (formData.icon.includes('<svg') || formData.icon.startsWith('data:image/svg+xml;base64,')) ? (
                      (() => {
                        let svgContent = formData.icon;
                        // Decode base64 if needed
                        if (formData.icon.startsWith('data:image/svg+xml;base64,')) {
                          try {
                            const base64Data = formData.icon.replace('data:image/svg+xml;base64,', '');
                            svgContent = atob(base64Data);
                          } catch (e) {
                            return <Bell className="h-5 w-5 text-[#4b5563]" />;
                          }
                        }
                        return (
                          <div 
                            className="h-5 w-5 text-[#4b5563]"
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                          />
                        );
                      })()
                    ) : (
                      <Bell className="h-5 w-5 text-[#4b5563]" />
                    )}
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-[#9ca3af]">
                  Paste base64 data URL or raw SVG
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all resize-none"
                rows={3}
                placeholder="Notification description..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                  Stop After *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={formData.stopAfter}
                    onChange={(e) => setFormData({ ...formData, stopAfter: e.target.value })}
                    className="w-24 rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
                    placeholder="1"
                    required
                  />
                  <select
                    value={formData.stopAfterUnit}
                    onChange={(e) => setFormData({ ...formData, stopAfterUnit: e.target.value as "Mins" | "Hours" | "Days" })}
                    className="flex-1 rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
                  >
                    <option value="Mins">Minutes</option>
                    <option value="Hours">Hours</option>
                    <option value="Days">Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                  Color *
                </label>
                <div className="flex gap-2 pt-1">
                  {NOTIFICATION_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`h-9 w-9 rounded-[8px] ${color.bg} transition-all ${
                        formData.color === color.value
                          ? "ring-2 ring-offset-2 ring-zinc-900 scale-110"
                          : "hover:scale-105 opacity-75 hover:opacity-100"
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#000000] mb-1.5">
                Link (Optional)
              </label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full rounded-[10px] border border-[#e2e5ec] bg-white px-3.5 py-2.5 text-[13px] text-[#000000] focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
                placeholder="/guides or https://example.com"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                className="flex-1 rounded-[10px] border border-[#e2e5ec] px-4 py-2.5 text-[13px] font-semibold text-[#4b5563] hover:bg-[#f8fafc] transition-colors"
              >
                {editingId ? "Save Changes" : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="flex-1 rounded-[10px] bg-black px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-zinc-900 transition-colors"
              >
                {editingId ? "Publish Now" : "Create & Publish"}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-[10px] border border-[#e2e5ec] px-4 py-2.5 text-[13px] font-semibold text-[#4b5563] hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </OrganizerLayout>
  );
}
