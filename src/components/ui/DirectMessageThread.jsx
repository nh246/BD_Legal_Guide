import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Send,
  X,
  FileText,
  Image as ImageIcon,
  Lock,
  Eye,
  ExternalLink,
  AlertCircle,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';
import { LoadingState, ErrorState } from './PageStates';
import MeetingControls from './MeetingControls';

// In-memory cache for asset blob URLs and metadata across components
const assetCache = new Map();

/**
 * Helper to fetch asset file blob and open in a new tab.
 */
export async function openAssetInNewTab(assetId) {
  try {
    const cached = assetCache.get(assetId);
    if (cached?.url) {
      window.open(cached.url, '_blank');
      return;
    }
    const res = await api.get(`/assets/${assetId}/file`, { responseType: 'blob' });
    const mime = res.headers['content-type'] || res.data?.type || 'application/octet-stream';
    const blob = new Blob([res.data], { type: mime });
    const url = URL.createObjectURL(blob);
    assetCache.set(assetId, { url, blob, mime });
    window.open(url, '_blank');
  } catch (err) {
    toast('Failed to load attachment file', 'error');
  }
}

/**
 * Attachment preview inside a chat bubble (image thumbnail or document badge).
 */
function AttachmentBubbleItem({ assetId, isMe }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!assetId) {
      setLoading(false);
      return;
    }

    const cached = assetCache.get(assetId);
    if (cached?.url) {
      setData(cached);
      setLoading(false);
      return;
    }

    let active = true;
    api
      .get(`/assets/${assetId}/file`, { responseType: 'blob' })
      .then((res) => {
        if (!active) return;
        const mime = res.headers['content-type'] || res.data?.type || '';
        let filename = 'Attachment';
        const disp = res.headers['content-disposition'] || '';
        const match = disp.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        } else if (mime.includes('pdf')) {
          filename = 'Document.pdf';
        } else if (mime.includes('text')) {
          filename = 'Document.txt';
        } else if (mime.startsWith('image/')) {
          filename = 'Image';
        }

        const isImage = mime.startsWith('image/');
        const url = URL.createObjectURL(res.data);
        const meta = {
          url,
          blob: res.data,
          isImage,
          filename,
          mime,
        };
        assetCache.set(assetId, meta);
        setData(meta);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [assetId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 text-zinc-300 text-xs animate-pulse">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Loading attachment...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Attachment unavailable</span>
      </div>
    );
  }

  const handleClick = (e) => {
    e.preventDefault();
    if (data.url) {
      window.open(data.url, '_blank');
    }
  };

  if (data.isImage) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="group relative block rounded-xl overflow-hidden border border-zinc-700/60 hover:border-blue-400 transition-all text-left shadow-md cursor-pointer"
        title={`View ${data.filename}`}
      >
        <img
          src={data.url}
          alt={data.filename}
          className="h-28 w-28 sm:h-36 sm:w-36 object-cover transition-transform duration-200 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
          <Eye className="h-5 w-5 drop-shadow" />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left max-w-[260px] cursor-pointer shadow-sm ${
        isMe
          ? 'bg-blue-700/60 hover:bg-blue-700 border-blue-500/40 text-white'
          : 'bg-zinc-800/90 hover:bg-zinc-800 border-zinc-700/70 text-zinc-200'
      }`}
      title={`Open ${data.filename}`}
    >
      <div
        className={`p-1.5 rounded-lg shrink-0 ${
          isMe ? 'bg-blue-800/80 text-blue-200' : 'bg-zinc-700/80 text-amber-400'
        }`}
      >
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{data.filename}</p>
        <p className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-zinc-400'}`}>Click to open</p>
      </div>
      <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
    </button>
  );
}

/**
 * Shared Direct Message Thread Component.
 * Supports:
 * - Message rendering with auto-scroll
 * - Attachment rendering (image thumbnails & document chips)
 * - Paperclip attachment uploader (PDF/TXT/PNG/JPG/WEBP, max 2MB, max 4 per message)
 * - Read-only banner when consultation is completed
 */
