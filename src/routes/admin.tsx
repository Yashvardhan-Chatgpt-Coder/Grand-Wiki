import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OrganizerLayout } from "@/components/dashboard/OrganizerLayout";
import { SoftwareHeader } from "@/components/dashboard/SoftwareHeader";
import { adminApi, supportApi, ApiSupportRequest, ApiUser, clearStoredUser, getStoredUser } from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AppSelect } from "@/components/dashboard/AppSelect";
import { ThemedConfirmDialog } from "@/components/ui/dialog";
import { queue } from "@/components/ui/Toast";
import {
  Users,
  Search,
  ShieldCheck,
  Heart,
  Trash2,
  Edit2,
  Plus,
  X,
  Check,
  XCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin Panel | Grand Wiki" }],
  }),
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  const { user, loading } = useCurrentUser();
  const searchParams = useSearch({ strict: false }) as { tab?: string };
  const activeTab = searchParams.tab || "users";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-md text-center">
          <h1 className="text-8xl font-bold text-[#000000] tracking-tight">404</h1>
          <h2 className="mt-4 text-[22px] font-semibold text-[#000000]">Page not found</h2>
          <p className="mt-2 text-[15px] text-[#9aa1b0]">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex h-[40px] items-center justify-center rounded-[8px] bg-[#000000] px-6 text-[14px] font-medium text-white transition-all hover:bg-[#333]"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getHeaderTitle = () => {
    if (activeTab === "philanthropists") return "Admin: Philanthropists";
    if (activeTab === "approvals") return "Admin: Account Approvals";
    if (activeTab === "support") return "Admin: Contact Submissions";
    return "Admin: User Management";
  };

  const getHeadingInfo = () => {
    if (activeTab === "philanthropists") {
      return {
        title: "Philanthropists",
        description: "Manage supporters list, add new donation records, and edit contributions.",
      };
    }
    if (activeTab === "approvals") {
      return {
        title: "Pending Approvals",
        description: "Review identity proof screenshots and approve or reject user accounts.",
      };
    }
    if (activeTab === "support") {
      return {
        title: "Contact Submissions",
        description: "Review support requests sent from the sidebar contact form.",
      };
    }
    return {
      title: "All Users",
      description: "Overview of registered users, in-game IDs, badge numbers, and account details.",
    };
  };

  const heading = getHeadingInfo();

  return (
    <OrganizerLayout header={<SoftwareHeader title={getHeaderTitle()} />}>
      <div className="flex min-w-0 flex-1 flex-col min-h-0 bg-[#f7f8fb] text-[#000000]">
        <header className="shrink-0 border-b border-[#e7e9f0] bg-white px-8 py-6">
          <h1 className="text-[28px] font-bold text-[#000000] tracking-tight">{heading.title}</h1>
          <p className="text-[13px] text-[#666666] mt-1">{heading.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "Users", tab: "users" },
              { label: "Approvals", tab: "approvals" },
              { label: "Philanthropists", tab: "philanthropists" },
              { label: "Contact submissions", tab: "support" },
            ].map((item) => (
              <Link
                key={item.tab}
                to="/admin"
                search={{ tab: item.tab }}
                className={cn(
                  "inline-flex h-8 items-center rounded-[999px] px-3 text-[12px] font-semibold transition-colors",
                  activeTab === item.tab
                    ? "bg-[#000000] text-white"
                    : "border border-[#e2e5ec] bg-white text-[#666666] hover:bg-[#f7f8fb] hover:text-[#000000]",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {activeTab === "users" && <UsersTab />}
          {activeTab === "philanthropists" && <PhilanthropistsTab />}
          {activeTab === "approvals" && <ApprovalsTab />}
          {activeTab === "support" && <SupportSubmissionsTab />}
        </main>
      </div>
    </OrganizerLayout>
  );
}

// ==========================================
// 1. USERS TAB
// ==========================================
function UsersTab() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);

  const fetchUsers = () => {
    adminApi
      .getUsers()
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.server || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.inGameId || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await adminApi.deleteUser(userToDelete._id || userToDelete.email);
      const currentLoggedIn = getStoredUser();
      if (
        currentLoggedIn &&
        (currentLoggedIn._id === userToDelete._id ||
          currentLoggedIn.email?.toLowerCase() === userToDelete.email?.toLowerCase())
      ) {
        clearStoredUser();
      }
      queue.add(
        {
          title: "User Account Deleted",
          description: `Successfully deleted account for ${userToDelete.email}.`,
          variant: "success",
        },
        { timeout: 3000 }
      );
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      queue.add(
        {
          title: "Deletion Failed",
          description: "Failed to delete user account.",
          variant: "error",
        },
        { timeout: 3000 }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a90a0]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] text-[#000000] outline-none focus:border-[#000000]"
          />
        </div>
        <div className="text-[13px] font-medium text-[#666666]">
          Total Users: <span className="font-bold text-[#000000]">{users.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white">
        <table className="w-full text-left table-fixed border-collapse">
          <thead>
            <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec]">
              <th className="w-[22%] px-5 py-3">User</th>
              <th className="w-[23%] px-5 py-3">Email ID</th>
              <th className="w-[15%] px-5 py-3">Server</th>
              <th className="w-[13%] px-5 py-3">In-Game ID</th>
              <th className="w-[10%] px-5 py-3">Badge #</th>
              <th className="w-[10%] px-5 py-3">Status</th>
              <th className="w-[7%] px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f1f3]">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[13px] text-[#666666]">
                  Loading users list...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[13px] text-[#666666]">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  className="cursor-pointer transition-colors hover:bg-[#f9fbfc]"
                >
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-[#000000]">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover shrink-0 border border-[#e2e5ec]"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[#f0f1f3] text-[#000000] font-bold flex items-center justify-center text-[12px] shrink-0 border border-[#e2e5ec]">
                          {(u.name?.[0] || "U").toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#666666] truncate">{u.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#000000]">{u.server || "N/A"}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#000000] font-mono">{u.inGameId || "N/A"}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#000000] font-mono">{u.badgeNumber || "N/A"}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold",
                        u.approvalStatus === "approved" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        u.approvalStatus === "rejected" && "bg-rose-50 text-rose-700 border border-rose-200",
                        (!u.approvalStatus || u.approvalStatus === "pending") &&
                          "bg-amber-50 text-amber-700 border border-amber-200"
                      )}
                    >
                      {(u.approvalStatus || "approved").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserToDelete(u);
                      }}
                      className="rounded-[6px] p-1.5 text-[#8a90a0] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete User Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

      {userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirmDelete={handleDeleteUser}
        />
      )}
    </div>
  );
}

