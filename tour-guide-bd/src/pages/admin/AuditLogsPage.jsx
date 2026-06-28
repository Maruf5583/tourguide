import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/admin.api'
import DataTable from '../../components/admin/DataTable'
import Pagination from '../../components/common/Pagination'
import { usePagination } from '../../hooks/usePagination'
import { formatTime } from '../../utils/formatters'

export default function AuditLogsPage() {
  const [entityName, setEntityName] = useState('')
  const [filter, setFilter] = useState('')
  const { pageNumber, pageSize, nextPage, prevPage, goToPage, reset } = usePagination(1, 20)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filter, pageNumber],
    queryFn: () => adminApi.getAuditLogs({ entityName: filter, pageNumber, pageSize }).then(r => r.data),
  })

  const columns = [
    { key: 'userName', label: 'User' },
    { key: 'action',   label: 'Action' },
    { key: 'entityName', label: 'Entity' },
    { key: 'entityId', label: 'Entity ID' },
    { key: 'timestamp', label: 'Time', render: (r) => formatTime(r.timestamp) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Audit logs</h1>
        <div className="flex gap-2">
          <input value={entityName} onChange={(e) => setEntityName(e.target.value)}
            placeholder="Filter by entity…" className="input text-sm h-9 w-48" />
          <button onClick={() => { setFilter(entityName); reset() }} className="btn-primary py-1.5 text-sm px-4">Filter</button>
        </div>
      </div>
      <div className="card">
        <DataTable columns={columns} data={data?.items} loading={isLoading} emptyText="No audit logs found" />
      </div>
      <Pagination pageNumber={pageNumber} totalPages={data?.totalPages}
        hasPrev={data?.hasPreviousPage} hasNext={data?.hasNextPage}
        onPrev={prevPage} onNext={nextPage} onPage={goToPage} />
    </div>
  )
}