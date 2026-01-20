import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import ReceiptsDashboard from './components/Receipts/ReceiptsDashboard.jsx'
import Students from './components/Students/Students.jsx'
import AcademicYear from './components/Academic-year/AcademicYear.jsx'
import CreateReceipt from './components/Receipts/CreateReceipt.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: "",
        element: <Dashboard />
      },
      {
        path: "academic-year",
        element: <AcademicYear />
      },
      {
        path: "students",
        element: <Students />
      },
      {
        path: "receipts",
        element: <ReceiptsDashboard />,
        children: [
          {
            path:"create",
            element: <CreateReceipt />
          }
        ]
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