// DELETE USER CONFIRMATION MODAL WITH EXACT EMAIL TYPE MATCH
function DeleteUserModal({
  user,
  onClose,
  onConfirmDelete,
}: {
  user: ApiUser;
  onClose: () => void;
  onConfirmDelete: () => void;
}) {
  const [inputEmail, setInputEmail] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const canDelete = inputEmail.trim().toLowerCase() === user.email.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-[12px] border border-[#e2e5ec] bg-white p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-[6px] p-1 text-[#8a90a0] hover:bg-[#f4f5f7] hover:text-[#000000] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#f0f1f3] pb-4">
          <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#000000]">Delete User Account</h3>
            <p className="text-[12px] text-[#666666]">This action is permanent and cannot be undone.</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[13px] text-[#4b5563]">
            To confirm deletion, please type the exact Email ID below:
          </p>

          <div className="rounded-[6px] border border-[#e2e5ec] bg-[#f9fbfc] p-2.5 text-center font-mono text-[13px] font-bold text-[#000000] select-all">
            {user.email}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8a90a0] mb-1">
              Confirm Email ID
            </label>
            <input
              type="text"
              autoFocus
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="Type exact email here..."
              className="h-10 w-full rounded-[6px] border border-[#e2e5ec] px-3 font-mono text-[13px] outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f1f3]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-[6px] border border-[#e2e5ec] bg-white text-[13px] font-medium text-[#666666] hover:bg-[#f7f8fb] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canDelete}
            onClick={onConfirmDelete}
            className={cn(
              "h-9 px-5 rounded-[6px] text-white text-[13px] font-semibold transition-colors flex items-center gap-1.5",
              canDelete
                ? "bg-rose-600 hover:bg-rose-700 cursor-pointer"
                : "bg-rose-300 cursor-not-allowed opacity-60"
            )}
          >
            <Trash2 className="h-4 w-4" /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

// USER DETAILS MODAL
function UserDetailModal({ user, onClose }: { user: ApiUser; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-[12px] border border-[#e2e5ec] bg-white p-6 shadow-2xl relative space-y-6 animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-[6px] p-1 text-[#8a90a0] hover:bg-[#f4f5f7] hover:text-[#000000] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4 border-b border-[#f0f1f3] pb-5">
          {user.avatar ? (
            <img src={user.avatar} className="h-16 w-16 rounded-full object-cover border border-[#e2e5ec]" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-[#f0f1f3] text-[#000000] font-bold text-[22px] flex items-center justify-center border border-[#e2e5ec]">
              {(user.name?.[0] || "U").toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-[20px] font-bold text-[#000000]">{user.name}</h2>
            <p className="text-[13px] text-[#666666]">{user.email}</p>
            <div className="mt-1">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase",
                  user.approvalStatus === "approved" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                  user.approvalStatus === "rejected" && "bg-rose-50 text-rose-700 border border-rose-200",
                  (!user.approvalStatus || user.approvalStatus === "pending") &&
                    "bg-amber-50 text-amber-700 border border-amber-200"
                )}
              >
                {user.approvalStatus || "approved"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-[13px]">
          <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">User ID</span>
            <span className="font-mono text-[#000000] text-[12px] break-all">{user._id}</span>
          </div>

          <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">Server</span>
            <span className="font-semibold text-[#000000]">{user.server || "N/A"}</span>
          </div>

          <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">In-Game ID</span>
            <span className="font-semibold text-[#000000]">{user.inGameId || "N/A"}</span>
          </div>

          <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">Badge Number</span>
            <span className="font-semibold text-[#000000]">{user.badgeNumber || "N/A"}</span>
          </div>

          <div className="col-span-2 rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">Organization</span>
            <div className="mt-1 flex items-center gap-2">
              {user.organization?.logo && (
                <img src={user.organization.logo} alt="" className="h-5 w-5 object-contain" />
              )}
              <span className="font-semibold text-[#000000]">
                {user.organization?.name || "No Organization Specified"}
              </span>
            </div>
          </div>

          <div className="col-span-2 rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">Account Created</span>
            <span className="font-medium text-[#000000]">
              {user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}
            </span>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-[6px] bg-[#000000] text-white text-[13px] font-semibold hover:bg-[#333333] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
const SERVER_OPTIONS = [
  { label: "ENGLISH #1", value: "ENGLISH #1", iconUrl: "/Brand/UK Flag.png" },
  { label: "ENGLISH #2", value: "ENGLISH #2", iconUrl: "/Brand/UK Flag.png" },
  { label: "ENGLISH #3", value: "ENGLISH #3", iconUrl: "/Brand/UK Flag.png" },
];

function PhilanthropistsTab() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "addEntry">("add");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [supporterToDelete, setSupporterToDelete] = useState<any | null>(null);
  const [viewingSupporter, setViewingSupporter] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    server: "ENGLISH #1",
  });

  const fetchDonations = () => {
    adminApi
      .getDonations()
      .then((data) => {
        setDonations(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  const totalRaised = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const groupedSupporters = donations.reduce((acc, curr) => {
    const key = (curr.name || "Anonymous").trim();
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  const supportersList = Object.entries(groupedSupporters)
    .map(([name, entries]) => {
      const entriesArr = entries as any[];
      const totalDonation = entriesArr.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const sortedEntries = [...entriesArr].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      const latestEntry = sortedEntries[0];

      return {
        name,
        totalDonation,
        lastDonationDate: latestEntry?.createdAt ? new Date(latestEntry.createdAt).toLocaleDateString() : "N/A",
        entries: sortedEntries,
        latestEntry,
      };
    })
    .sort((a, b) => b.totalDonation - a.totalDonation);

  const currentViewingSupporter = viewingSupporter
    ? supportersList.find((s) => s.name === viewingSupporter.name) || null
    : null;

  const handleOpenAddModal = () => {
    setModalMode("add");
    setTargetId(null);
    setForm({ name: "", amount: "", server: "ENGLISH #1" });
    setModalOpen(true);
  };

  const handleOpenAddEntryModal = (supporterName: string) => {
    setModalMode("addEntry");
    setTargetId(null);
    setForm({ name: supporterName, amount: "", server: "ENGLISH #1" });
    setModalOpen(true);
  };

  const handleOpenEditModal = (supporter: any) => {
    const latest = supporter.latestEntry;
    setModalMode("edit");
    setTargetId(latest._id || latest.id);
    setForm({
      name: supporter.name,
      amount: String(latest.amount || ""),
      server: latest.server || "ENGLISH #1",
    });
    setModalOpen(true);
  };

  const handleOpenEditSingleEntry = (entry: any) => {
    setModalMode("edit");
    setTargetId(entry._id || entry.id);
    setForm({
      name: entry.name,
      amount: String(entry.amount || ""),
      server: entry.server || "ENGLISH #1",
    });
    setModalOpen(true);
  };

  const handleDeleteSupporter = (supporter: any) => {
    setSupporterToDelete(supporter);
  };

  const confirmDeleteSupporter = async () => {
    if (!supporterToDelete) return;
    try {
      for (const entry of supporterToDelete.entries) {
        const entryId = entry._id || entry.id;
        if (entryId) {
          await adminApi.deleteDonation(entryId);
        }
      }
      setSupporterToDelete(null);
      if (viewingSupporter && viewingSupporter.name === supporterToDelete.name) {
        setViewingSupporter(null);
      }
      fetchDonations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSingleEntry = async (entryId: string) => {
    try {
      await adminApi.deleteDonation(entryId);
      fetchDonations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;

    try {
      if (modalMode === "add" || modalMode === "addEntry") {
        await adminApi.createDonation({
          name: form.name,
          amount: Number(form.amount),
          server: form.server,
        });
      } else if (modalMode === "edit" && targetId) {
        await adminApi.updateDonation(targetId, {
          name: form.name,
          amount: Number(form.amount),
          server: form.server,
        });
      }
      setModalOpen(false);
      fetchDonations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[13px] font-medium text-[#666666]">
          Total Contributions Raised:{" "}
          <span className="font-bold text-emerald-600">${totalRaised.toLocaleString()}</span>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="h-9 px-4 rounded-[6px] bg-[#000000] text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-[#333333] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Philanthropist
        </button>
      </div>

      <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white">
        <table className="w-full text-left table-fixed border-collapse">
          <thead>
            <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec]">
              <th className="w-[10%] px-5 py-3">S.NO.</th>
              <th className="w-[30%] px-5 py-3">Philanthropist Name</th>
              <th className="w-[25%] px-5 py-3">Total Contribution</th>
              <th className="w-[20%] px-5 py-3">Last Donation Date</th>
              <th className="w-[15%] px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f1f3]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[#666666]">
                  Loading supporters list...
                </td>
              </tr>
            ) : supportersList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[#666666]">
                  No contributions recorded yet.
                </td>
              </tr>
            ) : (
              supportersList.map((supporter, idx) => (
                <tr
                  key={supporter.name}
                  onClick={() => setViewingSupporter(supporter)}
                  className="cursor-pointer transition-colors hover:bg-[#f9fbfc]"
                >
                  <td className="px-5 py-3.5 text-[13px] font-mono text-[#8a90a0]">{idx + 1}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-[#000000]">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#f0f1f3] text-[#000000] font-bold flex items-center justify-center text-[12px] shrink-0 border border-[#e2e5ec]">
                        {(supporter.name?.[0] || "S").toUpperCase()}
                      </div>
                      <span className="truncate">{supporter.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-bold text-emerald-600">
                    ${supporter.totalDonation.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#666666]">{supporter.lastDonationDate}</td>
                  <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAddEntryModal(supporter.name)}
                        className="rounded-[6px] p-1.5 text-[#8a90a0] hover:bg-[#f4f5f7] hover:text-[#000000] transition-colors cursor-pointer"
                        title="Add Another Donation Entry"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(supporter)}
                        className="rounded-[6px] p-1.5 text-[#8a90a0] hover:bg-[#f4f5f7] hover:text-[#000000] transition-colors cursor-pointer"
                        title="Edit Latest Entry"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSupporter(supporter)}
                        className="rounded-[6px] p-1.5 text-[#8a90a0] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete All Entries"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {currentViewingSupporter && (
        <SupporterEntriesModal
          supporter={currentViewingSupporter}
          onClose={() => setViewingSupporter(null)}
          onAddEntry={() => handleOpenAddEntryModal(currentViewingSupporter.name)}
          onEditEntry={handleOpenEditSingleEntry}
          onDeleteEntry={handleDeleteSingleEntry}
        />
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[12px] border border-[#e2e5ec] bg-white p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-[6px] p-1 text-[#8a90a0] hover:bg-[#f4f5f7] hover:text-[#000000] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-[#f0f1f3] pb-4">
              <h3 className="text-[18px] font-bold text-[#000000]">
                {modalMode === "add"
                  ? "Add New Philanthropist"
                  : modalMode === "addEntry"
                  ? `Add Donation for ${form.name}`
                  : "Edit Donation Record"}
              </h3>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#4b5563] mb-1">
                  Supporter Name
                </label>
                <input
                  required
                  type="text"
                  disabled={modalMode === "addEntry"}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Marcus Vale"
                  className="h-9 w-full rounded-[6px] border border-[#e2e5ec] px-3 text-[13px] outline-none focus:border-[#000000] disabled:bg-[#f4f5f7] disabled:text-[#666666]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#4b5563] mb-1">
                  Amount ($)
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 500000"
                  className="h-9 w-full rounded-[6px] border border-[#e2e5ec] px-3 text-[13px] outline-none focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#4b5563] mb-1">Server</label>
                <AppSelect
                  value={form.server}
                  onChange={(val) => setForm({ ...form, server: val })}
                  options={SERVER_OPTIONS}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f1f3]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-9 px-4 rounded-[6px] border border-[#e2e5ec] bg-white text-[13px] font-medium text-[#666666] hover:bg-[#f7f8fb] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-[6px] bg-[#000000] text-white text-[13px] font-semibold hover:bg-[#333333] transition-colors cursor-pointer"
                >
                  {modalMode === "edit" ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ThemedConfirmDialog
        open={Boolean(supporterToDelete)}
        onOpenChange={(open) => {
          if (!open) setSupporterToDelete(null);
        }}
        title="Delete Supporter"
        description={
          <span>
            Are you sure you want to delete all donation records for{" "}
            <strong>{supporterToDelete?.name}</strong>? This action cannot be undone.
          </span>
        }
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onConfirm={confirmDeleteSupporter}
      />
    </div>
  );
}

function SupporterEntriesModal({
  supporter,
  onClose,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}: {
  supporter: { name: string; totalDonation: number; entries: any[] };
  onClose: () => void;
  onAddEntry: () => void;
  onEditEntry: (entry: any) => void;
  onDeleteEntry: (entryId: string) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[12px] border border-[#e2e5ec] bg-white p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-[6px] p-1 text-[#8a90a0] hover:bg-[#f4f5f7] hover:text-[#000000] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-between border-b border-[#f0f1f3] pb-4 pr-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#f0f1f3] text-[#000000] font-bold flex items-center justify-center text-[18px] shrink-0 border border-[#e2e5ec]">
              {(supporter.name?.[0] || "S").toUpperCase()}
            </div>
            <div>
              <h3 className="text-[20px] font-bold text-[#000000]">{supporter.name}</h3>
              <p className="text-[12px] text-[#666666]">
                Total:{" "}
                <strong className="text-emerald-600">${supporter.totalDonation.toLocaleString()}</strong> (
                {supporter.entries.length} {supporter.entries.length === 1 ? "entry" : "entries"})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddEntry}
            className="h-8 px-3 rounded-[6px] bg-[#000000] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#333333] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add Entry
          </button>
        </div>

        <div className="overflow-y-auto flex-1 rounded-[8px] border border-[#e2e5ec] bg-white">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec]">
                <th className="px-4 py-2.5">S.NO.</th>
                <th className="px-4 py-2.5">DATE</th>
                <th className="px-4 py-2.5">AMOUNT</th>
                <th className="px-4 py-2.5">SERVER</th>
                <th className="px-4 py-2.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f1f3]">
              {supporter.entries.map((entry, idx) => (
                <tr key={entry._id || entry.id} className="hover:bg-[#f9fbfc] transition-colors">
                  <td className="px-4 py-3 font-mono text-[#666666]">{idx + 1}</td>
                  <td className="px-4 py-3 text-[#666666]">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600">
                    ${Number(entry.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[#000000]">{entry.server || "ENGLISH #1"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEditEntry(entry)}
                        className="rounded-[6px] p-1 text-[#8a90a0] hover:bg-[#f4f5f7] hover:text-[#000000] transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry._id || entry.id)}
                        className="rounded-[6px] p-1 text-[#8a90a0] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 text-right border-t border-[#f0f1f3]">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-[6px] border border-[#e2e5ec] bg-white text-[12px] font-medium text-[#666666] hover:bg-[#f7f8fb] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. APPROVALS TAB (TABULAR LIST UI)
// ==========================================
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "Just now";
  const now = new Date().getTime();
  const past = new Date(dateString).getTime();
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function ApprovalsTab() {
  const [pendingUsers, setPendingUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);

  const fetchPending = () => {
    setLoading(true);
    adminApi
      .getUsers()
      .then((data) => {
        setPendingUsers(data.filter((u) => u.approvalStatus === "pending"));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (user: ApiUser) => {
    try {
      await adminApi.updateApproval(user._id || user.email, "approved");
      queue.add(
        {
          title: "Account Approved",
          description: `Approval notification email sent to ${user.email} via Resend.`,
          variant: "success",
        },
        { timeout: 4000 }
      );
      console.log(
        `[Resend Email Sent] To: ${user.email} | Subject: Grand Wiki Account Approved | Message: Your account has been verified.`
      );
      setSelectedUser(null);
      fetchPending();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (user: ApiUser, reason: string) => {
    try {
      await adminApi.updateApproval(user._id || user.email, "rejected", reason);
      queue.add(
        {
          title: "Account Rejected",
          description: `Rejection notice email sent to ${user.email} via Resend. Reason: "${reason}"`,
          variant: "error",
        },
        { timeout: 5000 }
      );
      console.log(
        `[Resend Email Sent] To: ${user.email} | Subject: Grand Wiki Account Rejection Notice | Reason: ${reason}`
      );
      setSelectedUser(null);
      fetchPending();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[14px] font-semibold text-[#000000]">
          Pending Account Approvals: <span className="text-amber-600 font-bold">{pendingUsers.length}</span>
        </div>
        <button
          type="button"
          onClick={fetchPending}
          disabled={loading}
          className="h-9 px-4 rounded-[6px] border border-[#e2e5ec] bg-white text-[13px] font-semibold text-[#000000] hover:bg-[#f7f8fb] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg
            className={cn("h-4 w-4", loading && "animate-spin")}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white">
        <table className="w-full text-left table-fixed border-collapse">
          <thead>
            <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec]">
              <th className="w-[8%] px-5 py-3">S.No.</th>
              <th className="w-[22%] px-5 py-3">User Name</th>
              <th className="w-[25%] px-5 py-3">Email ID</th>
              <th className="w-[20%] px-5 py-3">Account Creation Date</th>
              <th className="w-[15%] px-5 py-3">Pending Since</th>
              <th className="w-[10%] px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f1f3]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-[#666666]">
                  Loading pending approvals list...
                </td>
              </tr>
            ) : pendingUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-[#666666]">
                  <UserCheck className="h-9 w-9 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-[#000000] text-[15px]">No Pending Approvals</p>
                  <p className="text-[12px] text-[#8a90a0]">All submitted account identity proofs have been reviewed.</p>
                </td>
              </tr>
            ) : (
              pendingUsers.map((u, idx) => (
                <tr
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  className="cursor-pointer transition-colors hover:bg-[#f9fbfc]"
                >
                  <td className="px-5 py-3.5 text-[13px] font-mono text-[#8a90a0]">{idx + 1}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-[#000000]">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover shrink-0 border border-[#e2e5ec]"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[#f0f1f3] text-[#000000] font-bold flex items-center justify-center text-[12px] shrink-0 border border-[#e2e5ec]">
                          {(u.name?.[0] || "U").toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#666666] truncate">{u.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#000000]">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </td>
                  <td className="px-5 py-3.5 text-[13px]">
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(u.createdAt)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(u);
                      }}
                      className="h-8 px-3 rounded-[6px] bg-[#000000] text-white text-[12px] font-semibold hover:bg-[#333333] transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <ApprovalReviewModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onApprove={() => handleApprove(selectedUser)}
          onReject={(reason) => handleReject(selectedUser, reason)}
        />
      )}
    </div>
  );
}

function SupportSubmissionsTab() {
  const [submissions, setSubmissions] = useState<ApiSupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ApiSupportRequest | null>(null);
  const [search, setSearch] = useState("");

  const fetchSubmissions = () => {
    supportApi
      .getAll()
      .then((data) => {
        setSubmissions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filtered = submissions.filter((submission) => {
    const q = search.toLowerCase().trim();
    return (
      (submission.name || "").toLowerCase().includes(q) ||
      (submission.email || "").toLowerCase().includes(q) ||
      (submission.subject || "").toLowerCase().includes(q) ||
      (submission.message || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a90a0]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search submissions..."
            className="h-9 w-full rounded-[6px] border border-[#e2e5ec] bg-white pl-9 pr-3 text-[13px] text-[#000000] outline-none focus:border-[#000000]"
          />
        </div>
        <div className="text-[13px] font-medium text-[#666666]">
          Total Submissions: <span className="font-bold text-[#000000]">{submissions.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[8px] border border-[#e2e5ec] bg-white">
        <table className="w-full text-left table-fixed border-collapse">
          <thead>
            <tr className="bg-[#f9fbfc] text-[11px] font-semibold uppercase tracking-wide text-[#8a93a3] border-b border-[#e2e5ec]">
              <th className="w-[7%] px-5 py-3">S.No.</th>
              <th className="w-[18%] px-5 py-3">Name</th>
              <th className="w-[23%] px-5 py-3">Email</th>
              <th className="w-[16%] px-5 py-3">Subject</th>
              <th className="w-[12%] px-5 py-3">Status</th>
              <th className="w-[16%] px-5 py-3">Submitted</th>
              <th className="w-[8%] px-5 py-3 text-right">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f1f3]">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[13px] text-[#666666]">
                  Loading contact submissions...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-[13px] text-[#666666]">
                  <p className="font-bold text-[#000000] text-[15px]">No submissions found</p>
                  <p className="text-[12px] text-[#8a90a0]">Support requests from the contact form will appear here.</p>
                </td>
              </tr>
            ) : (
              filtered.map((submission, idx) => (
                <tr
                  key={submission._id}
                  onClick={() => setSelectedSubmission(submission)}
                  className="cursor-pointer transition-colors hover:bg-[#f9fbfc]"
                >
                  <td className="px-5 py-3.5 text-[13px] font-mono text-[#8a90a0]">{idx + 1}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-[#000000] truncate">{submission.name}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#666666] truncate">{submission.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#000000]">{submission.subject}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold",
                        submission.status === "Resolved" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        submission.status === "In review" && "bg-blue-50 text-blue-700 border border-blue-200",
                        submission.status === "New" && "bg-amber-50 text-amber-700 border border-amber-200",
                      )}
                    >
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#666666]">
                    {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : "N/A"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubmission(submission);
                      }}
                      className="h-8 px-3 rounded-[6px] bg-[#000000] text-white text-[12px] font-semibold hover:bg-[#333333] transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedSubmission && (
        <SupportSubmissionModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}

function SupportSubmissionModal({
  submission,
  onClose,
}: {
  submission: ApiSupportRequest;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-[14px] border border-[#e2e5ec] bg-white p-7 shadow-2xl relative space-y-6 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-[6px] p-1.5 text-[#8a90a0] hover:bg-[#f4f5f7] hover:text-[#000000] transition-colors cursor-pointer"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="border-b border-[#f0f1f3] pb-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 border px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider",
                submission.status === "Resolved" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                submission.status === "In review" && "bg-blue-50 text-blue-700 border-blue-200",
                submission.status === "New" && "bg-amber-50 text-amber-800 border-amber-200",
              )}
            >
              {submission.status}
            </span>
          </div>
          <h2 className="text-[24px] font-bold text-[#000000] mt-2">{submission.subject}</h2>
          <p className="text-[13px] text-[#666666]">
            Submitted by {submission.name} on {submission.email}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-[13px]">
          <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">Submission ID</span>
            <span className="font-mono text-[#000000] text-[12px] break-all">{submission._id}</span>
          </div>
          <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">Created</span>
            <span className="font-semibold text-[#000000]">{submission.createdAt ? new Date(submission.createdAt).toLocaleString() : "N/A"}</span>
          </div>
          <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">Updated</span>
            <span className="font-semibold text-[#000000]">{submission.updatedAt ? new Date(submission.updatedAt).toLocaleString() : "N/A"}</span>
          </div>
          <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">Status</span>
            <span className="font-semibold text-[#000000]">{submission.status}</span>
          </div>
        </div>

        <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-4">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0] mb-2">Message</span>
          <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#000000]">{submission.message}</p>
        </div>

        <div className="rounded-[8px] border border-[#e2e5ec] bg-[#f9fbfc] p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8a90a0]">Linked User</span>
          <span className="font-semibold text-[#000000]">
            {typeof submission.userId === "object" && submission.userId
              ? `${submission.userId.name} (${submission.userId.email})`
              : "Not linked"}
          </span>
        </div>

        <div className="pt-2 text-right border-t border-[#f0f1f3]">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-[6px] border border-[#e2e5ec] bg-white text-[12px] font-medium text-[#666666] hover:bg-[#f7f8fb] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// IMMENSE / LARGE INSPECTION POPUP MODAL
function ApprovalReviewModal({
  user,
  onClose,
  onApprove,
  onReject,
}: {
  user: ApiUser;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-5xl rounded-[14px] border border-[#e2e5ec] bg-white p-7 shadow-2xl relative space-y-6 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-[6px] p-1.5 text-[#8a90a0] hover:bg-[#f4f5f7] hover:text-[#000000] transition-colors cursor-pointer"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="border-b border-[#f0f1f3] pb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-[4px] uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" /> Pending Verification
            </span>
          </div>
          <h2 className="text-[24px] font-bold text-[#000000] mt-1">
            Inspect Identity Proof & User Details
          </h2>
          <p className="text-[13px] text-[#666666]">
            Review account details and in-game proof screenshot before making an approval decision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          <div className="lg:col-span-5 space-y-4">
            <h4 className="font-bold text-[13px] text-[#000000] uppercase tracking-wider text-[#8a90a0]">
              User Account & Identity Details
            </h4>

            <div className="space-y-3 bg-[#f9fbfc] p-5 rounded-[10px] border border-[#e2e5ec]">
              <div className="flex items-center gap-3 border-b border-[#e2e5ec] pb-3">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover border border-[#e2e5ec]"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-[#f0f1f3] text-[#000000] font-bold text-[16px] flex items-center justify-center border border-[#e2e5ec]">
                    {(user.name?.[0] || "U").toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-[16px] font-bold text-[#000000]">{user.name}</h3>
                  <p className="text-[12px] text-[#666666]">{user.email}</p>
                </div>
              </div>

              <div>
                <span className="text-[#8a90a0] block text-[10px] font-bold uppercase tracking-wider">
                  Account Creation Date
                </span>
                <span className="font-semibold text-[#000000] text-[13px]">
                  {user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}
                </span>
              </div>

              <div>
                <span className="text-[#8a90a0] block text-[10px] font-bold uppercase tracking-wider">
                  Server & In-Game ID
                </span>
                <span className="font-semibold text-[#000000] text-[13px]">
                  {user.server || "ENGLISH #1"} — ID: <strong className="font-mono">{user.inGameId || "N/A"}</strong>
                </span>
              </div>

              <div>
                <span className="text-[#8a90a0] block text-[10px] font-bold uppercase tracking-wider">
                  Organization
                </span>
                <div className="mt-1 flex items-center gap-2">
                  {user.organization?.logo && (
                    <img src={user.organization.logo} alt="" className="h-5 w-5 object-contain" />
                  )}
                  <span className="font-semibold text-[#000000] text-[13px]">
                    {user.organization?.name || "No Organization Specified"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#8a90a0] block text-[10px] font-bold uppercase tracking-wider">
                  Badge Number
                </span>
                <span className="font-mono font-semibold text-[#000000] text-[13px]">
                  {user.badgeNumber || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[13px] text-[#000000] uppercase tracking-wider text-[#8a90a0]">
                Submitted Identity Proof Screenshot
              </h4>
              {user.inGameScreenshotUrl && (
                <a
                  href={user.inGameScreenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#000000] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Full Resolution
                </a>
              )}
            </div>

            {user.inGameScreenshotUrl ? (
              <div className="rounded-[10px] border border-[#e2e5ec] overflow-hidden bg-black p-2 flex flex-col items-center justify-center">
                <img
                  src={user.inGameScreenshotUrl}
                  alt="Identity Proof Screenshot"
                  className="w-full h-auto object-contain max-h-[380px] rounded-[6px]"
                />
              </div>
            ) : (
              <div className="h-[300px] rounded-[10px] border border-dashed border-[#e2e5ec] bg-[#f9fbfc] flex flex-col items-center justify-center text-[13px] text-[#8a90a0] gap-2">
                <ShieldAlert className="h-8 w-8 text-[#8a90a0]" />
                <span>No identity proof screenshot attached.</span>
              </div>
            )}
          </div>
        </div>

        {!rejecting ? (
          <div className="flex justify-end gap-3 border-t border-[#f0f1f3] pt-5">
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className="h-10 px-6 rounded-[8px] border border-rose-200 bg-rose-50 text-rose-700 text-[13px] font-semibold hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <XCircle className="h-4 w-4" /> Reject Request
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="h-10 px-7 rounded-[8px] bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Check className="h-4 w-4" /> Approve Account
            </button>
          </div>
        ) : (
          <div className="space-y-3 border-t border-[#f0f1f3] pt-5 bg-rose-50/50 p-4 rounded-[10px] border border-rose-100">
            <label className="block text-[13px] font-bold text-rose-900">
              Reason for Rejection (Will be sent in rejection email via Resend)
            </label>
            <input
              type="text"
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. In-game screenshot is blurred or ID does not match server records."
              className="h-10 w-full rounded-[6px] border border-rose-300 bg-white px-3 text-[13px] outline-none focus:border-rose-600"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejecting(false)}
                className="h-9 px-4 rounded-[6px] border border-[#e2e5ec] bg-[#ffffff] text-[13px] font-medium text-[#666666] hover:bg-[#f7f8fb] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reason.trim()}
                onClick={() => onReject(reason)}
                className={cn(
                  "h-9 px-5 rounded-[6px] text-white text-[13px] font-semibold transition-colors cursor-pointer",
                  reason.trim()
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-rose-300 cursor-not-allowed opacity-60"
                )}
              >
                Confirm & Send Rejection Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
