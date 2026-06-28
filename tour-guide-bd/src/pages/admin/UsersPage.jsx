import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/admin.api'
import DataTable from '../../components/admin/DataTable'
import Pagination from '../../components/common/Pagination'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { usePagination } from '../../hooks/usePagination'
import { formatDate } from '../../utils/formatters'
import { Search, ShieldCheck, Ban } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleModal, setRoleModal] = useState(null)
  const [role, setRole] = useState('')
  const { pageNumber, pageSize, nextPage, prevPage, goToPage, reset } = usePagination(1, 20)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, pageNumber],
    queryFn: () => adminApi.getUsers({ search, pageNumber, pageSize }).then(r => r.data),
  })

  const banMutation = useMutation({
    mutationFn: ({ userId, isBanned }) => adminApi.banUser(userId, { userId, isBanned }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['admin-users']) },
    onError: () => toast.error('Failed'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role, assign }) => adminApi.assignRole(userId, { userId, role, assign }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries(['admin-users']); setRoleModal(null) },
    onError: () => toast.error('Failed'),
  })

  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'roles', label: 'Roles', render: (r) => (
      <div className="flex gap-1">{r.roles?.map(role => <Badge key={role} variant="blue">{role}</Badge>)}</div>
    )},
    { key: 'status', label: 'Status', render: (r) => (
      <Badge variant={r.isBanned ? 'red' : 'green'}>{r.isBanned ? 'Banned' : 'Active'}</Badge>
    )},
    { key: 'createdAt', label: 'Joined', render: (r) => formatDate(r.createdAt) },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex gap-2">
        <button onClick={() => banMutation.mutate({ userId: r.id, isBanned: !r.isBanned })}
          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${r.isBanned ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-red-200 text-red-700 hover:bg-red-50'}`}>
          {r.isBanned ? 'Unban' : 'Ban'}
        </button>
        <button onClick={() => setRoleModal(r)}
          className="text-xs px-2 py-1 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors">
          Role
        </button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); reset() }} className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search users…" className="input pl-8 text-sm h-9 w-56" />
          </div>
          <button type="submit" className="btn-primary py-1.5 text-sm px-4">Search</button>
        </form>
      </div>
      <div className="card">
        <DataTable columns={columns} data={data?.items} loading={isLoading} />
      </div>
      <Pagination pageNumber={pageNumber} totalPages={data?.totalPages}
        hasPrev={data?.hasPreviousPage} hasNext={data?.hasNextPage}
        onPrev={prevPage} onNext={nextPage} onPage={goToPage} />

      <Modal isOpen={!!roleModal} onClose={() => setRoleModal(null)} title="Assign role">
        <div className="space-y-4">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input">
            <option value="">Select role</option>
            <option value="Admin">Admin</option>
            <option value="Moderator">Moderator</option>
            <option value="User">User</option>
          </select>
          <div className="flex gap-3">
            <button onClick={() => roleMutation.mutate({ userId: roleModal?.id, role, assign: true })}
              disabled={!role} className="btn-primary flex-1">Assign</button>
            <button onClick={() => roleMutation.mutate({ userId: roleModal?.id, role, assign: false })}
              disabled={!role} className="btn-danger flex-1">Remove</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}