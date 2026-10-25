import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Upload, Image as ImageIcon, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function CompletePaymentModal({
  isOpen,
  onClose,
  booking,
  onPaymentSubmitted,
}) {
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({ payment_methods: [], payment_instructions: '' });
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [trxId, setTrxId] = useState('');
  const [screenshotAssetId, setScreenshotAssetId] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);

  const lawyerId = booking?.lawyer_id || booking?.lawyerId || booking?.lawyer?.id;
  const lawyerName = booking?.lawyer_name || booking?.lawyerName || booking?.lawyer?.name || 'Advocate';

  // Fetch lawyer payment info whenever modal opens for a booking
  useEffect(() => {
    if (!isOpen || !lawyerId) return;

    setTrxId('');
    setScreenshotAssetId(null);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setErrorMsg(null);
    setCopiedIndex(null);

    const fetchPaymentInfo = async () => {
      setLoadingInfo(true);
      try {
        const res = await api.get(`/lawyers/${lawyerId}/payment-info`);
        setPaymentInfo({
          payment_methods: res.data.payment_methods || [],
          payment_instructions: res.data.payment_instructions || '',
        });
      } catch (err) {
        setPaymentInfo({ payment_methods: [], payment_instructions: '' });
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchPaymentInfo();
  }, [isOpen, lawyerId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text, index) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(file.type) && !['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      toast('Please upload an image (PNG, JPG, or WEBP).', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast('Screenshot must be 2 MB or smaller.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setIsUploadingScreenshot(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('kind', 'payment_screenshot');
    formData.append('file', file);

    try {
      const res = await api.post('/profile/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setScreenshotAssetId(res.data.id);
      toast('Payment screenshot uploaded.', 'success');
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to upload screenshot');
      toast(msg, 'error');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setScreenshotAssetId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setScreenshotAssetId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!trxId.trim()) {
      setErrorMsg('Transaction ID (TrxID) is required.');
      return;
    }

    if (!booking?.id) {
      setErrorMsg('Invalid booking reference.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post(`/bookings/${booking.id}/submit-payment`, {
        trx_id: trxId.trim(),
        screenshot_asset_id: screenshotAssetId || null,
      });

      toast('Payment submitted! Waiting for lawyer confirmation.', 'success');
      if (onPaymentSubmitted) {
        onPaymentSubmitted(res.data);
      }
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to submit payment proof');
      setErrorMsg(msg);
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg z-10 my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/80">
          <div>
            <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-400" />
              Complete Payment for {lawyerName}
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Transfer consultation fee outside platform and submit your proof below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
          {loadingInfo ? (
            <div className="flex items-center justify-center py-8 text-zinc-400 text-sm gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              Loading lawyer payment details...
            </div>
          ) : (
            <>
              {/* Section 1: Payment Instructions */}
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  Payment Instructions
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {paymentInfo.payment_instructions ||
                    'Please send the consultation fee via any payment method listed below. Once transferred, provide the Transaction ID (TrxID) and optional screenshot.'}
                </p>
              </div>

              {/* Section 2: Payment Methods */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Accepted Payment Methods
                </h3>

                {paymentInfo.payment_methods && paymentInfo.payment_methods.length > 0 ? (
                  <div className="space-y-2.5">
                    {paymentInfo.payment_methods.map((methodItem, idx) => {
                      const method = methodItem.method || 'Mobile Banking';
                      const number = methodItem.number || methodItem.account_number || '';
                      const type = methodItem.type || '';
                      const isCopied = copiedIndex === idx;

                      return (
                        <div
                          key={idx}
                          className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-zinc-100">
                                {method}
                              </span>
                              {type && (
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                  {type}
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-sm text-blue-400 font-medium truncate select-all">
                              {number || 'No number specified'}
                            </div>
                          </div>

                          {number && (
                            <button
                              type="button"
                              onClick={() => handleCopy(number, idx)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isCopied
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                              }`}
                              title="Copy number to clipboard"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4 text-center text-sm text-zinc-400">
                    No custom payment accounts listed. Please contact the lawyer or send via standard bKash/Nagad.
                  </div>
                )}
              </div>

              {/* Section 3: Submit Proof */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-zinc-800/70">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Submit Payment Proof
                </h3>

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* TrxID Input */}
                <div>
                  <label htmlFor="trx_id" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Transaction ID (TrxID) <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="trx_id"
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. 9J84KD92LA or BKASH-12345"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Payment Screenshot (Optional, max 2 MB)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {screenshotPreview ? (
                    <div className="relative border border-zinc-800 rounded-xl p-3 bg-zinc-950 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot Preview"
                          className="w-12 h-12 object-cover rounded-lg border border-zinc-800 shrink-0"
                        />
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-medium text-zinc-200 truncate">
                            {screenshotFile?.name}
                          </p>
                          <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                            <Check className="h-3 w-3" /> Ready to submit
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUploadingScreenshot}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-dashed border-zinc-700/80 hover:border-blue-500 rounded-xl p-4 text-center transition-colors bg-zinc-950/40 hover:bg-zinc-950/80 flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
                    >
                      {isUploadingScreenshot ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          <span className="text-xs text-zinc-400">Uploading screenshot...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                          <span className="text-xs text-zinc-300 font-medium">
                            Click to select payment screenshot
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            PNG, JPG, or WEBP up to 2 MB
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-sm font-medium transition-colors"
                  >
                    Pay Later
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingScreenshot || !trxId.trim()}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Payment Proof'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
