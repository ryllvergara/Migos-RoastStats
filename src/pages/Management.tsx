import { useState, useEffect } from 'react';
import { Plus, Users, Store, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { RegisterModal } from '@/components/RegisterModal';
import logoImage from '@/assets/logoImage.png';
import { AppConfig } from '../patterns/index';
import { BranchCard } from '../components/management/BranchCard';
import { StaffCard } from '../components/management/StaffCard';
import { BranchDialog } from '../components/management/BranchDialog';
import { StaffDialog } from '../components/management/StaffDialog';
import { DeleteAlertDialog } from '../components/management/DeleteAlertDialog';

interface BranchData {
  id: string;
  branch_name: string;
  branch_address: string;
  created_at?: string;
}

interface StaffData {
  id: string;
  user_name: string;
  user_pin: string;
  user_role: string;
}

export function Management() {
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [loading, setLoading] = useState(true);
  const [managementTab, setManagementTab] = useState<'branches' | 'staff'>('branches');
  const config = AppConfig.getInstance();

  // Dialog & Form States
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchData | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'branch' | 'staff' } | null>(null);
  const [branchFormData, setBranchFormData] = useState({ name: '', address: '' });
  const [staffFormData, setStaffFormData] = useState({ name: '', pin: '', role: 'employee' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = managementTab === 'branches' ? 'branches' : 'users';
      const res = await fetch(`${config.baseUrl}/management/${endpoint}`);
      const data = await res.json();
      if (managementTab === 'branches') setBranches(data || []);
      else setStaff(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [managementTab]);

  const handleSaveBranch = async () => {
    const method = editingBranch ? 'PATCH' : 'POST';
    const url = editingBranch
      ? `${config.baseUrl}/management/branches/${editingBranch.id}`
      : `${config.baseUrl}/management/branches`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_name: branchFormData.name,
          branch_address: branchFormData.address,
        }),
      });
      if (res.ok) {
        fetchData();
        setIsBranchDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStaff = async () => {
    const method = editingStaff ? 'PATCH' : 'POST';
    const url = editingStaff
      ? `${config.baseUrl}/management/users/${editingStaff.id}`
      : `${config.baseUrl}/management/users`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: staffFormData.name,
          user_pin: staffFormData.pin,
          user_role: staffFormData.role,
        }),
      });
      if (res.ok) {
        fetchData();
        setIsStaffDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const endpoint = deleteTarget.type === 'branch' ? 'branches' : 'users';
    try {
      const res = await fetch(
        `${config.baseUrl}/management/${endpoint}/delete/${deleteTarget.id}` ,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (res.ok) {
        fetchData();
        setIsDeleteDialogOpen(false);
      } else {
        const errorData = await res.json();
        alert(`Delete failed: ${errorData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openBranchEdit = (b?: BranchData) => {
    if (b) {
      setEditingBranch(b);
      setBranchFormData({ name: b.branch_name, address: b.branch_address });
    } else {
      setEditingBranch(null);
      setBranchFormData({ name: '', address: '' });
    }
    setIsBranchDialogOpen(true);
  };

  const openStaffEdit = (s?: StaffData) => {
    if (s) {
      setEditingStaff(s);
      setStaffFormData({ name: s.user_name, pin: '', role: s.user_role });
    } else {
      setEditingStaff(null);
      setStaffFormData({ name: '', pin: '', role: 'employee' });
    }
    setIsStaffDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logoImage} alt="Migo's Lechon" className="h-16 w-16 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold text-[#212121]">Management</h1>
            <p className="text-gray-600 font-medium">
              Manage branch and staff information
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <Button
          variant={managementTab === 'branches' ? 'default' : 'outline'}
          onClick={() => setManagementTab('branches')}
          className={managementTab === 'branches' ? 'bg-[#D32F2F]' : ''}
        >
          <Store className="mr-2 h-4 w-4" /> Branches
        </Button>
        <Button
          variant={managementTab === 'staff' ? 'default' : 'outline'}
          onClick={() => setManagementTab('staff')}
          className={managementTab === 'staff' ? 'bg-[#D32F2F]' : ''}
        >
          <Users className="mr-2 h-4 w-4" /> Staff
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-gray-300" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {managementTab === 'branches' ? (
            <>
              {branches.map((b) => (
                <BranchCard
                  key={b.id}
                  branch={b}
                  onEdit={openBranchEdit}
                  onDelete={(id) => {
                    setDeleteTarget({ id, type: 'branch' });
                    setIsDeleteDialogOpen(true);
                  }}
                />
              ))}
              <Button
                variant="dashed"
                className="h-full border-2 border-dashed"
                onClick={() => openBranchEdit()}
              >
                <Plus className="mr-2" /> Add Branch
              </Button>
            </>
          ) : (
            <>
              {staff.map((s) => (
                <StaffCard
                  key={s.id}
                  staff={s}
                  onEdit={openStaffEdit}
                  onDelete={(id) => {
                    setDeleteTarget({ id, type: 'staff' });
                    setIsDeleteDialogOpen(true);
                  }}
                />
              ))}
              <Button
                variant="dashed"
                className="h-full border-2 border-dashed"
                onClick={() => setIsRegisterModalOpen(true)}
              >
                <Plus className="mr-2" /> Register Staff
              </Button>
            </>
          )}
        </div>
      )}

      <BranchDialog
        open={isBranchDialogOpen}
        onOpenChange={setIsBranchDialogOpen}
        isEditing={!!editingBranch}
        formData={branchFormData}
        onFormChange={setBranchFormData}
        onSave={handleSaveBranch}
      />

      <StaffDialog
        open={isStaffDialogOpen}
        onOpenChange={setIsStaffDialogOpen}
        isEditing={!!editingStaff}
        formData={staffFormData}
        onFormChange={setStaffFormData}
        onSave={handleSaveStaff}
      />

      <DeleteAlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}