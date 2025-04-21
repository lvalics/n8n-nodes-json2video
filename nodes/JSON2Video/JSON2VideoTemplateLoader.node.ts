import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	NodeConnectionType,
} from 'n8n-workflow';

import * as path from 'path';
import * as fs from 'fs';

/**
 * Registry of all available templates by category
 */
type TemplateCategory = keyof typeof templateRegistry;

/**
 * Registry of all available templates by category
 */
const templateRegistry = {
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
    // For local development - try to read from the filesystem first
    const templatePath = path.join(__dirname, 'templates', category, `${name}.json`);

    if (fs.existsSync(templatePath)) {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      return JSON.parse(templateContent);
    }

    // For production - load from embedded module
    return require(`./templates/${category}/${name}.json`);
  } catch (error) {
    throw new Error(`Failed to load template ${category}/${name}: ${error.message}`);
  }
}

export class JSON2VideoTemplateLoader implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JSON2Video Template Loader',
		name: 'json2VideoTemplateLoader',
		icon: 'file:json2video.svg', 
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Load and customize JSON2Video templates',
		defaults: {
			name: 'JSON2Video Template Loader',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Load Template',
						value: 'loadTemplate',
					},
				],
				default: 'loadTemplate',
			},
			{
				displayName: 'Template Category',
				name: 'templateCategory',
				type: 'options',
				required: true,
				default: '',
				description: 'Category of template to load',
				typeOptions: {
					loadOptionsMethod: 'getTemplateCategories',
				},
				displayOptions: {
					show: {
						operation: ['loadTemplate'],
					},
				},
			},
			{
				displayName: 'Template Name',
				name: 'templateName',
				type: 'options',
				required: true,
				default: '',
				description: 'Name of template to load',
				typeOptions: {
					loadOptionsMethod: 'getTemplateOptions',
					loadOptionsDependsOn: ['templateCategory'],
				},
				displayOptions: {
					show: {
						operation: ['loadTemplate'],
					},
				},
			},
			{
				displayName: 'Edit Template',
				name: 'editTemplate',
				type: 'boolean',
				default: false,
				description: 'Whether to enable template editing',
				displayOptions: {
					show: {
						operation: ['loadTemplate'],
					},
				},
			},
			{
				displayName: 'Template JSON',
				name: 'templateJson',
				type: 'json',
				default: '{}',
				description: 'Edit the template JSON directly',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				displayOptions: {
					show: {
						operation: ['loadTemplate'],
						editTemplate: [true],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			async getTemplateCategories(): Promise<INodePropertyOptions[]> {
				return getTemplateCategories();
			},
			async getTemplateOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const templateCategory = this.getCurrentNodeParameter('templateCategory') as string;
				if (!templateCategory) {
					return [];
				}
				return getTemplatesForCategory(templateCategory);
			},
		},
	};



	// This is the function that will be called by n8n when the node is executed
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Process each item passed to the node
		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'loadTemplate') {
					// Get template information
					const templateCategory = this.getNodeParameter('templateCategory', i) as string;
					const templateName = this.getNodeParameter('templateName', i) as string;

					// Load the template
					let templateData = loadTemplate(templateCategory, templateName);

					// Check if user wants to edit the template
					const editTemplate = this.getNodeParameter('editTemplate', i, false) as boolean;

					if (editTemplate) {
						// Get the JSON from the editor (it may be empty the first time)
						const templateJson = this.getNodeParameter('templateJson', i, '{}') as string;

						// Check if this is the first run (JSON is empty or default)
						if (!templateJson || templateJson === '{}') {
							// First execution - just return the template with instructions
							returnData.push({
								json: {
									...templateData,
									_templateInfo: {
										category: templateCategory,
										name: templateName,
										status: 'Template loaded successfully! You can now edit the JSON above and execute again to apply changes.',
										firstRun: true
									}
								},
								pairedItem: { item: i },
							});
						} else {
							try {
								// This is a subsequent run with user edits - parse and use the edited JSON
								const userEditedTemplate = typeof templateJson === 'string'
									? JSON.parse(templateJson)
									: templateJson;

								// Use the user-edited template
								templateData = userEditedTemplate;

								// Add helpful information in the output
								returnData.push({
									json: {
										...templateData,
										_templateInfo: {
											category: templateCategory,
											name: templateName,
											status: 'Your edited template has been applied successfully!',
											firstRun: false
										}
									},
									pairedItem: { item: i },
								});
							} catch (error) {
								throw new Error(`Invalid JSON in template customization: ${error.message}`);
							}
						}
					} else {
						// Just return the template without edits
						returnData.push({
							json: templateData as unknown as IDataObject,
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				// Handle errors according to n8n conventions
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		// Return the processed data
		return [returnData];
	}
}
