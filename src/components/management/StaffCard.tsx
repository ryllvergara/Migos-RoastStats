import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface StaffData {
  id: string;
  user_name: string;
  user_pin: string;
  user_role: string;
}

interface StaffCardProps {
  staff: StaffData;
  onEdit: (staff: StaffData) => void;
  onDelete: (id: string) => void;
}

export function StaffCard({ staff, onEdit, onDelete }: StaffCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="font-bold text-lg">{staff.user_name}</h3>
      <p className="text-sm text-gray-400 mb-4">{staff.user_role} • PIN: ••••</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(staff)}>
          <Edit2 className="h-3 w-3 mr-1" /> Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600"
          onClick={() => onDelete(staff.id)}
        >
          <Trash2 className="h-3 w-3 mr-1" /> Remove
        </Button>
      </div>
    </div>
  );
}