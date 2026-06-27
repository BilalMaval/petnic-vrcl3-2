import { NextResponse } from 'next/server';

// AI Horde API configuration
const AI_HORDE_API_KEY = process.env.AI_HORDE_API_KEY || 'dxZ0RyImRAny6Ge6137LCg';
const AI_HORDE_BASE_URL = 'https://aihorde.net/api/v2';

const STYLE_PROMPTS = {
  'watercolor': 'beautiful watercolor painting style pet portrait, soft flowing colors, artistic brush strokes, dreamy watercolor textures, fine art style',
  'oil-painting': 'classical oil painting style portrait, Renaissance masters style, rich deep colors, visible brush strokes, dramatic lighting, museum-quality fine art',
  'pop-art': 'vibrant pop art style portrait, Andy Warhol inspired, bold bright colors, high contrast, graphic style, halftone dots, comic-book energy',
  'pencil-sketch': 'detailed pencil sketch portrait, fine line work, realistic shading, crosshatching technique, black and white, subtle gray tones',
  'cartoon': 'cute cartoon illustration style, big expressive eyes, playful pose, clean lines, flat vibrant colors, adorable character design',
  'renaissance': 'Renaissance era royal portrait painting, classical masterpiece style, ornate details, regal atmosphere',
  'minimalist': 'minimalist modern art portrait, clean simple lines, limited color palette, contemporary design',
  'neon-glow': 'neon glowing cyberpunk style portrait, vibrant neon colors, futuristic, dark background with glowing outlines',
};

// Helper to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt');
    const style = formData.get('style') || 'watercolor';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS['watercolor'];
    const fullPrompt = `${prompt}, ${stylePrompt}, adorable pet portrait, high quality, detailed`;

    // Step 1: Submit async generation request to AI Horde
    const payload = {
      prompt: fullPrompt,
      params: {
        width: 512,
        height: 512,
        sampler_name: 'k_euler_a',
        steps: 25,
        cfg_scale: 7.5,
        n: 1,
      },
      nsfw: false,
      censor_nsfw: true,
      models: ['Deliberate', 'stable_diffusion'],
    };

    const headers = {
      'apikey': AI_HORDE_API_KEY,
      'Content-Type': 'application/json',
      'Client-Agent': 'PetnicStudio:1.0:AI-Preview',
    };

    const submitResponse = await fetch(`${AI_HORDE_BASE_URL}/generate/async`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (submitResponse.status !== 202) {
      const errorData = await submitResponse.json().catch(() => ({}));
      console.error('AI Horde submit error:', submitResponse.status, errorData);
      return NextResponse.json({ error: 'Failed to submit generation request', details: errorData }, { status: 500 });
    }

    const submitData = await submitResponse.json();
    const jobId = submitData.id;

    if (!jobId) {
      return NextResponse.json({ error: 'No job ID received' }, { status: 500 });
    }

    console.log('AI Horde job submitted:', jobId);

    // Step 2: Poll for completion (max 120 seconds)
    const maxWait = 120;
    const startTime = Date.now();
    const checkHeaders = { 'apikey': AI_HORDE_API_KEY, 'Client-Agent': 'PetnicStudio:1.0:AI-Preview' };

    while ((Date.now() - startTime) / 1000 < maxWait) {
      await sleep(3000);

      const statusResponse = await fetch(`${AI_HORDE_BASE_URL}/generate/status/${jobId}`, {
        headers: checkHeaders,
      });

      if (statusResponse.status !== 200) continue;

      const statusData = await statusResponse.json();
      console.log('AI Horde status:', statusData.done, 'queue:', statusData.queue_position);

      if (statusData.done) {
        const generations = statusData.generations || [];
        if (generations.length > 0 && generations[0].img) {
          // Download the image
          const imgResponse = await fetch(generations[0].img);
          if (imgResponse.ok) {
            const imgBuffer = await imgResponse.arrayBuffer();
            const imageBase64 = Buffer.from(imgBuffer).toString('base64');
            return NextResponse.json({
              image_base64: imageBase64,
              style,
              job_id: jobId,
            });
          }
        }
        return NextResponse.json({ error: 'Generation completed but no image returned' }, { status: 500 });
      }

      if (statusData.faulted) {
        return NextResponse.json({ error: 'Generation failed on AI Horde' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Generation timed out. Please try again.' }, { status: 504 });

  } catch (error) {
    console.error('AI preview error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
