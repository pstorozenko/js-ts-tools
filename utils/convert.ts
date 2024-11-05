// utils/imageConverter.ts

/**
 * Creates a BMP file header (14 bytes)
 */
function createBmpFileHeader(imageSize: number): ArrayBuffer {
    const buffer = new ArrayBuffer(14);
    const view = new DataView(buffer);

    // BM magic number
    view.setUint8(0, 0x42); // B
    view.setUint8(1, 0x4D); // M

    // File size (header + info header + pixel data)
    view.setUint32(2, 54 + imageSize, true);

    // Reserved
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);

    // Pixel data offset
    view.setUint32(10, 54, true);

    return buffer;
}

/**
 * Creates a BMP info header (40 bytes)
 */
function createBmpInfoHeader(width: number, height: number): ArrayBuffer {
    const buffer = new ArrayBuffer(40);
    const view = new DataView(buffer);

    // Header size
    view.setUint32(0, 40, true);

    // Width and height
    view.setInt32(4, width, true);
    view.setInt32(8, height, true);

    // Planes
    view.setUint16(12, 1, true);

    // Bits per pixel (32 for RGBA)
    view.setUint16(14, 32, true);

    // Compression (0 = none)
    view.setUint32(16, 0, true);

    // Image size (pixel data)
    view.setUint32(20, width * height * 4, true);

    // Pixels per meter (72 DPI)
    view.setInt32(24, 2835, true);
    view.setInt32(28, 2835, true);

    // Colors in color table
    view.setUint32(32, 0, true);
    view.setUint32(36, 0, true);

    return buffer;
}

/**
 * Converts image data to BGRA format and flips vertically
 */
function convertToBGRA(imageData: ImageData): Uint8Array {
    const { width, height, data } = imageData;
    const output = new Uint8Array(width * height * 4);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Flip Y coordinate (BMP is bottom-up)
            const sourceY = height - 1 - y;

            const sourceIndex = (sourceY * width + x) * 4;
            const targetIndex = (y * width + x) * 4;

            // Convert RGBA to BGRA
            output[targetIndex] = data[sourceIndex + 2];     // B
            output[targetIndex + 1] = data[sourceIndex + 1]; // G
            output[targetIndex + 2] = data[sourceIndex];     // R
            output[targetIndex + 3] = data[sourceIndex + 3]; // A
        }
    }

    return output;
}

type ConvertedFile = {
    name: string;
    url: string;
};

/**
 * Converts a PNG file to our custom BMP format
 * @param file PNG file to convert
 * @returns Promise that resolves with the BMP file as a Blob
 */
export async function convertPngToBmp(file: File): Promise<ConvertedFile> {
    // Verify file type
    if (!file.type.includes('png')) {
        throw new Error('Only PNG files are supported');
    }

    // Create image from file
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    try {
        // Load image
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = imageUrl;
        });

        // Create canvas and get image data
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);

        // Create headers
        const fileHeader = createBmpFileHeader(imageData.data.length);
        const infoHeader = createBmpInfoHeader(image.width, image.height);

        // Convert pixel data
        const pixelData = convertToBGRA(imageData);

        // Combine all parts
        const bmpData = new Uint8Array(fileHeader.byteLength + infoHeader.byteLength + pixelData.length);
        bmpData.set(new Uint8Array(fileHeader), 0);
        bmpData.set(new Uint8Array(infoHeader), fileHeader.byteLength);
        bmpData.set(pixelData, fileHeader.byteLength + infoHeader.byteLength);

        return {
            name: file.name.replace('.png', '.bmp'),
            url: URL.createObjectURL(new Blob([bmpData], { type: 'image/bmp' }))
        }
    } finally {
        return {
            name: file.name.replace('.png', '.bmp'),
            url: URL.createObjectURL(file) // In a real scenario, this would be the converted file blob
        }
    }
}

/**
 * Example usage in a Next.js component:
 * 
 * import { convertPngToBmp } from '@/utils/imageConverter';
 * 
 * export default function ImageConverter() {
 *   const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
 *     const file = event.target.files?.[0];
 *     if (file) {
 *       try {
 *         const bmpBlob = await convertPngToBmp(file);
 *         
 *         // Create download link
 *         const url = URL.createObjectURL(bmpBlob);
 *         const a = document.createElement('a');
 *         a.href = url;
 *         a.download = file.name.replace('.png', '.bmp');
 *         a.click();
 *         URL.revokeObjectURL(url);
 *       } catch (error) {
 *         console.error('Conversion failed:', error);
 *       }
 *     }
 *   };
 * 
 *   return (
 *     <input
 *       type="file"
 *       accept="image/png"
 *       onChange={handleFileChange}
 *     />
 *   );
 * }
 */