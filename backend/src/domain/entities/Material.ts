/**
 * Material Domain Entity
 * 
 * Represents learning material in a course (files, text content, or video links).
 * Supports three material types: FILE, TEXT, VIDEO_LINK
 * 
 * Requirements:
 * - 7.1: Upload files to course
 * - 7.2: Add text content with rich text formatting
 * - 7.3: Add video links with URL validation
 * - 7.10: No video file uploads allowed
 * - 7.11: Allow links to external video platforms (YouTube, Vimeo)
 */

export enum MaterialType {
  FILE = 'FILE',
  TEXT = 'TEXT',
  VIDEO_LINK = 'VIDEO_LINK'
}

export interface MaterialProps {
  id: string;
  courseId: string;
  title: string;
  type: MaterialType;
  content?: string;      // For TEXT type: HTML content; For VIDEO_LINK: URL
  filePath?: string;     // For FILE type: path to uploaded file
  fileName?: string;     // For FILE type: original file name
  fileSize?: number;     // For FILE type: file size in bytes
  mimeType?: string;     // For FILE type: MIME type
  createdAt?: Date;
  updatedAt?: Date;
}

export class Material {
  private readonly id: string;
  private readonly courseId: string;
  private title: string;
  private readonly type: MaterialType;
  private content?: string;
  private filePath?: string;
  private fileName?: string;
  private fileSize?: number;
  private mimeType?: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: MaterialProps) {
    this.id = props.id;
    this.courseId = props.courseId;
    this.title = props.title;
    this.type = props.type;
    this.content = props.content;
    this.filePath = props.filePath;
    this.fileName = props.fileName;
    this.fileSize = props.fileSize;
    this.mimeType = props.mimeType;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  /**
   * Create a new Material entity
   * 
   * @param props - Material properties
   * @returns Material instance
   * @throws Error if validation fails
   */
  public static create(props: MaterialProps): Material {
    return new Material(props);
  }

  /**
   * Reconstitute Material from persistence
   * 
   * @param props - Material properties from database
   * @returns Material instance
   */
  public static reconstitute(props: MaterialProps): Material {
    return new Material(props);
  }

  /**
   * Validate Material entity invariants
   * 
   * Requirements:
   * - 7.1: File materials must have filePath
   * - 7.2: Text materials must have content
   * - 7.3: Video link materials must have valid URL
   * - 7.10: No video file uploads (enforced by type)
   * - 7.11: Video links must be external URLs
   * 
   * @throws Error if validation fails
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Material ID is required');
    }

    if (!this.courseId || this.courseId.trim().length === 0) {
      throw new Error('Course ID is required');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Material title is required');
    }

    // Requirement 7.1, 7.2, 7.3: Type validation
    if (!Object.values(MaterialType).includes(this.type)) {
      throw new Error(`Invalid material type: ${this.type}. Must be FILE, TEXT, or VIDEO_LINK`);
    }

    // Type-specific validation
    this.validateTypeSpecificContent();
  }

  /**
   * Validate content based on material type
   * 
   * Requirements:
   * - 7.1: FILE type requires filePath, fileName, fileSize, mimeType
   * - 7.2: TEXT type requires content (HTML)
   * - 7.3: VIDEO_LINK type requires content (URL) and URL validation
   * - 7.11: Video links must be YouTube or Vimeo
   * 
   * @throws Error if type-specific validation fails
   */
  private validateTypeSpecificContent(): void {
    switch (this.type) {
      case MaterialType.FILE:
        // Requirement 7.1: FILE type must have file metadata
        if (!this.filePath || this.filePath.trim().length === 0) {
          throw new Error('File path is required for FILE type material');
        }
        if (!this.fileName || this.fileName.trim().length === 0) {
          throw new Error('File name is required for FILE type material');
        }
        if (this.fileSize === undefined || this.fileSize === null || this.fileSize <= 0) {
          throw new Error('File size is required for FILE type material');
        }
        if (!this.mimeType || this.mimeType.trim().length === 0) {
          throw new Error('MIME type is required for FILE type material');
        }
        break;

      case MaterialType.TEXT:
        // Requirement 7.2: TEXT type must have content
        if (!this.content || this.content.trim().length === 0) {
          throw new Error('Content is required for TEXT type material');
        }
        break;

      case MaterialType.VIDEO_LINK:
        // Requirement 7.3, 7.11: VIDEO_LINK type must have valid URL
        if (!this.content || this.content.trim().length === 0) {
          throw new Error('URL is required for VIDEO_LINK type material');
        }
        this.validateVideoUrl(this.content);
        break;
    }
  }

  /**
   * Validate video URL format and platform
   * 
   * Requirements:
   * - 7.3: Validate URL format
   * - 7.11: Only YouTube and Vimeo links allowed
   * 
   * @param url - Video URL to validate
   * @throws Error if URL is invalid or not from allowed platform
   */
  private validateVideoUrl(url: string): void {
    // Basic URL format validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('Invalid URL format for video link');
    }

    // Requirement 7.11: Only YouTube and Vimeo allowed
    const hostname = parsedUrl.hostname.toLowerCase();
    const isYouTube = hostname.includes('youtube.com') || hostname.includes('youtu.be');
    const isVimeo = hostname.includes('vimeo.com');

    if (!isYouTube && !isVimeo) {
      throw new Error('Video links must be from YouTube or Vimeo');
    }

    // Must use HTTPS
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('Video links must use HTTPS protocol');
    }
  }

  /**
   * Update material title
   * 
   * Requirements:
   * - 7.7: Allow teachers to edit existing materials
   * 
   * @param title - New material title
   * @throws Error if title is empty
   */
  public updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Material title is required');
    }

    this.title = title;
    this.updatedAt = new Date();
  }

  /**
   * Update text content
   * 
   * Requirements:
   * - 7.7: Allow teachers to edit existing materials
   * - 7.2: Text content with rich text formatting
   * 
   * @param content - New HTML content
   * @throws Error if material is not TEXT type or content is empty
   */
  public updateTextContent(content: string): void {
    if (this.type !== MaterialType.TEXT) {
      throw new Error('Can only update content for TEXT type materials');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('Content is required for TEXT type material');
    }

    this.content = content;
    this.updatedAt = new Date();
  }

  /**
   * Update video link URL
   * 
   * Requirements:
   * - 7.7: Allow teachers to edit existing materials
   * - 7.3: Validate URL format
   * - 7.11: Only YouTube and Vimeo links
   * 
   * @param url - New video URL
   * @throws Error if material is not VIDEO_LINK type or URL is invalid
   */
  public updateVideoUrl(url: string): void {
    if (this.type !== MaterialType.VIDEO_LINK) {
      throw new Error('Can only update URL for VIDEO_LINK type materials');
    }

    if (!url || url.trim().length === 0) {
      throw new Error('URL is required for VIDEO_LINK type material');
    }

    this.validateVideoUrl(url);
    this.content = url;
    this.updatedAt = new Date();
  }

  /**
   * Update file metadata (for file replacement)
   * 
   * Requirements:
   * - 7.7: Allow teachers to edit existing materials
   * - 7.1: File upload
   * 
   * @param filePath - New file path
   * @param fileName - New file name
   * @param fileSize - New file size
   * @param mimeType - New MIME type
   * @throws Error if material is not FILE type or metadata is invalid
   */
  public updateFile(filePath: string, fileName: string, fileSize: number, mimeType: string): void {
    if (this.type !== MaterialType.FILE) {
      throw new Error('Can only update file for FILE type materials');
    }

    if (!filePath || filePath.trim().length === 0) {
      throw new Error('File path is required');
    }
    if (!fileName || fileName.trim().length === 0) {
      throw new Error('File name is required');
    }
    if (fileSize === undefined || fileSize === null || fileSize <= 0) {
      throw new Error('File size must be positive');
    }
    if (!mimeType || mimeType.trim().length === 0) {
      throw new Error('MIME type is required');
    }

    this.filePath = filePath;
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.mimeType = mimeType;
    this.updatedAt = new Date();
  }

  /**
   * Check if material is a file
   * 
   * @returns true if material type is FILE
   */
  public isFile(): boolean {
    return this.type === MaterialType.FILE;
  }

  /**
   * Check if material is text content
   * 
   * @returns true if material type is TEXT
   */
  public isText(): boolean {
    return this.type === MaterialType.TEXT;
  }

  /**
   * Check if material is a video link
   * 
   * @returns true if material type is VIDEO_LINK
   */
  public isVideoLink(): boolean {
    return this.type === MaterialType.VIDEO_LINK;
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getCourseId(): string {
    return this.courseId;
  }

  public getTitle(): string {
    return this.title;
  }

  public getType(): MaterialType {
    return this.type;
  }

  public getContent(): string | undefined {
    return this.content;
  }

  public getFilePath(): string | undefined {
    return this.filePath;
  }

  public getFileName(): string | undefined {
    return this.fileName;
  }

  public getFileSize(): number | undefined {
    return this.fileSize;
  }

  public getMimeType(): string | undefined {
    return this.mimeType;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Convert entity to plain object
   * 
   * @returns Plain object representation
   */
  public toObject(): MaterialProps {
    return {
      id: this.id,
      courseId: this.courseId,
      title: this.title,
      type: this.type,
      content: this.content,
      filePath: this.filePath,
      fileName: this.fileName,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
