
export const extractFrame = (videoUrl: string, time: number = 0.1): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous'; // To avoid tainted canvas issues
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return reject(new Error('Could not get canvas context.'));
    }

    video.addEventListener('loadeddata', () => {
      video.currentTime = time;
    });

    video.addEventListener('seeked', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      URL.revokeObjectURL(video.src); // Clean up object URL
      resolve(dataUrl);
    });

    video.addEventListener('error', (e) => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Error loading video file.'));
    });
    
    video.src = videoUrl;
    video.load();
  });
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as Data URL.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
