import { MapPin, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface BranchData {
  id: string;
  branch_name: string;
  branch_address: string;
  created_at?: string;
}

interface BranchCardProps {
  branch: BranchData;
  onEdit: (branch: BranchData) => void;
  onDelete: (id: string) => void;
}

export function BranchCard({ branch, onEdit, onDelete }: BranchCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="font-bold text-lg">{branch.branch_name}</h3>
      <div className="flex items-center text-gray-500 text-sm mb-4">
        <MapPin className="h-3 w-3 mr-1" /> {branch.branch_address}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(branch)}>
          <Edit2 className="h-3 w-3 mr-1" /> Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600"
          onClick={() => onDelete(branch.id)}
        >
          <Trash2 className="h-3 w-3 mr-1" /> Remove
        </Button>
      </div>
    </div>
  );
}