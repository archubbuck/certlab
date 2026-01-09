# Multiple Content Types Support

## Overview

CertLab now supports multiple content types for learning materials, providing a comprehensive and flexible learning experience. This feature enables creation and delivery of various types of educational content beyond simple text-based materials.

## Supported Content Types

### 1. Text (Markdown)

**Description**: Traditional text-based study materials with markdown formatting support.

**Features**:
- Full markdown support (headers, lists, bold, italic, etc.)
- Code blocks with syntax highlighting
- Mathematical formulas (LaTeX)
- Diagrams (Mermaid)
- Accessible text rendering for screen readers

**Use Cases**:
- Study guides
- Lecture notes
- Reference materials
- Explanatory content

**Example**:
```markdown
## Security Principles

### CIA Triad
1. **Confidentiality**: Ensuring data is accessible only to authorized users
2. **Integrity**: Maintaining data accuracy and consistency
3. **Availability**: Ensuring systems and data are accessible when needed
```

---

### 2. Video Content

**Description**: Video-based learning materials with embedded player support.

**Supported Providers**:
- YouTube
- Vimeo
- Uploaded video files

**Features**:
- Embedded video player
- Video duration tracking
- Thumbnail support
- Provider-specific optimizations
- Accessibility features:
  - Closed captions/subtitles
  - Transcripts
  - Audio descriptions
- Open in new tab option

**Use Cases**:
- Video lectures
- Tutorial demonstrations
- Expert interviews
- Concept explanations
- Certification prep videos

**Example Fields**:
```typescript
{
  contentType: 'video',
  videoUrl: 'https://youtube.com/watch?v=abc123',
  videoProvider: 'youtube',
  videoDuration: 1800, // 30 minutes in seconds
  accessibilityFeatures: {
    hasClosedCaptions: true,
    hasTranscript: true
  }
}
```

---

### 3. PDF Documents

**Description**: In-app PDF rendering for document-based learning materials.

**Features**:
- Embedded PDF viewer
- Page navigation (next/previous)
- Page count display
- File size information
- Download capability
- Thumbnail preview

**Accessibility**:
- Alt text descriptions
- Screen reader compatible
- Keyboard navigation support

**Use Cases**:
- Official study guides
- Reference documentation
- Certification handbooks
- Research papers
- Practice exam question sets

**Example Fields**:
```typescript
{
  contentType: 'pdf',
  pdfUrl: 'https://example.com/cissp-study-guide.pdf',
  pdfPages: 350,
  fileSize: 15728640, // 15 MB in bytes
  accessibilityFeatures: {
    altText: 'CISSP Official Study Guide - 9th Edition'
  }
}
```

---

### 4. Interactive Content

**Description**: Embedded interactive widgets, code playgrounds, and quizzes.

**Supported Interactive Types**:
- **Code**: Interactive code editors and playgrounds (e.g., CodePen, JSFiddle)
- **Widget**: Interactive learning widgets and simulations
- **Quiz**: Embedded quiz experiences

**Features**:
- Sandboxed iframe for security
- Full-screen option
- Open in new tab capability
- Instructions/description support

**Use Cases**:
- Live coding exercises
- Interactive simulations
- Embedded practice quizzes
- Concept visualizations
- Security lab environments

**Example Fields**:
```typescript
{
  contentType: 'interactive',
  interactiveUrl: 'https://codepen.io/example/pen/xyz',
  interactiveType: 'code',
  description: 'Practice implementing a secure authentication flow'
}
```

---

### 5. Code Examples

**Description**: Syntax-highlighted code snippets with language-specific formatting.

**Supported Languages**:
- JavaScript
- TypeScript
- Python
- Java
- C#
- Go
- Rust
- Ruby
- PHP
- Swift
- Kotlin
- SQL
- Bash
- HTML/CSS
- JSON/XML/YAML

**Features**:
- Syntax highlighting
- Copy to clipboard functionality
- Language badge display
- Code explanations
- Line numbering (optional)

**Use Cases**:
- Code demonstrations
- Algorithm implementations
- Best practice examples
- Security code patterns
- Configuration examples

**Example Fields**:
```typescript
{
  contentType: 'code',
  codeLanguage: 'python',
  codeContent: `
def encrypt_data(data, key):
    """
    Encrypts data using AES-256 encryption
    """
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(data)
    return cipher.nonce + tag + ciphertext
  `,
  hasCodeHighlighting: true,
  description: 'Example of secure data encryption using AES-256-GCM'
}
```

---

## Data Storage

All learning materials are stored in Firestore with the following structure:

### Lecture Schema

