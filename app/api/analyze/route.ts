import { NextRequest } from 'next/server';

const API_URL = 'https://ideafy-blue.vercel.app/analyze';

export async function POST(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const url = `${API_URL}?${searchParams.toString()}`;

  const formData = await req.formData();

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  // Stream the response back
  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
    },
  });
}