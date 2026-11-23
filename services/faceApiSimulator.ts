// A more realistic, albeit still simulated, facial recognition service.

// --- Configuration ---
const CONFIDENCE_THRESHOLD = 0.92; // Cosine similarity is more precise, so we can use a higher threshold.
const EMBEDDING_VECTOR_SIZE = 128; // Increased complexity for the facial signature

// --- Failure Reasons ---
const FAILURE_REASON = {
    POOR_LIGHTING: 'Image is too dark or too bright.',
    BLURRY_IMAGE: 'Image is blurry or out of focus.',
    SPOOF_DETECTED: 'Potential spoof attempt detected (e.g., photo of a screen).',
    NOT_A_MATCH: 'Facial features do not match the reference profile.',
    LIVENESS_FAIL: 'Liveness check failed: Captured image is identical to reference profile.',
};

// --- Helper Functions ---

/**
 * Simulates creating a more complex facial embedding vector from image data.
 * This version is more robust, averaging a small window of data points to create a "fuzzier"
 * signature that is less sensitive to minor, pixel-level changes between photos.
 * @param {string} imageDataUrl The base64 image data.
 * @returns {number[]} A numerical array representing the "face".
 */
const _generateEmbedding = (imageDataUrl: string): number[] => {
  const vector = new Array(EMBEDDING_VECTOR_SIZE).fill(0);
  const len = imageDataUrl.length;
  const windowSize = 5; // The number of characters to average for each data point.

  for (let i = 0; i < EMBEDDING_VECTOR_SIZE; i++) {
    const salt = i * 101; // Use a salt to get different parts of the string
    const baseIndex = Math.floor((len * i) / EMBEDDING_VECTOR_SIZE + salt) % len;
    
    let sumOfCharCodes = 0;
    for (let j = 0; j < windowSize; j++) {
      const charIndex = (baseIndex + j) % len;
      sumOfCharCodes += imageDataUrl.charCodeAt(charIndex) || 0;
    }
    
    const avgCharCode = sumOfCharCodes / windowSize;
    const val = avgCharCode % 100;
    vector[i] = val;
  }
  
  // Add overall length as a factor to one of the vector dimensions
  vector[EMBEDDING_VECTOR_SIZE - 1] = (vector[EMBEDDING_VECTOR_SIZE - 1] + (len % 100)) / 2;
  return vector;
};

/**
 * Calculates the Cosine Similarity between two vectors.
 * Returns a value between -1 and 1 (or 0 and 1 for non-negative vectors).
 * A value closer to 1 indicates a higher similarity.
 * @param {number[]} vecA First embedding.
 * @param {number[]} vecB Second embedding.
 * @returns {number} The cosine similarity score.
 */
const _calculateCosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) {
    return 0; // Avoid division by zero
  }
  return dotProduct / (magA * magB);
};


/**
 * Gets the average brightness of an image.
 * @param {string} imageDataUrl The base64 image data.
 * @returns {Promise<number>} A value from 0 (black) to 255 (white).
 */
const _getImageBrightness = (imageDataUrl: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageDataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scaleFactor = 0.1; // Analyze a smaller version for performance
            canvas.width = img.width * scaleFactor;
            canvas.height = img.height * scaleFactor;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(128); // Return average brightness if context fails
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let sum = 0;

            for(let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                sum += (0.299 * r + 0.587 * g + 0.114 * b);
            }

            resolve(sum / (data.length / 4));
        };
        img.onerror = () => reject('Could not load image to analyze brightness.');
    });
};

/**
 * Simulates a sharpness/blur detection algorithm.
 * High variance in pixel data often correlates with a sharper image.
 * @param {string} imageDataUrl The base64 image data.
 * @returns {number} A sharpness score from 0 (blurry) to 1 (sharp).
 */
