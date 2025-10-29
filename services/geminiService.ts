import { GoogleGenAI, Modality } from '@google/genai';
import type { Selection } from '../types';

if (!process.env.API_KEY) {
  // This check is a safeguard; the key is expected to be provided by the environment.
  console.warn("API_KEY environment variable is not set. The application might not work correctly.");
}

const MAX_RETRIES = 3;

/**
 * A retry wrapper for API calls that might fail due to quota limits.
 * Implements exponential backoff and respects API-suggested retry delays.
 * @param apiCall The async function to call.
 * @param serviceName A friendly name for the service being called, for logging.
 * @returns The result of the apiCall.
 */
async function withRetry<T>(apiCall: () => Promise<T>, serviceName: string): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      const errorString = String(error);
      const isQuotaError = errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED");

      if (!isQuotaError) {
        // Not a retriable error, throw immediately.
        throw error;
      }
      
      console.log(`Attempt ${i + 1} for ${serviceName} failed due to quota limit.`);

      if (i < MAX_RETRIES - 1) {
        let delay = 5000 * Math.pow(2, i); // Default exponential backoff: 5s, 10s
        // Try to extract specific retry delay from API error
        const match = errorString.match(/"retryDelay":"(\d+)/);
        if (match && match[1]) {
            delay = parseInt(match[1], 10) * 1000 + 500; // Use API delay + 500ms buffer
            console.log(`Retrying after API suggested delay of ${match[1]}s.`);
        } else {
            console.log(`Retrying with exponential backoff in ${delay / 1000}s.`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If loop completes, all retries have failed.
  throw new Error(`You have exceeded your API quota for ${serviceName}. After multiple retries, the service is still unavailable. Please check your plan and billing details, or try again later.`);
}


function getPositionalDescription(selection: Selection, imageWidth: number, imageHeight: number): string {
    const centerX = selection.x + selection.width / 2;
    const centerY = selection.y + selection.height / 2;
  
    const horizontalThird = imageWidth / 3;
    const verticalThird = imageHeight / 3;
  
    let verticalPos = "middle";
    if (centerY < verticalThird) {
      verticalPos = "top";
    } else if (centerY > verticalThird * 2) {
      verticalPos = "bottom";
    }
  
    let horizontalPos = "center";
    if (centerX < horizontalThird) {
      horizontalPos = "left";
    } else if (centerX > horizontalThird * 2) {
      horizontalPos = "right";
    }
  
    if (verticalPos === "middle" && horizontalPos === "center") {
      return "in the center";
    }
    if (verticalPos === "middle") {
      return `in the center ${horizontalPos}`;
    }
    if (horizontalPos === "center") {
      return `in the ${verticalPos} center`;
    }
  
    return `in the ${verticalPos} ${horizontalPos} area`;
}

async function getImageDimensions(base64Image: string): Promise<{width: number, height: number}> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = `data:image/jpeg;base64,${base64Image}`;
    });
}


export const removeObjectFromFrame = async (base64Image: string, selection: Selection): Promise<string> => {
  try {
    return await withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const { width, height } = await getImageDimensions(base64Image);
      const position = getPositionalDescription(selection, width, height);

      const prompt = `Please perform an inpainting task on this image. 
      Remove the object located ${position} and replace it with a realistic background that seamlessly matches the surrounding area. 
      Do not add any new objects, simply fill the space left by the removed object.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const firstPart = response.candidates?.[0]?.content?.parts?.[0];
      if (firstPart && firstPart.inlineData) {
        return firstPart.inlineData.data;
      }

      throw new Error('No image data returned from API.');
    }, 'image processing');
  } catch (error) {
    console.error('Error calling Gemini API for image processing:', error);
    
    if (error instanceof Error) {
        // Let the specific quota error message from withRetry pass through
        if (error.message.includes('API quota')) {
            throw error;
        }
        if (error.message.includes("403")){
            throw new Error('API key is invalid or lacks permissions.');
        }
    }
    // For anything else, throw a generic error.
    throw new Error('Failed to process image with the AI model.');
  }
};

export const generateVideoFromFrame = async (base64Image: string): Promise<string> => {
  try {
    return await withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const { width, height } = await getImageDimensions(base64Image);
      const aspectRatio = width > height ? '16:9' : '9:16';

      const prompt = `Create a short, 5-second video that subtly animates this scene. 
      The motion should be gentle and natural, as if it's a brief clip from a longer video. 
      Ensure the output is high quality.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
          imageBytes: base64Image,
          mimeType: 'image/jpeg',
        },
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: aspectRatio,
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

      if (!downloadLink) {
        throw new Error('Video generation succeeded but no download link was provided.');
      }

      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!videoResponse.ok) {
          const errorText = await videoResponse.text();
          if (errorText.includes("Requested entity was not found.")) {
               throw new Error("API key not found. Please select your API key again.");
          }
          throw new Error(`Failed to download the generated video. Status: ${videoResponse.status}`);
      }
      
      const videoBlob = await videoResponse.blob();
      return URL.createObjectURL(videoBlob);
    }, 'video generation');
  } catch (error) {
    console.error('Error calling Veo API:', error);
    
    const errorString = String(error);
    
    // Let specific error messages from withRetry or the fetch call pass through
    if (errorString.includes('API quota') || errorString.includes('API key not found')) {
        if (error instanceof Error) throw error;
        throw new Error(errorString);
    }
    
    // Handle 404/NOT_FOUND from the SDK which often indicates a key/project issue for Veo
    if (errorString.includes("404") || errorString.includes("NOT_FOUND")) {
        throw new Error("API key not found or project is not configured for Veo. Please select a valid API key again.");
    }

    if (errorString.includes("403") || errorString.includes("API_KEY_INVALID")) {
        throw new Error('API key is invalid or lacks permissions for the Veo model.');
    }

    throw new Error('Failed to generate video with the AI model.');
  }
};