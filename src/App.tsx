/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Phone, Radar } from 'lucide-react';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import { GoogleGenAI } from "@google/genai";

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const parsed = parsePhoneNumberWithError(phoneNumber);
      if (!parsed.isValid()) throw new Error('Invalid number');
      
      const genAI = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY || '' });
      const response = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Analyze phone number: ${parsed.number}. Provide origin and carrier info in Indonesian.`,
      });

      setResult({
        number: parsed.number,
        country: parsed.country,
        info: response.text
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-8 font-sans">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Radar className="text-emerald-500 w-8 h-8" />
          <h1 className="text-2xl font-bold">GeoNumber Intel</h1>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+62..."
              className="w-full bg-white/5 border border-white/10 rounded-lg p-4 pl-12 focus:border-emerald-500 outline-none"
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-emerald-600 p-4 rounded-lg font-bold hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Number'}
          </button>
        </form>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        {result && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/40 uppercase">Country</span>
              <span className="font-bold">{result.country}</span>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm leading-relaxed">{result.info}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
