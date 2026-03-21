import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NavigationBar } from '../NavigationBar/NavigationBar'

const formatINR = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return 'INR 0'
  }

  return `INR ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`
}

const quickLinks = [
  {
    to: '/academic-year',
    label: 'Academic Year',
    bg: 'bg-violet-50 hover:bg-violet-100',
    text: 'text-violet-700'
  },
  {
    to: '/students',
    label: 'Students',
    bg: 'bg-sky-50 hover:bg-sky-100',
    text: 'text-sky-700'
  },
  {
    to: '/receipts',
    label: 'Receipts',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    text: 'text-emerald-700'
  }
]

const QuickCard = ({ to, label, bg, text }) => (
  <Link
    to={to}
    className={`group flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg sm:rounded-2xl border border-slate-200 px-2 sm:px-6 py-2 sm:py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${bg}`}
  >
    <div>
      <p className={`text-xs sm:text-base font-semibold ${text}`}>{label}</p>
      <p className="mt-1 text-xs sm:text-sm text-slate-500">Open module</p>
    </div>
    <span className={`mt-1 sm:mt-0 inline-block rounded-full px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-medium transition-transform duration-200 group-hover:translate-x-1 ${text}`}>
      Go
    </span>
  </Link>
)

const StatCard = ({ title, value, detail, border, bg, text }) => (
  <article className={`rounded-2xl border ${border} bg-white p-4 sm:p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
      <div className="flex-1">
        <p className="text-xs sm:text-sm text-slate-500">{title}</p>
        <p className="mt-2 sm:mt-3 text-xl sm:text-2xl font-semibold text-slate-800">{value}</p>
      </div>
      <span className={`inline-block rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold ${bg} ${text} whitespace-nowrap`}>
        Live
      </span>
    </div>
    <p className="mt-2 text-xs sm:text-sm text-slate-500">{detail}</p>
  </article>
)

function Dashboard() {
  const [students, setStudents] = useState([])
  const [receipts, setReceipts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const [studentsRes, receiptsRes] = await Promise.all([
        fetch(`${process.env.API_URL}/student/get`),
        fetch(`${process.env.API_URL}/receipt`)
      ])

      const [studentsPayload, receiptsPayload] = await Promise.all([
        studentsRes.json(),
        receiptsRes.json()
      ])

      if (!studentsRes.ok || !receiptsRes.ok) {
        throw new Error('Failed to load dashboard data')
      }

      setStudents(Array.isArray(studentsPayload?.data) ? studentsPayload.data : [])
      setReceipts(Array.isArray(receiptsPayload?.data) ? receiptsPayload.data : [])
    } catch (error) {
      setStudents([])
      setReceipts([])
      setLoadError('Unable to load latest dashboard numbers.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const stats = useMemo(() => {
    const totalStudents = students.length

    const totalCollected = receipts.reduce((sum, item) => {
      const amount = Number(item?.amount)
      return Number.isFinite(amount) ? sum + amount : sum
    }, 0)

    const totalPending = students.reduce((sum, item) => {
      const due = Number(item?.due_amount)
      return Number.isFinite(due) ? sum + due : sum
    }, 0)

    const pendingStudentsCount = students.filter((item) => Number(item?.due_amount) > 0).length
    const totalRevenue = totalCollected + totalPending

    return [
      {
        title: 'Total Students',
        value: totalStudents.toLocaleString('en-IN'),
        detail: 'Active registrations',
        border: 'border-blue-100',
        bg: 'bg-blue-50',
        text: 'text-blue-600'
      },
      {
        title: 'Total Revenue',
        value: formatINR(totalRevenue),
        detail: 'Collected + pending fee',
        border: 'border-emerald-100',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600'
      },
      {
        title: 'Collected',
        value: formatINR(totalCollected),
        detail: `${receipts.length.toLocaleString('en-IN')} payments`,
        border: 'border-cyan-100',
        bg: 'bg-cyan-50',
        text: 'text-cyan-600'
      },
      {
        title: 'Pending',
        value: formatINR(totalPending),
        detail: `${pendingStudentsCount.toLocaleString('en-IN')} pending students`,
        border: 'border-amber-100',
        bg: 'bg-amber-50',
        text: 'text-amber-600'
      }
    ]
  }, [students, receipts])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <NavigationBar />
      <main className="flex-1 px-3 pb-24 pt-20 sm:px-5 sm:pt-24 md:p-8 md:pb-8 md:pt-8">
        <header className="mb-4 rounded-2xl border border-cyan-100 bg-linear-to-br from-cyan-50 via-blue-50 to-white px-4 py-4 shadow-sm sm:mb-6 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">Dashboard</h2>
              <p className="mt-1 text-sm text-slate-500">Your school finance command center</p>
              {loadError && <p className="mt-2 text-xs font-medium text-rose-600">{loadError}</p>}
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-700">
              {isLoading ? 'Refreshing' : 'Live Data'}
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="text-base font-semibold text-slate-800 sm:text-lg">Quick Access</h3>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Jump into your most-used modules</p>
            <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
              {quickLinks.map((action) => (
                <QuickCard key={action.label} {...action} />
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}

export default Dashboard