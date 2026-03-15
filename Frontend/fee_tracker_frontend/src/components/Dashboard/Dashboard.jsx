import React from 'react'
import { Link } from 'react-router-dom'
import { NavigationBar } from '../NavigationBar/NavigationBar'

const stats = [
  {
    title: 'Total Students',
    value: '100',
    detail: 'Active registrations',
    border: 'border-blue-100',
    bg: 'bg-blue-50',
    text: 'text-blue-600'
  },
  {
    title: 'Total Revenue',
    value: 'INR 100000',
    detail: 'Total fee amount',
    border: 'border-emerald-100',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600'
  },
  {
    title: 'Collected',
    value: 'INR 100034',
    detail: '34 payments',
    border: 'border-cyan-100',
    bg: 'bg-cyan-50',
    text: 'text-cyan-600'
  },
  {
    title: 'Pending',
    value: 'INR 20000',
    detail: '5 pending payments',
    border: 'border-amber-100',
    bg: 'bg-amber-50',
    text: 'text-amber-600'
  }
]

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
    className={`group flex items-center justify-between rounded-2xl border border-slate-200 px-6 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${bg}`}
  >
    <div>
      <p className={`text-base font-semibold ${text}`}>{label}</p>
      <p className="mt-1 text-sm text-slate-500">Open module</p>
    </div>
    <span className={`rounded-full px-3 py-1 text-sm font-medium transition-transform duration-200 group-hover:translate-x-1 ${text}`}>
      Go
    </span>
  </Link>
)

const StatCard = ({ title, value, detail, border, bg, text }) => (
  <article className={`rounded-2xl border ${border} bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-3 text-2xl font-semibold text-slate-800">{value}</p>
      </div>
      <span className={`inline-block rounded-xl px-3 py-2 text-xs font-semibold ${bg} ${text}`}>
        Live
      </span>
    </div>
    <p className="mt-2 text-sm text-slate-500">{detail}</p>
  </article>
)

function Dashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <NavigationBar />
      <main className="flex-1 p-6 pt-20 md:p-8 md:pt-8">
        <header className="mb-6 rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-cyan-50 px-6 py-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-800">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Fee Management System overview</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Quick Links</h3>
            <div className="mt-4 grid gap-3">
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