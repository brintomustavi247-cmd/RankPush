"use client";

import React, { useState, useRef, useCallback } from "react";
import { X, Upload, Camera, CheckCircle } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

interface ProfilePictureUploadProps {
  onClose: () => void;
  currentPhotoURL?: string;
  onUploadSuccess?: (url: string) => void;
}

export function ProfilePictureUpload({
  onClose,
  currentPhotoURL,
  onUploadSuccess,
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      setError("Only JPG, PNG, WebP or GIF images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleUpload = async () => {
    if (!selectedFile) return;
    const user = auth.currentUser;
    if (!user) {
      setError("You must be signed in to upload a profile picture.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const IMGBB_API_KEY = "009dbf74cdf5c094fad4ceac7532987c";

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = data.data.url;

        await updateProfile(user, { photoURL: imageUrl });

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { photoURL: imageUrl });

        setSuccess(true);
        setProgress(100);
        onUploadSuccess?.(imageUrl);
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch (err: any) {
      console.error("[Upload] Failed:", err);
      setError("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg,#0d0b1a,#0a0a16)",
          border: "1px solid rgba(34,211,238,0.2)",
          boxShadow: "0 0 60px rgba(34,211,238,0.1)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-cyan-400/10 rounded-xl flex items-center justify-center border border-cyan-400/20">
            <Camera size={16} color="#22d3ee" />
          </div>
          <div>
            <h2 className="font-black text-sm tracking-wide text-white uppercase" style={{ fontFamily: "'Orbitron',sans-serif" }}>
              Upload Avatar
            </h2>
            <p className="text-[9px] text-white/40 uppercase tracking-widest">
              JPG · PNG · WebP · max 5 MB
            </p>
          </div>
        </div>

        {/* Current / Preview avatar */}
        <div className="flex justify-center mb-5">
          <div
            className="w-24 h-24 rounded-full overflow-hidden"
            style={{ border: "2px solid rgba(34,211,238,0.4)", boxShadow: "0 0 20px rgba(34,211,238,0.15)" }}
          >
            <img
              src={preview || currentPhotoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=default`}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl p-5 text-center cursor-pointer transition-all mb-4"
          style={{
            border: `2px dashed ${isDragging ? "#22d3ee" : "rgba(255,255,255,0.1)"}`,
            background: isDragging ? "rgba(34,211,238,0.05)" : "rgba(255,255,255,0.02)",
          }}
        >
          <Upload size={20} className="mx-auto mb-2 text-white/30" />
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-wide">
            {preview ? "Change image" : "Click or drag & drop"}
          </p>
          {selectedFile && (
            <p className="text-[9px] text-cyan-400 mt-1 truncate">{selectedFile.name}</p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Error message */}
        {error && (
          <p className="text-[10px] text-red-400 text-center mb-3 font-bold">{error}</p>
        )}

        {/* Success message */}
        {success && (
          <div className="flex items-center justify-center gap-2 text-green-400 mb-3">
            <CheckCircle size={14} />
            <p className="text-[10px] font-bold uppercase tracking-wide">Profile updated!</p>
          </div>
        )}

        {/* Progress bar */}
        {uploading && (
          <div className="mb-3">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg,#22d3ee,#0891b2)" }}
              />
            </div>
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading || success}
          className="w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: selectedFile && !uploading && !success
              ? "linear-gradient(135deg,#22d3ee,#0891b2)"
              : "rgba(255,255,255,0.05)",
            color: selectedFile && !uploading && !success ? "white" : "rgba(255,255,255,0.3)",
          }}
        >
          {uploading ? (
            <span className="animate-pulse">Uploading... {progress}%</span>
          ) : success ? (
            <><CheckCircle size={14} /> Done!</>
          ) : (
            <><Upload size={14} /> Upload Photo</>
          )}
        </button>
      </div>
    </div>
  );
}
