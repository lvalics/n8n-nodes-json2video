import type { IDataObject } from 'n8n-workflow';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Registry of all available templates by category
 */
type TemplateCategory = keyof typeof templateRegistry;

/**
 * Registry of all available templates by category
 */
export const templateRegistry = {
  basic: {
    'hello-world': 'Hello World - Simple Text Animation',
    'image-slideshow': 'Image Slideshow - Transitions Between Images',
    'video-with-text-overlay': 'Video with Text Overlay - Basic Text Over Video',
    'video-with-watermark': 'Video with Watermark - Add Logo or Watermark',
  },
  marketing: {
    'black-friday-promo': 'Black Friday Promo - Sale Announcement',
    'corporate-video': 'Corporate Video - Professional Presentation',
    'event-agenda': 'Event Agenda - Schedule Presentation',
    'event-speakers': 'Event Speakers - Speaker Profiles',
    'motivational': 'Motivational - Inspirational Quote Card',
    'promo': 'Promo - Variables Template with Call to Action',
    'quote': 'Quote - Quotation with Background',
    'real-estate': 'Real Estate - Property Presentation (Landscape)',
    'real-estate-2': 'Real Estate Story - Property Tour (Portrait)', 
    'slide-text-left': 'Slide Text Left - Animated Text Entrance',
  },
  news: {
    'cnn-lower-third': 'CNN Style Lower Third - News Caption',
    'one-line-lower-third': 'One Line Lower Third - Simple News Caption',
  },
};

/**
 * Get list of all template categories
 */
export function getTemplateCategories(): Array<{name: string, value: string}> {
  return Object.keys(templateRegistry).map(category => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: category,
  }));
}

/**
 * Get list of templates for a given category
 */
export function getTemplatesForCategory(category: string): Array<{name: string, value: string}> {
  // Use type assertion to tell TypeScript that category is a valid key
  const templates = templateRegistry[category as TemplateCategory];
  
  if (!templates) {
    return [];
  }
  
  return Object.entries(templates).map(([value, name]) => ({
    name: name as string,
    value,
  }));
}

/**
 * Load a template by category and name
 */
export function loadTemplate(category: string, name: string): IDataObject {
  try {
    console.log(`Attempting to load template: ${category}/${name}`);
    
    // Try multiple paths to locate the template
    const possiblePaths = [
      // Path 1: Development path relative to the current file
      path.join(__dirname, '..', '..', 'templates', category, `${name}.json`),
      
      // Path 2: Production path if templateLoader is in dist/nodes/JSON2Video
      path.join(__dirname, '..', '..', '..', 'templates', category, `${name}.json`),
      
      // Path 3: Path relative to dist folder
      path.join(process.cwd(), 'dist', 'templates', category, `${name}.json`),
      
      // Path 4: Path relative to project root
      path.join(process.cwd(), 'templates', category, `${name}.json`),
    ];
    
    // Log all the paths we're going to try
    console.log('Attempting to load template from these paths:');
    possiblePaths.forEach(p => console.log(`- ${p}`));

    // Try each path in filesystem first
    let templateData = null;
    let loadedFrom = '';
    
    for (const attemptPath of possiblePaths) {
      if (fs.existsSync(attemptPath)) {
        console.log(`Template file found at: ${attemptPath}`);
        const templateContent = fs.readFileSync(attemptPath, 'utf8');
        templateData = JSON.parse(templateContent);
        loadedFrom = `Loaded from filesystem: ${attemptPath}`;
        break;
      }
    }
    
    // If file not found in filesystem, try with require
    if (!templateData) {
      console.log('File not found in filesystem, trying with require...');
      try {
        // Try to require from root templates
        templateData = require(`../../../templates/${category}/${name}.json`);
        loadedFrom = `Loaded using require from root templates`;
      } catch (error1) {
        try {
          // Try from current directory templates
          templateData = require(`../../templates/${category}/${name}.json`);
          loadedFrom = `Loaded using require from templates directory`;
        } catch (error2) {
          try {
            // Try from legacy path
            templateData = require(`./templates/${category}/${name}.json`);
            loadedFrom = `Loaded using require from legacy path`;
          } catch (error3) {
            // Last resort - try loading from dist/templates
            try {
              templateData = require(`../../dist/templates/${category}/${name}.json`);
              loadedFrom = `Loaded using require from dist/templates`;
            } catch (error4) {
              console.error('All require attempts failed:');
              console.error('- Error from root templates:', error1.message);
              console.error('- Error from templates directory:', error2.message);
              console.error('- Error from legacy path:', error3.message);
              console.error('- Error from dist templates:', error4.message);
              throw new Error(`Unable to load template from any path`);
            }
          }
        }
      }
    }
    
    if (!templateData) {
      throw new Error(`Failed to load template from any location`);
    }
    
    // Log debug info instead of adding it to the returned object
    console.log(`Successfully loaded template from: ${loadedFrom}`);
    console.log(`Template loaded at: ${new Date().toISOString()}`);
    console.log(`Template contains keys: ${Object.keys(templateData).join(', ')}`);
    return templateData;
  } catch (error) {
    console.error(`Failed to load template ${category}/${name}:`, error);
    throw new Error(`Failed to load template ${category}/${name}: ${error.message}`);
  }
}

/**
 * Helper functions for template customization
 */

/**
 * Check if an element is likely a title
 */
export function isLikelyTitle(element: IDataObject): boolean {
  // Titles are usually large, at the top, with short text
  const text = element.text as string;

  if (element.settings) {
    const settings = element.settings as IDataObject;
    const fontSize = settings['font-size'] as string;
    
    // If it has large font size or contains vw (viewport width) with a high number
    if (fontSize && (parseInt(fontSize, 10) > 40 || (fontSize.includes('vw') && parseFloat(fontSize) > 6))) {
      return true;
    }
  }

  // Title text is usually shorter
  return Boolean(text && text.length < 60);
}

