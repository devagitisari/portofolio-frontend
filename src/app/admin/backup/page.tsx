"use client";

import React, { useState } from "react";
import { exportBackup, importBackup } from "@/services/backendApi";
import { Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function BackupPage() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      await exportBackup();
      setMessage({ type: 'success', text: 'Backup exported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export backup' });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);
    try {
      await importBackup(file);
      setMessage({ type: 'success', text: 'Backup imported successfully! Reloading page...' });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import backup. Please check the file format.' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <section>
      <div className="mb-10">
        <h2 className="font-sans text-[32px] font-extrabold tracking-tight text-on-surface mb-2">
          Backup & Restore
        </h2>
        <p className="text-on-surface-variant text-sm">
          Export your portfolio data for backup or restore from a previous backup file.
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="admin-glass-card p-6 rounded-2xl admin-neon-glow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Download size={24} />
            </div>
            <div>
              <h3 className="font-sans text-xl font-bold text-on-surface">
                Export Data
              </h3>
              <p className="text-on-surface-variant text-sm">
                Download all your portfolio data as JSON
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-on-surface-variant mb-6">
            <p>• Projects, Skills, Experiences</p>
            <p>• Certificates, Settings</p>
            <p>• All inquiries and messages</p>
            <p>• Timestamp: {new Date().toLocaleDateString()}</p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full bg-gradient-to-r from-primary to-tertiary text-white px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export Backup
              </>
            )}
          </button>
        </div>

        {/* Import Card */}
        <div className="admin-glass-card p-6 rounded-2xl admin-neon-glow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="font-sans text-xl font-bold text-on-surface">
                Import Data
              </h3>
              <p className="text-on-surface-variant text-sm">
                Restore from a previous backup file
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-on-surface-variant mb-6">
            <p>⚠️ This will replace all existing data</p>
            <p>• Projects, Skills, Experiences</p>
            <p>• Certificates, Settings</p>
            <p>• All inquiries and messages</p>
          </div>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <button
              disabled={importing}
              className="w-full bg-gradient-to-r from-secondary to-primary text-white px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Import Backup
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Warning Section */}
      <div className="mt-8 admin-glass-card p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-400 mt-1" size={20} />
          <div>
            <h4 className="font-sans text-lg font-bold text-yellow-400 mb-2">
              Important Notes
            </h4>
            <ul className="text-sm text-on-surface-variant space-y-1">
              <li>• Always export a backup before making major changes</li>
              <li>• Importing will completely replace your current data</li>
              <li>• Keep backup files in a secure location</li>
              <li>• Backup files contain all your portfolio data</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