```typescript
interface Lecture {
  // Basic fields
  id: number;
  userId: string;
  tenantId: number;
  title: string;
  description: string | null;
  content: string;
  categoryId: number;
  subcategoryId: number | null;
  difficultyLevel: number; // 1-5
  tags: string[];
  topics: string[];
  
  // Content type fields
  contentType: 'text' | 'video' | 'pdf' | 'interactive' | 'code';
  
  // Video-specific fields
  videoUrl: string | null;
  videoProvider: 'youtube' | 'vimeo' | 'upload' | null;
  videoDuration: number | null; // seconds
  
  // PDF-specific fields
  pdfUrl: string | null;
  pdfPages: number | null;
  
  // Interactive-specific fields
  interactiveUrl: string | null;
  interactiveType: 'code' | 'widget' | 'quiz' | null;
  
  // Code-specific fields
  codeLanguage: string | null;
  codeContent: string | null;
  hasCodeHighlighting: boolean;
  
  // Common fields
  thumbnailUrl: string | null;
  fileSize: number | null; // bytes
  
  // Accessibility
  accessibilityFeatures: {
    hasTranscript?: boolean;
    hasClosedCaptions?: boolean;
    hasAudioDescription?: boolean;
    altText?: string;
  } | null;
  
  // Metadata
  author: string | null;
  authorName: string | null;
  prerequisites: { quizIds?: number[]; lectureIds?: number[] } | null;
  createdAt: Date;
  updatedAt: Date | null;
  isRead: boolean;
}
```

---

## User Interface Components

### 1. ContentRenderer Component

**Location**: `/client/src/components/ContentRenderer.tsx`

**Purpose**: Renders learning materials based on their content type.

**Features**:
- Type-specific rendering
- Accessibility controls
- Navigation controls (for PDF)
- Video player controls
- Code copy functionality
- Responsive design
- Dark mode support

**Usage**:
```tsx
import { ContentRenderer } from '@/components/ContentRenderer';

<ContentRenderer lecture={lecture} />
```

---

### 2. MaterialEditor Component

**Location**: `/client/src/components/MaterialEditor.tsx`

**Purpose**: Create and edit learning materials with any content type.

**Features**:
- Content type selection
- Type-specific form fields
- Validation
- Tag and topic management
- Category and subcategory selection
- Difficulty level setting
- Accessibility options
- Preview capability

**Usage**:
```tsx
import { MaterialEditor } from '@/components/MaterialEditor';

<MaterialEditor
  initialData={lecture}
  onSave={handleSave}
  onCancel={handleCancel}
  categories={categories}
  subcategories={subcategories}
/>
```

---

## Accessibility Features

### Video Content
- ✅ Closed captions/subtitles support
- ✅ Transcript availability
- ✅ Audio descriptions
- ✅ Keyboard controls
- ✅ Screen reader announcements

### PDF Documents
- ✅ Alt text descriptions
- ✅ Keyboard navigation
- ✅ Text-to-speech compatibility
- ✅ Zoom controls

### Code Examples
- ✅ Syntax highlighting for readability
- ✅ Code explanation text
- ✅ Copy functionality
- ✅ Screen reader compatible

### Interactive Content
- ✅ Descriptive instructions
- ✅ Keyboard accessible
- ✅ Alternative text descriptions

---

## Validation Rules

### General
- Title: 1-500 characters (required)
- Description: 0-2000 characters
- Content: 10-50,000 characters
- Tags: Max 50 tags, 50 chars each
- Topics: Min 1 topic, max 50 topics, 100 chars each
- Difficulty: 1-5 (integer)

### Video
- URL: Valid URL, max 1000 chars (required)
- Provider: Must be 'youtube', 'vimeo', or 'upload'
- Duration: 1-36000 seconds (10 hours)

### PDF
- URL: Valid URL, max 1000 chars (required)
- Pages: 1-10,000 pages
- File size: 0-1GB (1,073,741,824 bytes)

### Interactive
- URL: Valid URL, max 1000 chars (required)
- Type: Must be 'code', 'widget', or 'quiz'

### Code
- Language: Max 50 chars (required)
- Content: 10-50,000 chars (required)

---

## API Examples

### Creating a Video Lecture

```typescript
import { storage } from '@/lib/storage-factory';

const videoLecture = await storage.createLecture(
  userId,
  quizId,
  'Introduction to Cryptography',
  'Learn the fundamentals of cryptography in this comprehensive video.',
  ['cryptography', 'security', 'encryption'],
  categoryId,
  tenantId
);

// Update with video-specific fields
await storage.updateLecture(videoLecture.id, {
  contentType: 'video',
  videoUrl: 'https://youtube.com/watch?v=abc123',
  videoProvider: 'youtube',
  videoDuration: 2400,
  accessibilityFeatures: {
    hasClosedCaptions: true,
    hasTranscript: true
  }
});
```

