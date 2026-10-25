import React, { useState, useRef } from 'react';
import { Briefcase, Upload, X, FileText, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

const CATEGORIES = [
  'Property',
  'Criminal',
  'Family',
  'Corporate',
  'Other',
];

export default function PostCaseModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Property');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]); // [{ id, filename, size, kind }]
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  const resetForm = () => {
    setTitle('');
    setCategory('Property');
    setDescription('');
    setAttachments([]);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingFiles(true);

    for (const file of files) {
      // 2MB size limit
      if (file.size > 2 * 1024 * 1024) {
        toast(`"${file.name}" exceeds the 2MB size limit.`, 'error');
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      let kind = null;
      if (['pdf', 'txt'].includes(ext)) {
        kind = 'text';
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        kind = 'image';
      } else {
        toast(`"${file.name}" unsupported format. Allowed: PDF, TXT, PNG, JPG, WEBP`, 'error');
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('kind', kind);

        const res = await api.post('/profile/assets', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const assetId = res.data?.id;
        if (assetId) {
          setAttachments((prev) => [
            ...prev,
            {
              id: assetId,
              filename: file.name,
              size: (file.size / 1024).toFixed(0) + ' KB',
              kind,
            },
          ]);
        }
      } catch (err) {
        toast(getErrorMessage(err, `Failed to upload ${file.name}`), 'error');
      }
    }

    setUploadingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (assetId) => {
    setAttachments((prev) => prev.filter((a) => a.id !== assetId));
  };

  const validate = () => {
    const errs = {};
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      errs.title = 'Title is required.';
    } else if (trimmedTitle.length > 100) {
      errs.title = 'Title cannot exceed 100 characters.';
    }

    if (!category) {
      errs.category = 'Please select a category.';
    }

    if (!trimmedDesc) {
      errs.description = 'Case description is required.';
    } else if (trimmedDesc.length < 50) {
      errs.description = `Description must be at least 50 characters (currently ${trimmedDesc.length}).`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        description: description.trim(),
        attachment_asset_ids: attachments.map((a) => a.id),
      };

      const res = await api.post('/cases', payload);
      toast('Case posted successfully to the Case Board!', 'success');
      resetForm();
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      const serverMsg = getErrorMessage(err, 'Failed to post case.');
      toast(serverMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-xl"
      title="Post a New Legal Case"
      description="Post your legal situation to the Case Board. Gold Verified advocates will review and submit competitive fee proposals."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-zinc-300">
              Case Title <span className="text-red-400">*</span>
            </label>
            <span className="text-xs text-zinc-500 font-mono">
              {title.length}/100
            </span>
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Land Title Dispute & Mutation Appeal in Dhaka"
            maxLength={100}
            error={errors.title}
            autoFocus
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-zinc-300 block mb-1.5">
            Legal Category <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-zinc-900 text-zinc-100">
                  {cat} Law
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          {errors.category && (
            <p className="text-xs text-red-400 mt-1">{errors.category}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-zinc-300">
              Case Brief & Facts <span className="text-red-400">*</span>
            </label>
            <span
              className={`text-xs font-mono ${
                description.trim().length >= 50 ? 'text-emerald-400' : 'text-zinc-500'
              }`}
            >
              {description.trim().length}/50 min characters
            </span>
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the background facts, parties involved, current status of court proceedings or notices, and what legal relief you are seeking from the advocate..."
            rows={5}
            error={errors.description}
          />
          <p className="text-xs text-zinc-500 mt-1">
            Provide sufficient detail so lawyers can give you an accurate fee quote and realistic pitch.
          </p>
        </div>

        {/* Attachments */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Case Evidence / Documents <span className="text-xs text-zinc-500 font-normal">(Optional)</span>
            </label>
            <span className="text-xs text-zinc-500">Max 2MB each (PDF, PNG, JPG, TXT)</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-colors group"
          >
            <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
              <Upload className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100">
                {uploadingFiles ? 'Uploading documents...' : 'Click to upload case documents'}
              </p>
              <p className="text-xs text-zinc-500">Upload deeds, notices, FIR, or contracts</p>
            </div>
          </div>

          {/* Attachment Chips */}
          {attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                >
                  {file.kind === 'image' ? (
                    <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-amber-400" />
                  )}
                  <span className="max-w-[150px] truncate">{file.filename}</span>
                  <span className="text-zinc-500 font-mono">({file.size})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(file.id)}
                    className="text-zinc-400 hover:text-red-400 p-0.5 rounded transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/60">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={submitting}
            disabled={uploadingFiles || submitting}
            className="gap-2 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Briefcase className="h-4 w-4" />
            <span>Publish Case to Board</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