/**
 * Check if an element is likely a subtitle
 */
export function isLikelySubtitle(element: IDataObject): boolean {
  // Subtitles are usually medium sized, below titles
  const text = element.text as string;

  if (element.y && typeof element.y === 'number' && element.y > 100) {
    // It's positioned further down, could be a subtitle
    return true;
  }

  // Subtitle text is usually medium length
  return Boolean(text && text.length > 30 && text.length < 120);
}

/**
 * Check if an element is likely body text
 */
export function isLikelyBodyText(element: IDataObject): boolean {
  // Body text is usually smaller, longer, and positioned in the middle or lower
  const text = element.text as string;

  // Body text is usually longer
  return Boolean(text && text.length > 60);
}

/**
 * Check if an image element is likely a logo
 */
export function isLikelyLogo(element: IDataObject): boolean {
  // Logos are usually small images positioned in corners

  // Check size
  if ((element.width && typeof element.width === 'number' && element.width < 200) || 
      (element.height && typeof element.height === 'number' && element.height < 200)) {
    return true;
  }

  // Check position (often in corners)
  if ((element.x === 0 || (element.x && typeof element.x === 'number' && element.x > 1500)) &&
      (element.y === 0 || (element.y && typeof element.y === 'number' && element.y < 100))) {
    return true;
  }

  return false;
}

/**
 * Replace text in a template
 */
export function replaceTextInTemplate(movieData: IDataObject, textType: string, newText: string): void {
  // Process each scene
  for (const scene of movieData.scenes as IDataObject[]) {
    if (!scene.elements || !Array.isArray(scene.elements)) {
      continue;
    }
    
    // Look for text elements
    for (const element of scene.elements as IDataObject[]) {
      // Handle direct text elements
      if (element.type === 'text') {
        // Replace based on text type - using heuristics to identify text role
        if (textType === 'title' && isLikelyTitle(element)) {
          element.text = newText;
        } else if (textType === 'subtitle' && isLikelySubtitle(element)) {
          element.text = newText;
        } else if (textType === 'body' && isLikelyBodyText(element)) {
          element.text = newText;
        }
      }
      
      // Handle component elements that may contain text
      if (element.type === 'component' && element.settings) {
        const settings = element.settings as IDataObject;
        
        // Check headline settings
        if (settings.headline) {
          const headline = settings.headline as IDataObject;
          if (textType === 'title' && headline.text) {
            headline.text = newText;
          }
        }
        
        // Check body settings
        if (settings.body) {
          const body = settings.body as IDataObject;
          if (textType === 'body' && body.text) {
            if (Array.isArray(body.text)) {
              body.text = [newText];
            } else {
              body.text = newText;
            }
          }
        }
        
        // Check other potential text containers in components
        if (settings.lead && textType === 'subtitle') {
          const lead = settings.lead as IDataObject;
          if (lead.text) {
            lead.text = newText;
          }
        }
      }
    }
  }
}

/**
 * Replace media in a template
 */
export function replaceMediaInTemplate(movieData: IDataObject, mediaType: string, newSrc: string): void {
  // Process each scene
  for (const scene of movieData.scenes as IDataObject[]) {
    if (!scene.elements || !Array.isArray(scene.elements)) {
      continue;
    }
    
    // Look for media elements
    for (const element of scene.elements as IDataObject[]) {
      // Handle image elements
      if (mediaType === 'image' && element.type === 'image') {
        element.src = newSrc;
      }
      
      // Handle video elements
      if (mediaType === 'video' && element.type === 'video') {
        element.src = newSrc;
      }
      
      // Handle logo which is often an image with specific properties
      if (mediaType === 'logo' && element.type === 'image') {
        // Check if this image is likely a logo (usually smaller and positioned in corners)
        if (isLikelyLogo(element)) {
          element.src = newSrc;
        }
      }
    }
  }
}

/**
 * Replace background color in a template
 */
export function replaceBackgroundColorInTemplate(movieData: IDataObject, newColor: string): void {
  // Process each scene
  for (const scene of movieData.scenes as IDataObject[]) {
    // Replace the background color
    scene['background-color'] = newColor;
  }
}

/**
 * Apply customizations to a template
 */
export function applyTemplateCustomizations(
  movieData: IDataObject,
  textCustomization: IDataObject,
  mediaCustomization: IDataObject,
): void {
  if (!movieData.scenes || !Array.isArray(movieData.scenes)) {
    return;
  }

  // Apply text customizations
  if (textCustomization.mainTitle) {
    replaceTextInTemplate(movieData, 'title', textCustomization.mainTitle as string);
  }

  if (textCustomization.subtitle) {
    replaceTextInTemplate(movieData, 'subtitle', textCustomization.subtitle as string);
  }

  if (textCustomization.bodyText) {
    replaceTextInTemplate(movieData, 'body', textCustomization.bodyText as string);
  }

  // Apply media customizations
  if (mediaCustomization.mainImageUrl) {
    replaceMediaInTemplate(movieData, 'image', mediaCustomization.mainImageUrl as string);
  }

  if (mediaCustomization.backgroundVideoUrl) {
    replaceMediaInTemplate(movieData, 'video', mediaCustomization.backgroundVideoUrl as string);
  }

  if (mediaCustomization.logoUrl) {
    replaceMediaInTemplate(movieData, 'logo', mediaCustomization.logoUrl as string);
  }

  // Apply background color if specified
  if (mediaCustomization.backgroundColor) {
    replaceBackgroundColorInTemplate(movieData, mediaCustomization.backgroundColor as string);
  }
}