const _getSimulatedSharpness = (imageDataUrl: string): number => {
    let variance = 0;
    const sampleSize = 1000;
    const step = Math.floor(imageDataUrl.length / sampleSize);
    const samples: number[] = [];

    if (step < 1) return 0.5; // Image too small to analyze

    for (let i = 0; i < imageDataUrl.length; i += step) {
        samples.push(imageDataUrl.charCodeAt(i));
    }
    
    if (samples.length < 2) return 0.5;

    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
    
    // Normalize to a 0-1 range. These values are arbitrary and tuned for simulation.
    const normalizedSharpness = Math.min(1, variance / 500); 
    return normalizedSharpness;
};


/**
 * Simulates detecting a photo of a screen or other spoofing attempts by combining multiple indicators.
 * @param {string} imageDataUrl The base64 image data.
 * @returns {number} A combined spoof likelihood score from 0 (likely real) to 1 (likely spoof).
 */
const _getSimulatedSpoofLikelihood = (imageDataUrl: string): number => {
    let likelihood = 0.0;
    const reasons: string[] = [];

    // Check 1: Low Complexity / Blank Image (NEW - HIGHEST PRIORITY)
    // This is the most effective check against simple, non-photographic images like a blank wall.
    const complexitySampleSize = 1000;
    if (imageDataUrl.length > complexitySampleSize) {
        const start = Math.floor(imageDataUrl.length / 3); // Sample from the middle of the string
        const sample = imageDataUrl.substring(start, start + complexitySampleSize);
        const uniqueChars = new Set(sample.split('')).size;
        const complexityRatio = uniqueChars / sample.length;
        
        // A real photo's base64 is very diverse. A low ratio indicates a simple, uniform image.
        if (complexityRatio < 0.04) { // Tuned to be very sensitive to simple images
            likelihood = 0.95; // Immediately flag as highly likely spoof
            reasons.push(`low complexity (ratio: ${complexityRatio.toFixed(3)})`);
        }
    }

    // If low complexity check passed, proceed with other, more nuanced checks.
    if (likelihood < 0.9) {
        // Check 2: Uniform Color Blocks (indicates a screen background)
        const solidBlockMatch = imageDataUrl.match(/(.)\1{200,}/); // 200+ identical characters is highly suspicious
        if (solidBlockMatch) {
            likelihood += 0.8; 
            reasons.push('uniform color block');
        }

        // Check 3: Unnatural Reflections (indicates glare from a screen)
        // Base64's '/' character is high-value and often appears in clusters for pure white areas.
        const reflectionMatch = imageDataUrl.match(/\/{5,}/); // 5 or more slashes in a row
        if (reflectionMatch) {
            likelihood += 0.5;
            reasons.push('unnatural screen glare');
        }

        // Check 4: Lack of Depth/Flatness (indicates a photo)
        // Low variance in pixel data can indicate a flat, uniformly lit photo of a face.
        const sampleSize = 2000;
        if (imageDataUrl.length > sampleSize) {
            const step = Math.floor(imageDataUrl.length / sampleSize);
            const samples: number[] = [];
            for (let i = 0; i < imageDataUrl.length; i += step) {
                samples.push(imageDataUrl.charCodeAt(i));
            }

            if(samples.length > 1) {
                const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
                const stdDev = Math.sqrt(samples.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (samples.length - 1));

                // A low standard deviation suggests less variation in color and shadow -> flatter image.
                if (stdDev < 18) { 
                    likelihood += 0.4;
                    reasons.push(`low pixel variance (stdDev: ${stdDev.toFixed(2)})`);
                }
            }
        }
    }
    
    const finalLikelihood = Math.min(0.95, likelihood);

    if (finalLikelihood > 0.1) {
         console.warn(`Spoof Likelihood Analysis: ${finalLikelihood.toFixed(2)}. Reasons: [${reasons.join(', ')}]`);
    }

    // Add a small baseline random noise so it's not always zero for perfect images.
    return finalLikelihood > 0 ? finalLikelihood : Math.random() * 0.05;
};


