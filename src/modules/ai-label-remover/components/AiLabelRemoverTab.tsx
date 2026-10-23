'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  Sliders,
  Sparkles,
  FileImage,
  RefreshCw,
  FolderArchive,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  ProcessedItem,
  CleanOptions,
  CameraProfile,
  SupportedFileType,
} from '../types';
import {
  validateIncomingFile,
  processItem,
} from '../engine/processor';

export function AiLabelRemoverTab() {
  const [items, setItems] = useState<ProcessedItem[]>([]);
  const [options, setOptions] = useState<CleanOptions>({
    injectCameraExif: false,
    cameraProfile: 'apple',
  });
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setGlobalError(null);
      const incoming = Array.from(fileList);

      if (items.length + incoming.length > 30) {
        setGlobalError('Batch limit reached: Up to 30 images can be processed simultaneously.');
        return;
      }

      const newItems: ProcessedItem[] = [];

      for (const file of incoming) {
        const validation = validateIncomingFile(file);
        if (!validation.valid) {
          setGlobalError(validation.error || 'Invalid file detected.');
          continue;
        }

        const id = Math.random().toString(36).substring(2, 11);
        const item: ProcessedItem = {
          id,
          file,
          name: file.name,
          size: file.size,
          fileType: 'unknown',
          markers: {
            c2pa: false,
            xmp: false,
            exif: false,
            iptc: false,
            pngText: false,
            comments: false,
            details: [],
          },
          hasAiMarkers: false,
          hasAnyMetadata: false,
          status: 'queued',
        };

        newItems.push(item);
      }

      setItems((prev) => [...prev, ...newItems]);

      // Automatically run processing pipeline for newly added items
      for (const item of newItems) {
        setItems((current) =>
          current.map((it) => (it.id === item.id ? { ...it, status: 'processing' } : it))
        );
        const processed = await processItem(item, options);
        setItems((current) =>
          current.map((it) => (it.id === item.id ? processed : it))
        );
      }
    },
    [items.length, options]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClearAll = () => {
    items.forEach((it) => {
      if (it.cleanedUrl) URL.revokeObjectURL(it.cleanedUrl);
    });
    setItems([]);
    setGlobalError(null);
  };

  const handleRemoveItem = (id: string) => {
    const it = items.find((x) => x.id === id);
    if (it?.cleanedUrl) URL.revokeObjectURL(it.cleanedUrl);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const handleReapplyOptions = async () => {
    setIsProcessingAll(true);
    for (const item of items) {
      const processed = await processItem(item, options);
      setItems((current) =>
        current.map((it) => (it.id === item.id ? processed : it))
      );
    }
    setIsProcessingAll(false);
  };

  const handleDownloadAllZip = async () => {
    const readyItems = items.filter((it) => it.status === 'done' && it.cleanedBlob);
    if (readyItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const it of readyItems) {
        if (it.cleanedBlob) {
          const extension = it.name.includes('.') ? it.name.split('.').pop() : 'jpg';
          const baseName = it.name.substring(0, it.name.lastIndexOf('.')) || it.name;
          const cleanFileName = `${baseName}_clean.${extension}`;
          zip.file(cleanFileName, it.cleanedBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `zeon_cleaned_images_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      setGlobalError(`Error creating ZIP archive: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsZipping(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const totalDetectedAi = items.filter((x) => x.hasAiMarkers).length;
  const totalCompleted = items.filter((x) => x.status === 'done').length;

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Header */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-neutral-900/60 to-blue-950/40 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-medium text-cyan-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% In-Browser Execution (Zero Server Uploads)
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI Label & Provenance Metadata Stripper
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Losslessly excises C2PA manifests, Adobe XMP tags, ComfyUI generation parameters, and EXIF headers without pixel re-compression.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-950/50 border border-cyan-800/50 px-3.5 py-2 rounded-xl self-start md:self-auto font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pure Binary Slicing</span>
          </div>
        </div>
      </div>

      {/* Options Control Bar */}
      <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="relative flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.injectCameraExif}
              onChange={(e) => {
                setOptions((prev) => ({ ...prev, injectCameraExif: e.target.checked }));
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            <div>
              <span className="text-sm font-semibold text-white block">
                Inject Clean Camera EXIF
              </span>
              <span className="text-xs text-neutral-400 block">
                Replaces AI signatures with standard smartphone / DSLR photographic headers
              </span>
            </div>
          </label>
        </div>

        {options.injectCameraExif && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-neutral-400">Camera Profile:</span>
            <select
              value={options.cameraProfile}
              onChange={(e) => {
                setOptions((prev) => ({
                  ...prev,
                  cameraProfile: e.target.value as CameraProfile,
                }));
              }}
              className="bg-neutral-950 border border-neutral-700 text-neutral-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="apple">Apple iPhone 15 Pro</option>
              <option value="sony">Sony Alpha ILCE-7RM5</option>
              <option value="canon">Canon EOS R5</option>
            </select>

            {items.length > 0 && (
              <button
                type="button"
                onClick={handleReapplyOptions}
                disabled={isProcessingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition-colors"
                title="Re-apply settings to loaded files"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessingAll ? 'animate-spin' : ''}`} />
                <span>Update</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]'
            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.avif,.heic"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              Drag & Drop your images here, or browse
            </h3>
            <p className="text-xs text-neutral-400">
              Supports JPG, PNG, WebP, AVIF, HEIC • Up to 30 files • Max 15MB each
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-[11px] text-neutral-500 bg-neutral-950/80 px-3 py-1 rounded-full border border-neutral-800">
            <span>Client-side only</span>
            <span>•</span>
            <span>Zero quality compression</span>
            <span>•</span>
            <span>Instant batch export</span>
          </div>
        </div>
      </div>

      {globalError && (
        <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl p-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Batch Overview & Actions */}
      {items.length > 0 && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white">
                Queue ({items.length} files)
              </span>

              {totalDetectedAi > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {totalDetectedAi} with AI Markers
                </span>
              )}

              {totalCompleted === items.length && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All Cleaned
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isZipping || totalCompleted === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition-all border border-cyan-400/30"
              >
                <FolderArchive className="w-4 h-4" />
                <span>{isZipping ? 'Generating ZIP...' : 'Download All as ZIP'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* List of Files */}
          <div className="divide-y divide-neutral-800/80">
            {items.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 text-neutral-400">
                    <FileImage className="w-5 h-5 text-cyan-400/80" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-200 truncate max-w-[260px] sm:max-w-md">
                        {item.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                        {item.fileType}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-neutral-500 text-[11px]">
                      <span>Original: {formatBytes(item.size)}</span>
                      {item.cleanedSize && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">
                            Cleaned: {formatBytes(item.cleanedSize)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Pre-Clean Metadata Inspector Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.markers.c2pa && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-semibold">
                          C2PA Manifest Detected
                        </span>
                      )}
                      {item.markers.xmp && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-semibold">
                          XMP AI Tags Found
                        </span>
                      )}
                      {item.markers.pngText && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                          PNG Generation Parameters (tEXt)
                        </span>
                      )}
                      {item.markers.exif && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px]">
                          EXIF / Device Info
                        </span>
                      )}
                      {!item.hasAnyMetadata && item.status === 'done' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          Clean Binary (No Markers)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  {item.status === 'done' && item.cleanedUrl ? (
                    <a
                      href={item.cleanedUrl}
                      download={`clean_${item.name}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save Cleaned</span>
                    </a>
                  ) : item.status === 'processing' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>Stripping...</span>
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
