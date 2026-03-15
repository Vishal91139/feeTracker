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
import ViewReceipt from './components/Receipts/ViewReceipt.jsx'
import CreateStudent from './components/Students/CreateStudent.jsx'
import StudentDetail from './components/Students/StudentDetail.jsx'
import EditStudent from './components/Students/EditStudent.jsx'
import EditReceipt from './components/Receipts/EditReceipt.jsx'

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
        element: <Students />,
        children: [
          {
            path:"create",
            element: <CreateStudent />
          },
          {
            path:":studentId/edit",
            element: <EditStudent />
          },
          {
            path:":studentId",
            element: <StudentDetail />
          },
        ]
      },
      {
        path: "receipts",
        element: <ReceiptsDashboard />,
        children: [
          {
            path:"create",
            element: <CreateReceipt />
          },
          {
            path:":receiptId",
            element: <ViewReceipt />
          },
          {
            path:":receiptId/edit",
            element: <EditReceipt />
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
