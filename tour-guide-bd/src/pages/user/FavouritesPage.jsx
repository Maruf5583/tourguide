import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../../api/users.api'
import PlaceCard from '../../components/places/PlaceCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { Heart } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FavouritesPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['favourites'],
    queryFn: () => usersApi.getFavourites().then(r => r.data),
  })

  const removeMutation = useMutation({
    mutationFn: (placeId) => usersApi.removeFavourite(placeId),
    onSuccess: () => { toast.success('Removed from favourites'); qc.invalidateQueries(['favourites']) },
  })

  if (isLoading) return <LoadingSpinner center />

  const allPlaces = data?.flatMap(d => d.places || []) || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">My favourites</h1>
      {!allPlaces.length ? (
        <div className="text-center py-16 text-gray-400">
          <Heart size={32} className="mx-auto mb-2 opacity-40" />
          <p>No favourites yet. Explore places and save them!</p>
        </div>
      ) : (
        data?.map((group) => (
          <div key={group.districtId} className="mb-8">
            <h2 className="font-semibold text-gray-700 mb-3">{group.districtName}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {group.places?.map((fav) => (
                <div key={fav.favouriteId} className="relative">
                  <PlaceCard place={fav.place} />
                  <button onClick={() => removeMutation.mutate(fav.place.id)}
                    className="absolute top-2 left-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors">
                    <Heart size={14} className="fill-red-400 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}