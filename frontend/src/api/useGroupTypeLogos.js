import { useEffect, useState } from 'react'
import client from './client'

// { MOTHERS_UNION: 'https://…/logo.png', … } - the diocese-wide emblem for each
// kind of group. Empty until loaded, and empty for types without a logo.
export function useGroupTypeLogos() {
  const [logos, setLogos] = useState({})
  useEffect(() => {
    client.get('/content/group-type-logos/').then(r => {
      const map = {}
      r.data.forEach(l => { map[l.group_type] = l.logo })
      setLogos(map)
    }).catch(() => {})
  }, [])
  return logos
}
