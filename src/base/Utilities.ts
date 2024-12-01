import fs from 'fs';

export namespace utilities {
    export interface env {
        [key: string]: string;
    }
}

export class utilities {
    /**
     * Checks if the provided Buffer data corresponds to a JPEG file.
     * @param data The file data as a Buffer.
     * @returns Returns true if the data belongs to a JPEG file, false otherwise.
     */
    public static isJpeg(data: Buffer): boolean {
        const jpgStart = data[0] === 0xFF && data[1] === 0xD8;
        // const jpgEnd = data[data.length - 2] === 0xFF && data[data.length - 1] === 0xD9;
        const jpgMarker = data.indexOf(Buffer.from([0xFF, 0xE0])) !== -1 || data.indexOf(Buffer.from([0xFF, 0xE1])) !== -1;
        return (jpgStart /* && jpgEnd */ && jpgMarker);
    }
    /**
     * Checks if the provided Buffer data corresponds to a PNG file.
     * @param data The file data as a Buffer.
     * @returns Returns true if the data belongs to a PNG file, false otherwise.
     */
    public static isPng(data: Buffer): boolean {
        const pngStart = data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47;
        // const pngEnd = data[data.length - 8] === 0x49 && data[data.length - 7] === 0x45 && data[data.length - 6] === 0x4E && data[data.length - 5] === 0x44 && data[data.length - 4] === 0xAE && data[data.length - 3] === 0x42 && data[data.length - 2] === 0x60 && data[data.length - 1] === 0x82;
        return (pngStart /* && pngEnd */);
    }
    /**
     * Checks if the provided Buffer data corresponds to a GIF file.
     * @param data The file data as a Buffer.
     * @returns Returns true if the data belongs to a GIF file, false otherwise.
     */
    public static isGif(data: Buffer): boolean {
        const gifStart = data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46;
        // const gifEnd = data[data.length - 1] === 0x3B;
        return (gifStart /* && gifEnd */);
    }
    /**
     * Detects the image format of the provided Buffer data.
     * @param data The file data as a Buffer.
     * @returns Returns the detected image format as 'jpeg', 'png', 'gif', or null if the format is not recognized.
     */
    public static detectImageFormat(data: Buffer): 'jpeg' | 'png' | 'gif' | null {
        if (this.isJpeg(data)) return 'jpeg';
        if (this.isPng(data)) return 'png';
        if (this.isGif(data)) return 'gif';
        return null;
    }
    /**
     * check if the Buffer data belongs to a jpg file
     * @param data the file data Buffer
     * @returns true if is a jpg file or false if not is a jpg file
     */
    public static isImageFile(data: Buffer, validFormats: ('jpg'|'jpeg'|'png'|'gif')[] = ['jpg', 'jpeg']): boolean {
        let result: boolean = false;
        for (const format of validFormats) switch (format) {
            case 'jpg':
            case 'jpeg': result = result || this.isJpeg(data); break;
            case 'png':  result = result || this.isPng(data);  break;
            case 'gif':  result = result || this.isGif(data);  break;
        }
        return result;
    }
    public static cleanUndefined(object: { [key: string]: any }): { [key: string]: any } {
        const result: { [key: string]: any } = {};
        for (const key in object) {
            if (object[key] !== undefined) result[key] = object[key];
            else if (typeof object[key] === 'object') result[key] = utilities.cleanUndefined(object[key]);
            else if (Array.isArray(object[key])) result[key] = object[key].filter((item: any) => item !== undefined)
        }
        return result;
    }
}
export default utilities;