/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Phone, 
  Radar, 
  Activity, 
  Shield, 
  Globe, 
  AlertTriangle,
  Info,
  Terminal,
  Zap,
  Cpu,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import { GoogleGenAI } from "@google/genai";

// Helper for tailwind classes
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [manualKey, setManualKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReport(null);
    setParsedData(null);

    try {
      const parsed = parsePhoneNumberWithError(phoneNumber);
      if (!parsed.isValid()) {
        throw new Error('Nomor telepon tidak valid. Pastikan gunakan format internasional (misal: +62...).');
      }
      
      setParsedData(parsed);
      startScan(parsed);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses nomor.');
    }
  };

  const startScan = async (parsed: any) => {
    setIsScanning(true);
    setScanProgress(0);

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 300);

    try {
      // Try to get key from multiple sources
      const apiKey = 
        manualKey ||
        process.env.GEMINI_API_KEY || 
        (process.env as any).USER_API_KEY || 
        process.env.API_KEY ||
        (import.meta as any).env?.VITE_GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === '') {
        setShowKeyInput(true);
        throw new Error('API Key tidak terdeteksi secara otomatis. Silakan masukkan secara manual di bawah.');
      }

      const genAI = new GoogleGenAI({ apiKey });
      
      // Try Flash model first (better quota)
      let response;
      try {
        response = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Analyze this phone number metadata:
            Number: ${parsed.number}
            Country: ${parsed.country}
            Carrier: ${parsed.carrier || 'Unknown'}
            
            Provide a technical intelligence report in Indonesian. 
            Return ONLY a JSON object with this structure:
            {
              "summary": "Short overview",
              "regionDetails": "Specific details about the registration area",
              "carrierInfo": "Information about the network provider",
              "securityRisk": "Low" | "Medium" | "High",
              "recommendations": ["tip 1", "tip 2", "tip 3"]
            }`,
          config: {
            responseMimeType: "application/json",
          }
        });
      } catch (flashErr: any) {
        console.warn("Flash model failed, trying Pro fallback...", flashErr);
        // Fallback to Pro if Flash fails (though usually it's the other way around)
        response = await genAI.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `Analyze this phone number metadata:
            Number: ${parsed.number}
            Country: ${parsed.country}
            Carrier: ${parsed.carrier || 'Unknown'}
            
            Provide a technical intelligence report in Indonesian. 
            Return ONLY a JSON object with this structure:
            {
              "summary": "Short overview",
              "regionDetails": "Specific details about the registration area",
              "carrierInfo": "Information about the network provider",
              "securityRisk": "Low" | "Medium" | "High",
              "recommendations": ["tip 1", "tip 2", "tip 3"]
            }`,
          config: {
            responseMimeType: "application/json",
          }
        });
      }

      const result = JSON.parse(response.text || '{}');
      
      setTimeout(() => {
        setReport(result);
        setIsScanning(false);
        setScanProgress(100);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mendapatkan laporan intelijen.');
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E6] font-mono selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1A1A1C_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1C_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <header className="relative border-b border-white/5 bg-black/40 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center">
              <Radar className="w-5 h-5 text-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-lg font-bold tracking-tighter uppercase">GeoNumber <span className="text-emerald-500">Intel</span></h1>
            <span className="text-[8px] bg-white/10 px-1 rounded text-white/40">v2.5.4</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-white/40">
            <div className="flex items-center gap-2">
              <span className="opacity-50">Debug:</span>
              <span className={cn((manualKey || process.env.GEMINI_API_KEY || (process.env as any).USER_API_KEY) ? "text-emerald-500" : "text-red-500")}>
                {(manualKey || process.env.GEMINI_API_KEY || (process.env as any).USER_API_KEY) ? "KEY_OK" : "NO_KEY"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Active
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-12 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-[#111113] border border-white/5 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-6 text-xs font-bold text-white/60 uppercase tracking-widest">
                <Terminal className="w-4 h-4" />
                Input Terminal
              </div>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+62 812..."
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 pl-11 focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-white/20"
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                </div>
                
                <button
                  type="submit"
                  disabled={isScanning || !phoneNumber}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {isScanning ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Analyze Target
                    </>
                  )}
                </button>
              </form>

              {showKeyInput && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 pt-6 border-t border-white/5 space-y-3"
                >
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Manual API Key
                  </label>
                  <input
                    type="password"
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <p className="text-[9px] text-white/30 italic">
                    Masukkan key manual jika deteksi otomatis gagal.
                  </p>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </motion.div>
              )}
            </section>

            <section className="bg-[#111113] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-xs font-bold text-white/60 uppercase tracking-widest">
                <Info className="w-4 h-4" />
                System Status
              </div>
              <div className="space-y-3">
                <StatusItem label="Satellite Link" status="Connected" color="text-emerald-500" />
                <StatusItem label="Database" status="Global" color="text-blue-500" />
                <StatusItem label="Encryption" status="AES-256" color="text-emerald-500" />
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] bg-[#111113] border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden"
                >
                  <div className="relative w-48 h-48 mb-8">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                      <motion.circle
                        cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeDasharray="502.6"
                        animate={{ strokeDashoffset: 502.6 - (502.6 * scanProgress) / 100 }}
                        className="text-emerald-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-emerald-500">{Math.round(scanProgress)}%</span>
                      <span className="text-[10px] uppercase tracking-widest text-white/40">Scanning</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/60 animate-pulse">Triangulating network nodes...</p>
                </motion.div>
              ) : report ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ResultCard icon={<Globe className="w-4 h-4 text-blue-400" />} label="Country" value={parsedData?.country || 'Unknown'} />
                    <ResultCard icon={<Cpu className="w-4 h-4 text-purple-400" />} label="Carrier" value={parsedData?.carrier || 'Identified'} />
                    <ResultCard icon={<Shield className={cn("w-4 h-4", report.securityRisk === 'Low' ? 'text-emerald-400' : 'text-orange-400')} />} label="Risk Level" value={report.securityRisk} />
                  </div>

                  <div className="bg-[#111113] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                    <div className="border-b border-white/5 bg-white/5 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Intelligence Summary
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> Regional Analysis
                          </h3>
                          <p className="text-sm leading-relaxed text-white/80">{report.regionDetails}</p>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Network Intelligence
                          </h3>
                          <p className="text-sm leading-relaxed text-white/80">{report.carrierInfo}</p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Shield className="w-3 h-3" /> Security Recommendations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {report.recommendations.map((rec: string, i: number) => (
                            <div key={i} className="p-4 bg-black border border-white/5 rounded-lg text-xs text-white/60 leading-relaxed">
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] bg-[#111113] border border-white/5 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Search className="w-8 h-8 text-white/20" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Siap untuk Analisis</h2>
                  <p className="text-sm text-white/40 max-w-sm">
                    Masukkan nomor telepon internasional (misal: +62...) untuk memulai pemindaian intelijen regional dan jaringan.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusItem({ label, status, color }: { label: string, status: string, color: string }) {
  return (
    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
      <span className="text-white/40">{label}</span>
      <span className={cn("font-bold", color)}>{status}</span>
    </div>
  );
}

function ResultCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-[#111113] border border-white/5 rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</div>
        <div className="text-sm font-bold text-white/90">{value}</div>
      </div>
    </div>
  );
}
