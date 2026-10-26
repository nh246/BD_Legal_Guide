import React, { useState, useEffect, useCallback } from 'react';
import { X, Briefcase } from 'lucide-react';
import DirectMessageThread from './DirectMessageThread';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function CaseDiscussionModal({
  isOpen,
  onClose,
  caseItem,
  bid,
  currentUser,
  isLawyerView = false,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isThreadClosed, setIsThreadClosed] = useState(false);

  const caseId = caseItem?.id;
  const bidId = bid?.id || caseItem?.my_bid?.id;

  const computeIsClosed = useCallback(() => {
    if (!caseItem) return false;
    const activeBidStatus = bid?.status || caseItem?.my_bid?.status;
    const isAccepted = caseItem.status === 'assigned' && activeBidStatus === 'accepted';
    return caseItem.status !== 'open' && !isAccepted;
  }, [caseItem, bid]);

  const loadMessages = useCallback(async () => {
    if (!caseId || !bidId || !isOpen) return;
    setLoading(true);
    setError(null);

    if (computeIsClosed()) {
      setIsThreadClosed(true);
    }

    try {
      const res = await api.get(`/cases/${caseId}/bids/${bidId}/messages`);
      setMessages(res.data || []);
      setIsThreadClosed(false);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.error === 'thread_closed') {
        setIsThreadClosed(true);
      } else {
        setError(getErrorMessage(err, 'Failed to load case discussion messages.'));
      }
    } finally {
      setLoading(false);
    }
  }, [caseId, bidId, isOpen, computeIsClosed]);

  useEffect(() => {
    if (isOpen && caseId && bidId) {
      loadMessages();
    } else {
      setMessages([]);
      setError(null);
      setIsThreadClosed(false);
    }
  }, [isOpen, caseId, bidId, loadMessages]);

  const handleSendMessage = async ({ content, attachmentAssetIds }) => {
    if (!caseId || !bidId) return;
    try {
      const res = await api.post(`/cases/${caseId}/bids/${bidId}/messages`, {
        content,
        attachment_asset_ids: attachmentAssetIds || [],
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.error === 'thread_closed') {
        setIsThreadClosed(true);
        toast('This case discussion is closed.', 'error');
      } else {
        toast(getErrorMessage(err, 'Failed to send message.'), 'error');
      }
      throw err;
    }
  };

  if (!isOpen || !caseItem) return null;

  const recipientName = isLawyerView
    ? caseItem.user_name || 'Client'
    : bid?.lawyer_name || caseItem.my_bid?.lawyer_name || 'Advocate';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header Banner */}
        <div className="p-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800/80 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                <Briefcase className="h-3 w-3" /> Case Discussion
              </span>
              <span className="text-xs text-zinc-400 font-medium truncate">
                {caseItem.category || 'General'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-100 truncate">
              Case Discussion: {caseItem.title}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5 truncate">
              <span>Talking with <strong className="text-zinc-200">{recipientName}</strong></span>
              <span>•</span>
              <span className="capitalize">{caseItem.status}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors shrink-0 cursor-pointer"
            title="Close discussion"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thread Component */}
        <div className="flex-1 overflow-hidden min-h-[420px] max-h-[620px] flex flex-col">
          <DirectMessageThread
            messages={messages}
            currentUserId={currentUser?.id}
            recipientName={recipientName}
            onSendMessage={handleSendMessage}
            loading={loading}
            error={error}
            onRetry={loadMessages}
            isReadOnly={isThreadClosed}
            readOnlyMessage="This case discussion is closed."
            isLawyerView={isLawyerView}
            placeholder={`Message ${recipientName} regarding this case...`}
          />
        </div>
      </div>
    </div>
  );
}
