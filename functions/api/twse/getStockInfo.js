/**
 * Cloudflare Pages Functions - TWSE API Proxy
 * 解決 CORS 問題的 serverless function
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 只處理 GET 和 OPTIONS 請求
  if (request.method !== 'GET' && request.method !== 'OPTIONS') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  // 處理 OPTIONS 請求 (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  try {
    // 取得查詢參數
    const ex_ch = url.searchParams.get('ex_ch');
    
    if (!ex_ch) {
      return new Response(
        JSON.stringify({ error: 'Missing ex_ch parameter' }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }

    // 建立 TWSE API 請求
    const twseUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${encodeURIComponent(ex_ch)}`;
    
    // 發送請求到 TWSE API
    const response = await fetch(twseUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://mis.twse.com.tw/'
      }
    });

    if (!response.ok) {
      throw new Error(`TWSE API responded with ${response.status}: ${response.statusText}`);
    }

    // 取得回應資料
    const data = await response.text();
    
    // 回傳資料並設定 CORS headers
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=30' // 快取 30 秒
      }
    });

  } catch (error) {
    console.error('[TWSE Proxy] 錯誤:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch TWSE data',
        message: error.message 
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

