import { createContext, useContext, useEffect, useState } from 'react'
import client from '../api/client'

// Fetches the diocese record once (currently just Byumba - the first
// diocese in the system) so components like the Navbar and Home hero can
// show its logo/name without each doing their own API call. When a second
// diocese is added later, this can be extended to pick the right one based
// on the domain/subdomain being visited.
const DioceseContext = createContext(null)

export function DioceseProvider({ children }) {
  const [diocese, setDiocese] = useState(null)

  useEffect(() => {
    client.get('/dioceses/dioceses/').then(r => {
      if (r.data.length) setDiocese(r.data[0])
    }).catch(() => {})
  }, [])

  return <DioceseContext.Provider value={diocese}>{children}</DioceseContext.Provider>
}

export const useDiocese = () => useContext(DioceseContext)
