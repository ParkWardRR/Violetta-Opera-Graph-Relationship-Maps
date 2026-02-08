import React, { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { StopIcon, PlayIcon, ReloadIcon, Cross2Icon, CheckCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'

interface StatusResponse {
    status: string
    logs?: string[]
}

export function AdminPage({ onClose }: { onClose: () => void }) {
    const [config, setConfig] = useState('')
    const [status, setStatus] = useState('Unknown')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const API_BASE = `${import.meta.env.BASE_URL}api`

    useEffect(() => {
        fetchConfig()
        const interval = setInterval(fetchStatus, 2000)
        return () => clearInterval(interval)
    }, [])

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${API_BASE}/config`)
            if (!res.ok) throw new Error('Failed to fetch config')
            const text = await res.text()
            setConfig(text)
        } catch (err) {
            setError('Could not load config. Ensure the scraper server (port 8080) is running.')
        }
    }

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/status`)
            if (res.ok) {
                const data: StatusResponse = await res.json()
                setStatus(data.status)
            } else {
                setStatus('Disconnected')
            }
        } catch (err) {
            setStatus('Disconnected')
        }
    }

    const handleScrape = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/scrape`, { method: 'POST' })
            if (!res.ok) throw new Error('Failed to start scrape')
        } catch (err) {
            alert('Failed to start scrape')
        } finally {
            setLoading(false)
        }
    }

    // Determine status color and icon
    let statusColor = 'bg-gray-500'
    let StatusIcon = ExclamationTriangleIcon
    let statusText = status

    if (status === 'Idle') {
        statusColor = 'bg-emerald-500'
        StatusIcon = CheckCircledIcon
    } else if (status === 'Running') {
        statusColor = 'bg-amber-500'
        StatusIcon = ReloadIcon
    } else if (status === 'Error' || status === 'Disconnected') {
        statusColor = 'bg-rose-500'
        StatusIcon = ExclamationTriangleIcon
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-300">

            {/* Main Modal Container */}
            <div className="w-[90vw] h-[85vh] max-w-6xl bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white tracking-wide">Violetta Admin</h2>
                            <p className="text-xs text-slate-400 font-medium">System Configuration & Status</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <Cross2Icon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Sidebar (Visual only for now) */}
                    <div className="w-64 border-r border-white/10 bg-white/5 hidden md:flex flex-col p-4 gap-2">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dashboard</div>
                        <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium text-sm">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"></span>
                            Overview
                        </button>
                        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors text-sm">
                            <div className="w-2 h-2 rounded-full border border-slate-600"></div>
                            Logs
                        </button>
                        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors text-sm">
                            <div className="w-2 h-2 rounded-full border border-slate-600"></div>
                            Settings
                        </button>
                    </div>

                    {/* Main Panel */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e293b]">

                        {/* Toolbar */}
                        <div className="px-8 py-6 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors", {
                                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400": status === "Idle",
                                    "bg-amber-500/10 border-amber-500/20 text-amber-400": status === "Running",
                                    "bg-rose-500/10 border-rose-500/20 text-rose-400": status === "Error" || status === "Disconnected",
                                })}>
                                    <StatusIcon className={clsx("w-4 h-4", { "animate-spin": status === "Running" })} />
                                    <span>{statusText}</span>
                                </div>
                                {status === "Running" && (
                                    <span className="text-xs text-slate-500 animate-pulse">Processing jobs...</span>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleScrape}
                                    disabled={status === 'Running' || status === 'Disconnected'}
                                    className="flex items-center gap-2 px-5 py-2 bg-white text-black font-semibold rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-white/5 active:scale-95"
                                >
                                    <PlayIcon className="w-4 h-4" />
                                    Start Scrape
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-auto p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

                                {/* Config Editor */}
                                <div className="lg:col-span-2 flex flex-col gap-4 h-full">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-slate-300">Configuration Source</h3>
                                        <span className="text-xs font-mono text-slate-500">config.yaml</span>
                                    </div>
                                    <div className="flex-1 relative group">
                                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-xl pointer-events-none" />
                                        <textarea
                                            className="w-full h-full p-4 font-mono text-xs md:text-sm bg-[#0b1120] border border-white/10 rounded-xl text-slate-300 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none resize-none shadow-inner leading-relaxed transition-all"
                                            value={config}
                                            readOnly
                                            spellCheck={false}
                                        />
                                        {error && (
                                            <div className="absolute bottom-4 left-4 right-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg backdrop-blur-md">
                                                Error: {error}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stats / Info */}
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-sm font-medium text-slate-300">System Info</h3>
                                    <div className="p-5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-4">
                                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                            <span className="text-xs text-slate-400">Region</span>
                                            <span className="text-xs text-white font-medium bg-white/10 px-2 py-0.5 rounded">SoCal</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                            <span className="text-xs text-slate-400">Venues</span>
                                            <span className="text-xs text-white font-medium">6 Active</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400">Next Run</span>
                                            <span className="text-xs text-white font-medium">Manual</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <h4 className="text-xs font-bold text-indigo-300 mb-2 uppercase tracking-wide">Pro Tip</h4>
                                        <p className="text-xs text-indigo-200/70 leading-relaxed">
                                            Use the scraper to hydrate your graph with fresh data. Ensure rate limits in config.yaml are respecting venue policies.
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