export const faceApiSimulator = {
  /**
   * Compares a captured photo against an array of reference photos.
   * @param {string} capturedPhotoUrl The newly captured photo.
   * @param {string[]} referencePhotoUrls The stored reference photos.
   * @param {boolean} forceFailure A flag for demo purposes to force a mismatch.
   * @returns {Promise<{ match: boolean; confidence: number; failureReason?: string; }>}
   */
  compare: async (
    capturedPhotoUrl: string,
    referencePhotoUrls: string[],
    forceFailure: boolean = false,
  ): Promise<{ match: boolean, confidence: number, failureReason?: string }> => {
    console.log('Simulating advanced facial recognition with quality checks...');
    const reasons: string[] = [];
    
    await new Promise(res => setTimeout(res, 1500)); // Simulate network and processing delay

    // --- Liveness & Spoof Checks (run these first) ---
    if (referencePhotoUrls.includes(capturedPhotoUrl)) {
        console.warn('Liveness check failed: Captured image is identical to a reference photo.');
        return { match: false, confidence: 0, failureReason: FAILURE_REASON.LIVENESS_FAIL };
    }
    
    const spoofLikelihood = _getSimulatedSpoofLikelihood(capturedPhotoUrl);
    // A combined score over 0.7 indicates a high probability of being a spoof.
    if (spoofLikelihood > 0.7) {
        return { match: false, confidence: 1 - spoofLikelihood, failureReason: FAILURE_REASON.SPOOF_DETECTED };
    }


    if (forceFailure) {
        const confidence = 0.1 + Math.random() * 0.2; // Low confidence
        console.log('Facial recognition SIMULATED FAILURE.');
        return { match: false, confidence, failureReason: FAILURE_REASON.NOT_A_MATCH };
    }
    
    // --- Core Biometric Comparison ---
    const capEmbedding = _generateEmbedding(capturedPhotoUrl);
    let bestConfidence = 0;

    for (const refUrl of referencePhotoUrls) {
        const refEmbedding = _generateEmbedding(refUrl);
        // Use Cosine Similarity for a more robust comparison
        const confidence = _calculateCosineSimilarity(refEmbedding, capEmbedding);
        if (confidence > bestConfidence) {
            bestConfidence = confidence;
        }
    }
    
    console.log(`Best similarity match initial confidence: ${(bestConfidence * 100).toFixed(2)}%`);

    // --- Quality & Environmental Checks ---
    let qualityPenalty = 1.0;

    // 1. Brightness check
    try {
        const brightness = await _getImageBrightness(capturedPhotoUrl);
        console.log(`Image brightness: ${brightness.toFixed(2)}`);
        if (brightness < 50 || brightness > 200) { // Too dark or too bright
            qualityPenalty *= 0.7; // Penalize by 30%
            reasons.push(FAILURE_REASON.POOR_LIGHTING);
            console.log('Confidence penalized due to poor lighting.');
        }
    } catch(e) {
        console.error(e);
        qualityPenalty *= 0.9; // Penalize if analysis fails
    }

    // 2. Sharpness check
    const sharpness = _getSimulatedSharpness(capturedPhotoUrl);
    console.log(`Simulated sharpness: ${sharpness.toFixed(2)}`);
    if (sharpness < 0.3) { // Image is likely blurry
        qualityPenalty *= 0.6; // Heavy penalty for blur
        reasons.push(FAILURE_REASON.BLURRY_IMAGE);
        console.log('Confidence penalized due to blurriness.');
    }
    
    // Apply penalties
    const finalConfidence = bestConfidence * qualityPenalty;
    
    const match = finalConfidence >= CONFIDENCE_THRESHOLD;
    
    console.log(`Final Confidence: ${(finalConfidence * 100).toFixed(2)}%`);
    console.log(`Match Result: ${match}`);
    
    let failureReason: string | undefined = undefined;
    if (!match) {
        // Prioritize the most likely reason for failure
        failureReason = reasons.length > 0 ? reasons.join(' ') : FAILURE_REASON.NOT_A_MATCH;
    }

    return { match, confidence: finalConfidence, failureReason };
  },
};