### Creating a Code Example

```typescript
const codeExample = await storage.createLecture(
  userId,
  quizId,
  'Secure Password Hashing',
  'Example code for hashing passwords securely',
  ['security', 'authentication', 'hashing'],
  categoryId,
  tenantId
);

await storage.updateLecture(codeExample.id, {
  contentType: 'code',
  codeLanguage: 'python',
  codeContent: `
import bcrypt

def hash_password(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt)
  `,
  hasCodeHighlighting: true
});
```

---

## Testing Guidelines

### Device Testing
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Tablet devices (iPad, Android tablets)
- ✅ Mobile devices (iPhone, Android phones)
- ✅ Different screen sizes and orientations

### Content Type Testing
- ✅ Text rendering with various markdown elements
- ✅ Video playback from all providers
- ✅ PDF navigation and download
- ✅ Interactive content loading and interaction
- ✅ Code syntax highlighting for all languages

### Accessibility Testing
- ✅ Screen reader compatibility (NVDA, JAWS, VoiceOver)
- ✅ Keyboard navigation
- ✅ Closed caption functionality
- ✅ Transcript availability
- ✅ Color contrast ratios
- ✅ Focus indicators

### Performance Testing
- ✅ Large PDF loading times
- ✅ Video streaming quality
- ✅ Code highlighting performance
- ✅ Interactive content responsiveness

---

## Best Practices

### Content Creation
1. **Choose the right content type** for the learning objective
2. **Provide descriptions** for all materials
3. **Add accessibility features** (captions, transcripts, alt text)
4. **Use appropriate difficulty levels** for proper categorization
5. **Tag content** with relevant keywords for searchability

### Video Content
1. Use **high-quality videos** with clear audio
2. Provide **closed captions** for all videos
3. Include **transcripts** for searchability and accessibility
4. Keep videos **under 30 minutes** for better engagement
5. Add **chapter markers** in descriptions

### PDF Documents
1. Ensure PDFs are **text-based**, not scanned images
2. Provide **descriptive alt text**
3. Keep file sizes **reasonable** (under 50MB)
4. Use **searchable PDFs** when possible

### Code Examples
1. Include **comments** explaining the code
2. Use **proper indentation** and formatting
3. Provide **context** in the description
4. Show **complete, runnable** examples
5. Highlight **security best practices**

### Interactive Content
1. Test in **sandboxed environment** first
2. Provide **clear instructions** for use
3. Ensure **mobile compatibility**
4. Include **fallback content** if iframe fails

---

## Future Enhancements

### Planned Features
1. **Audio-only content** support (podcasts, audio lectures)
2. **SCORM package** support for e-learning standards
3. **H5P interactive content** integration
4. **Live streaming** capability
5. **AR/VR content** support
6. **Collaborative editing** for materials
7. **Version control** for content updates
8. **Content recommendations** based on learning patterns
9. **Offline content caching** for mobile apps
10. **Auto-generated captions** for videos

### Integration Ideas
1. Integration with **learning management systems** (LMS)
2. **YouTube playlist** import
3. **GitHub Gists** for code examples
4. **SlideShare** presentation embedding
5. **Notion/Confluence** documentation import

---

## Troubleshooting

### Video Not Playing
- Verify the URL is correct and publicly accessible
- Check if the video provider is supported
- Ensure the video isn't restricted by region or privacy settings
- Try opening the video in a new tab

### PDF Not Rendering
- Verify the PDF URL is accessible
- Check file size (large PDFs may take time to load)
- Ensure PDF is not password-protected
- Try downloading the PDF directly

### Interactive Content Not Loading
- Check if the URL is correct
- Verify the content allows iframe embedding
- Check browser console for security errors
- Try opening in a new tab

### Code Not Highlighting
- Verify the language is specified
- Check if the language is in the supported list
- Ensure code syntax is valid
- Clear browser cache and reload

---

## Support

For issues or questions about multiple content types:

1. Check this documentation
2. Review the [main README](../README.md)
3. Check the [FEATURES documentation](../FEATURES.md)
4. Open an issue on GitHub with:
   - Content type being used
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

---

## Contributing

When contributing to content type features:

1. **Follow existing patterns** in ContentRenderer and MaterialEditor
2. **Add validation** for new fields
3. **Update TypeScript types** in schema.ts
4. **Add accessibility features** for new content types
5. **Write tests** for new functionality
6. **Update documentation** with examples
7. **Test on multiple devices** and browsers

---

## License

This feature is part of CertLab and follows the same MIT license.