export default function DirectMessageThread({
  messages = [],
  currentUserId,
  recipientName = 'Lawyer',
  onSendMessage,
  loading = false,
  error = null,
  onRetry,
  isReadOnly = false,
  isLawyerView = false,
  placeholder,
  booking,
  onBookingUpdate,
  onOpenReviewModal,
}) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom on message list update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, pendingAttachments]);

  const handleOpenPicker = () => {
    if (isReadOnly) return;
    if (pendingAttachments.length >= 4) {
      toast('Maximum 4 attachments allowed per message', 'error');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const availableSlots = 4 - pendingAttachments.length;
    if (availableSlots <= 0) {
      toast('Maximum 4 attachments allowed per message', 'error');
      return;
    }

    if (files.length > availableSlots) {
      toast(`You can only attach ${availableSlots} more file(s). Maximum 4 allowed.`, 'error');
    }

    const filesToUpload = files.slice(0, availableSlots);
    setIsUploading(true);

    for (const file of filesToUpload) {
      // Check 2MB size limit
      if (file.size > 2 * 1024 * 1024) {
        toast(`"${file.name}" exceeds the maximum limit of 2MB`, 'error');
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      let kind = null;
      if (['pdf', 'txt'].includes(ext)) {
        kind = 'text';
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        kind = 'image';
      } else {
        toast(`"${file.name}" has an unsupported format. Allowed: PDF, TXT, PNG, JPG, WEBP`, 'error');
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
        const uploadedFilename = res.data?.filename || file.name;
        const uploadedKind = res.data?.kind || kind;
        const isImage = uploadedKind === 'image';

        // Pre-cache preview blob and URL
        const objectUrl = URL.createObjectURL(file);
        assetCache.set(assetId, {
          url: objectUrl,
          blob: file,
          isImage,
          filename: uploadedFilename,
          mime: file.type,
        });

        setPendingAttachments((prev) => [
          ...prev,
          {
            id: assetId,
            filename: uploadedFilename,
            kind: uploadedKind,
            isImage,
          },
        ]);
        toast(`Attached "${uploadedFilename}"`, 'success');
      } catch (err) {
        toast(getErrorMessage(err, `Failed to upload "${file.name}"`), 'error');
      }
    }

    setIsUploading(false);
  };

  const handleRemoveAttachment = (idToRemove) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== idToRemove));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly || isSending || isUploading) return;

    const contentText = inputText.trim();
    if (!contentText && pendingAttachments.length === 0) return;

    setIsSending(true);
    try {
      await onSendMessage({
        content: contentText,
        attachmentAssetIds: pendingAttachments.map((a) => a.id),
      });
      setInputText('');
      setPendingAttachments([]);
    } catch (err) {
      // Parent handles error or toasts
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-950/80 rounded-xl overflow-hidden border border-zinc-800/80">
      {/* Optional Consultation Meeting & Completion Controls Header */}
      {booking && (
        <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
          <MeetingControls
            booking={booking}
            isLawyer={isLawyerView}
            currentUserId={currentUserId}
            compact={true}
            onBookingUpdate={onBookingUpdate}
            onOpenReviewModal={onOpenReviewModal}
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="h-full flex items-center justify-center min-h-[220px]">
            <LoadingState message="Loading conversation messages..." />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center min-h-[220px]">
            <ErrorState error={error} onRetry={onRetry} />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 min-h-[220px]">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="font-semibold text-zinc-200 text-sm">No messages yet</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              {isReadOnly
                ? 'This consultation has been completed and has no recorded messages.'
                : `Send a message below to start your conversation with ${recipientName}.`}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = isLawyerView
              ? msg.sender_user_id === currentUserId || msg.sender_role === 'lawyer'
              : msg.sender_user_id === currentUserId;

            const senderLabel = isMe
              ? isLawyerView
                ? 'You (Advocate)'
                : 'You'
              : recipientName;

            const messageAttachments = Array.isArray(msg.attachments) ? msg.attachments : [];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} transition-all`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-medium text-zinc-400">{senderLabel}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm space-y-2.5 ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700/60'
                  }`}
                >
                  {msg.content && msg.content !== '(Attachment)' && (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {/* Attachments List */}
                  {messageAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {messageAttachments.map((attId, idx) => {
                        const rawId = typeof attId === 'string' ? attId : attId?.id || attId?.asset_id;
                        return (
                          <AttachmentBubbleItem
                            key={rawId || idx}
                            assetId={rawId}
                            isMe={isMe}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {isMe && (
                  <span className="text-[10px] text-zinc-500 mt-0.5 px-1 font-medium">
                    {msg.is_read ? 'Read' : 'Delivered'}
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Read-Only Banner OR Active Send Box */}
      {isReadOnly ? (
        <div className="p-4 bg-zinc-900 border-t border-zinc-800/80 text-center flex items-center justify-center gap-2">
          <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-zinc-300">
            Consultation completed. This thread is read-only.
          </span>
        </div>
      ) : (
        <div className="p-3 bg-zinc-900 border-t border-zinc-800/80">
          {/* Pending Attachment Chips */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-2.5 px-1 animate-in fade-in duration-150">
              {pendingAttachments.map((att) => (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 shadow-sm"
                >
                  {att.isImage ? (
                    <ImageIcon className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="max-w-[140px] truncate font-medium">{att.filename}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="text-zinc-400 hover:text-red-400 ml-1 transition-colors p-0.5 rounded cursor-pointer"
                    title="Remove attachment"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <span className="text-[11px] text-zinc-500 font-medium">
                ({pendingAttachments.length}/4)
              </span>
            </div>
          )}

          {/* Form Send Box */}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />

            {/* Paperclip Button */}
            <button
              type="button"
              onClick={handleOpenPicker}
              disabled={isUploading || isSending || pendingAttachments.length >= 4}
              title={
                pendingAttachments.length >= 4
                  ? 'Maximum 4 attachments reached'
                  : 'Attach file (PDF, TXT, PNG, JPG, WEBP, max 2MB)'
              }
              className={`p-2.5 rounded-xl border transition-colors shrink-0 flex items-center justify-center cursor-pointer ${
                pendingAttachments.length >= 4 || isUploading
                  ? 'bg-zinc-950 text-zinc-600 border-zinc-800 cursor-not-allowed opacity-60'
                  : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={placeholder || `Write a message to ${recipientName}...`}
              disabled={isSending || isUploading}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && pendingAttachments.length === 0) || isSending || isUploading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-4 sm:px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
