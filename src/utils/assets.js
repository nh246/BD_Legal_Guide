import api, { getErrorMessage } from '../lib/api';
import { toast } from '../store/useToastStore';

// In-memory cache for asset blob URLs and metadata across components
export const assetCache = new Map();

/**
 * Authenticated helper to fetch asset file blob with Authorization header
 * and open in a new browser tab.
 */
export async function openAssetInNewTab(assetId) {
  if (!assetId) return;

  try {
    const cached = assetCache.get(assetId);
    if (cached?.url) {
      window.open(cached.url, '_blank');
      return;
    }

    const res = await api.get(`/assets/${assetId}/file`, { responseType: 'blob' });
    const mime = res.headers['content-type'] || res.data?.type || 'application/octet-stream';
    let filename = 'document';
    const disp = res.headers['content-disposition'] || '';
    const match = disp.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }

    const blob = new Blob([res.data], { type: mime });
    const url = URL.createObjectURL(blob);
    assetCache.set(assetId, {
      url,
      blob,
      mime,
      filename,
      size: blob.size,
    });

    window.open(url, '_blank');
  } catch (err) {
    if (err.response?.status === 404 || err.response?.status === 403) {
      toast("You don't have access to this file.", 'error');
    } else {
      toast(getErrorMessage(err, 'Failed to load file'), 'error');
    }
  }
}

