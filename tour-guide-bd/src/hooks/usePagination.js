import { useState } from 'react'

export const usePagination = (initialPage = 1, initialSize = 10) => {
  const [pageNumber, setPageNumber] = useState(initialPage)
  const [pageSize]  = useState(initialSize)

  const nextPage = () => setPageNumber((p) => p + 1)
  const prevPage = () => setPageNumber((p) => Math.max(1, p - 1))
  const goToPage = (p) => setPageNumber(p)
  const reset    = () => setPageNumber(1)

  return { pageNumber, pageSize, nextPage, prevPage, goToPage, reset }
}