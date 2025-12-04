import { Message } from '../types';

const API_BASE_URL = "http://64.227.155.90:9100/chat/get";

/**
 * robustFetch attempts to fetch from a URL using multiple strategies
 * to overcome CORS or Mixed Content restrictions.
 */
async function fetchWithFallback(targetUrl: string): Promise<Response> {
  // Strategy 1: Direct Fetch (Optimistic)
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) return res;
  } catch (e) {
    console.warn("Direct fetch failed, trying proxy...");
  }

  // Strategy 2: AllOrigins Proxy
  try {
    const proxyUrl1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl1);
    if (res.ok) return res;
  } catch (e) {
    console.warn("AllOrigins proxy failed, trying backup proxy...");
  }

  // Strategy 3: CodeTabs Proxy
  try {
    const proxyUrl2 = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl2);
    if (res.ok) return res;
  } catch (e) {
    console.error("All fetch attempts failed.");
  }

  throw new Error("Unable to connect to server after multiple attempts.");
}

export const sendMessageToApi = async (prompt: string, model: string): Promise<string> => {
  const targetUrl = `${API_BASE_URL}?prompt=${encodeURIComponent(prompt)}&model=${model}`;
  
  try {
    const response = await fetchWithFallback(targetUrl);
    const data = await response.json();
    
    if (data && data.response) {
      return data.response;
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error: any) {
    console.error("API Error:", error);
    // Return a structured error message to be handled by the UI
    let errorMsg = `**Connection Failed**: ${error.message || 'Unknown error'}.`;
    if (window.location.protocol === 'https:' && API_BASE_URL.startsWith('http:')) {
      errorMsg += `\n\n**Note**: Mixed Content blocking is likely. Attempted secure proxies but they may be busy.`;
    }
    throw new Error(errorMsg);
  }
};