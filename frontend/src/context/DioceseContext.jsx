import { createContext, useContext, useEffect, useState } from 'react'
import client from '../api/client'

// Fetches the diocese record once (currently just Byumba) so components
// like the Navbar and Home hero can show its logo/name without each doing
// their own API call. Explicitly matches on slug "byumba" rather than
// blindly taking whichever diocese the API happens to return first -
// without this, an accidentally-created duplicate diocese record could
// "win" unpredictably depending on database ordering. When a second real
// diocese is added later, this can be extended to pick the right one based
// on the domain/subdomain being visited.
const DioceseContext = createContext(null)

export function DioceseProvider({ children }) {
  const [diocese, setDiocese] = useState(null)

  useEffect(() => {
    client.get('/dioceses/dioceses/').then(r => {
      if (r.data.length) {
        const primary = r.data.find(d => d.slug === 'byumba') || r.data[0]
        setDiocese(primary)
      }
    }).catch(() => {})
  }, [])

  return <DioceseContext.Provider value={diocese}>{children}</DioceseContext.Provider>
}

export const useDiocese = () => useContext(DioceseContext)
