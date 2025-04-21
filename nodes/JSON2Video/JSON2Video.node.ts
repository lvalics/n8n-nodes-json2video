import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

export class JSON2Video implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JSON2Video',
		name: 'json2Video',
		icon: 'file:json2video.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Create and manage videos with JSON2Video API',
		defaults: {
			name: 'JSON2Video',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'json2VideoApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create Movie',
						value: 'createMovie',
						description: 'Create a new movie rendering job',
						action: 'Create a new movie rendering job',
					},
					{
						name: 'Check Movie Status',
						value: 'checkMovieStatus',
						description: 'Check the status of an existing movie rendering job',
						action: 'Check the status of an existing movie rendering job',
					},
				],
				default: 'createMovie',
			},
			// Movie Configuration Options
			{
				displayName: 'Input Method',
				name: 'inputMethod',
				type: 'options',
				options: [
					{
						name: 'Simple',
						value: 'simple',
						description: 'Create a movie using simplified UI inputs',
					},
					{
						name: 'JSON',
						value: 'json',
						description: 'Define movie using raw JSON',
					},
					{
						name: 'Template',
						value: 'template',
						description: 'Start with a pre-built template',
					},
				],
				default: 'simple',
				displayOptions: {
					show: {
						operation: ['createMovie'],
					},
				},
			},
			// Template Selection
			{
				displayName: 'Template Category',
				name: 'templateCategory',
				type: 'options',
				options: [
					{
						name: 'Basic',
						value: 'basic',
					},
					{
						name: 'Marketing',
						value: 'marketing',
					},
					{
						name: 'News',
						value: 'news',
					},
				],
				default: 'basic',
				description: 'Category of templates to choose from',
				displayOptions: {
					show: {
						operation: ['createMovie'],
						inputMethod: ['template'],
					},
				},
			},
			{
				displayName: 'Basic Templates',
				name: 'basicTemplate',
				type: 'options',
				options: [
					{
						name: 'Hello World - Simple Text Animation',
						value: 'hello-world',
					},
					{
						name: 'Image Slideshow - Transitions Between Images',
						value: 'image-slideshow',
					},
					{
						name: 'Video with Text Overlay - Basic Text Over Video',
						value: 'video-with-text-overlay',
					},
					{
						name: 'Video with Watermark - Add Logo or Watermark',
						value: 'video-with-watermark',
					},
				],
				default: 'hello-world',
				description: 'Basic template to use as starting point',
				displayOptions: {
					show: {
						operation: ['createMovie'],
						inputMethod: ['template'],
						templateCategory: ['basic'],
					},
				},
			},
			{
				displayName: 'Marketing Templates',
				name: 'marketingTemplate',
				type: 'options',
				options: [
					{
						name: 'Black Friday Promo - Sale Announcement',
						value: 'black-friday-promo',
					},
					{
						name: 'Corporate Video - Professional Presentation',
						value: 'corporate-video',
					},
					{
						name: 'Event Agenda - Schedule Presentation',
						value: 'event-agenda',
					},
					{
						name: 'Event Speakers - Speaker Profiles',
						value: 'event-speakers',
					},
					{
						name: 'Motivational - Inspirational Quote Card',
						value: 'motivational',
					},
					{
						name: 'Promo - Variables Template with Call to Action',
						value: 'promo',
					},
					{
						name: 'Quote - Quotation with Background',
						value: 'quote',
					},
					{
						name: 'Real Estate - Property Presentation (Landscape)',
						value: 'real-estate',
					},
					{
						name: 'Real Estate Story - Property Tour (Portrait)',
						value: 'real-estate-2',
					},
					{
						name: 'Slide Text Left - Animated Text Entrance',
						value: 'slide-text-left',
					},
				],
				default: 'corporate-video',
				description: 'Marketing template to use as starting point',
				displayOptions: {
					show: {
						operation: ['createMovie'],
						inputMethod: ['template'],
						templateCategory: ['marketing'],
					},
				},
			},
			{
				displayName: 'News Templates',
				name: 'newsTemplate',
				type: 'options',
				options: [
					{
						name: 'CNN Style Lower Third - News Caption',
						value: 'cnn-lower-third',
					},
					{
						name: 'One Line Lower Third - Simple News Caption',
						value: 'one-line-lower-third',
					},
				],
				default: 'cnn-lower-third',
				description: 'News template to use as starting point',
				displayOptions: {
					show: {
						operation: ['createMovie'],
						inputMethod: ['template'],
						templateCategory: ['news'],
					},
				},
			},
			{
				displayName: 'Customize Template',
				name: 'customizeTemplate',
				type: 'boolean',
				default: true,
				description: 'Whether to customize the selected template with your own content',
				displayOptions: {
					show: {
						operation: ['createMovie'],
						inputMethod: ['template'],
					},
				},
			},
			// Properties for the Create Movie operation with JSON input
			{
				displayName: 'Scene Definition',
				name: 'movieDefinition',
				type: 'json',
				default: '{\n  "scenes": [\n    {\n      "duration": 2,\n      "elements": [\n        {\n          "type": "text",\n          "text": "Hello World!",\n          "style": "001"\n        }\n      ]\n    }\n  ]\n}',
				description: 'The JSON structure defining only the scenes and elements (not the movie settings)',
				displayOptions: {
					show: {
						operation: ['createMovie'],
						inputMethod: ['json'],
					},
				},
				required: true,
			},
			// Movie Basic Configuration
			{
				displayName: 'Movie Configuration',
				name: 'movieConfig',
				type: 'collection',
				placeholder: 'Add Movie Configuration',
				default: {},
				displayOptions: {
					show: {
						operation: ['createMovie'],
					},
				},
				options: [
					{
						displayName: 'Resolution',
						name: 'resolution',
						type: 'options',
						options: [
							{
								name: 'SD (640x360)',
								value: 'sd',
							},
							{
								name: 'HD (1280x720)',
								value: 'hd',
							},
							{
								name: 'Full HD (1920x1080)',
								value: 'full-hd',
							},
							{
								name: 'Squared (1080x1080)',
								value: 'squared',
							},
							{
								name: 'Instagram Story (1080x1920)',
								value: 'instagram-story',
							},
							{
								name: 'Instagram Feed (1080x1080)',
								value: 'instagram-feed',
							},
							{
								name: 'Twitter Landscape (1600x900)',
								value: 'twitter-landscape',
							},
							{
								name: 'Twitter Portrait (1080x1920)',
								value: 'twitter-portrait',
							},
							{
								name: 'Custom',
								value: 'custom',
							},
						],
						default: 'hd',
						description: 'Resolution of the output video',
					},
					{
						displayName: 'Width',
						name: 'width',
						type: 'number',
						typeOptions: {
							minValue: 50,
							maxValue: 3840,
						},
						default: 1280,
						description: 'Width of the output video in pixels',
						displayOptions: {
							show: {
								'/movieConfig.resolution': ['custom'],
							},
						},
					},
					{
						displayName: 'Height',
						name: 'height',
						type: 'number',
						typeOptions: {
							minValue: 50,
							maxValue: 3840,
						},
						default: 720,
						description: 'Height of the output video in pixels',
						displayOptions: {
							show: {
								'/movieConfig.resolution': ['custom'],
							},
						},
					},
					{
						displayName: 'Quality',
						name: 'quality',
						type: 'options',
						options: [
							{
								name: 'Low',
								value: 'low',
							},
							{
								name: 'Medium',
								value: 'medium',
							},
							{
								name: 'High',
								value: 'high',
							},
						],
						default: 'high',
						description: 'Quality of the output video',
					},
					{
						displayName: 'Add Watermark',
						name: 'draft',
						type: 'boolean',
						default: true,
						description: 'Whether to add watermark to the video or not. Free plans must use watermark',
					},
					{
						displayName: 'Use Cache',
						name: 'cache',
						type: 'boolean',
						default: true,
						description: 'Whether to use cached version if available',
					},
					{
						displayName: 'Comment',
						name: 'comment',
						type: 'string',
						default: '',
						description: 'Comment for the rendering job',
					},
				],
			},
			// Scene configuration
			{
				displayName: 'Scene Settings',
				name: 'sceneSettings',
				placeholder: 'Add Scene',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				displayOptions: {
					show: {
						operation: ['createMovie'],
						inputMethod: ['simple'],
					},
				},
				options: [
					{
						name: 'sceneValues',
						displayName: 'Scene',
						values: [
							{
								displayName: 'Background Color',
								name: 'backgroundColor',
								type: 'color',
								default: '#000000',
								description: 'Background color of the scene',
							},
							{
								displayName: 'Duration (seconds)',
								name: 'duration',
								type: 'number',
								default: -1, 
								description: 'Duration of the scene in seconds. Use -1 to auto-calculate based on elements',
							},
							{
								displayName: 'Elements',
								name: 'elements',
								placeholder: 'Add Element',
								type: 'fixedCollection',
								typeOptions: {
									multipleValues: true,
								},
								default: {},
								options: [
									{
										name: 'textElements',
										displayName: 'Text Elements',
										values: [
											{
												displayName: 'Text',
												name: 'text',
												type: 'string',
												default: 'Hello World!',
												description: 'Text content to display',
											},
											{
												displayName: 'Style',
												name: 'style',
												type: 'string',
												default: '001',
												description: 'Style ID for the text (see JSON2Video docs)',
											},
											{
												displayName: 'Position',
												name: 'position',
												type: 'options',
												options: [
													{
														name: 'Center',
														value: 'center-center',
													},
													{
														name: 'Top Left',
														value: 'top-left',
													},
													{
														name: 'Top Right',
														value: 'top-right',
													},
													{
														name: 'Bottom Left',
														value: 'bottom-left',
													},
													{
														name: 'Bottom Right',
														value: 'bottom-right',
													},
													{
														name: 'Custom',
														value: 'custom',
													},
												],
												default: 'center-center',
												description: 'Position of the text in the scene',
											},
											{
												displayName: 'X Position',
												name: 'x',
												type: 'number',
												default: 0,
												displayOptions: {
													show: {
														position: ['custom'],
													},
												},
												description: 'X position of the text (0 is left edge)',
											},
											{
												displayName: 'Y Position',
												name: 'y',
												type: 'number',
												default: 0,
												displayOptions: {
													show: {
														position: ['custom'],
													},
												},
												description: 'Y position of the text (0 is top edge)',
											},
											{
												displayName: 'Duration (seconds)',
												name: 'duration',
												type: 'number',
												default: -2,
												description: 'Duration of the element in seconds. Use -2 to match scene duration',
											},
										],
									},
									{
										name: 'imageElements',
										displayName: 'Image Elements',
										values: [
											{
												displayName: 'Image URL',
												name: 'src',
												type: 'string',
												default: '',
												description: 'URL of the image to display',
											},
											{
												displayName: 'Position',
												name: 'position',
												type: 'options',
												options: [
													{
														name: 'Center',
														value: 'center-center',
													},
													{
														name: 'Top Left',
														value: 'top-left',
													},
													{
														name: 'Top Right',
														value: 'top-right',
													},
													{
														name: 'Bottom Left',
														value: 'bottom-left',
													},
													{
														name: 'Bottom Right',
														value: 'bottom-right',
													},
													{
														name: 'Custom',
														value: 'custom',
													},
												],
												default: 'center-center',
												description: 'Position of the image in the scene',
											},
											{
												displayName: 'X Position',
												name: 'x',
												type: 'number',
												default: 0,
												displayOptions: {
													show: {
														position: ['custom'],
													},
												},
												description: 'X position of the image (0 is left edge)',
											},
											{
												displayName: 'Y Position',
												name: 'y',
												type: 'number',
												default: 0,
												displayOptions: {
													show: {
														position: ['custom'],
													},
												},
												description: 'Y position of the image (0 is top edge)',
											},
											{
												displayName: 'Resize Mode',
												name: 'resize',
												type: 'options',
												options: [
													{
														name: 'None',
														value: '',
													},
													{
														name: 'Cover',
														value: 'cover',
													},
													{
														name: 'Fit',
														value: 'fit',
													},
												],
												default: '',
												description: 'How the image should be resized to fit the scene',
											},
											{
												displayName: 'Duration (seconds)',
												name: 'duration',
												type: 'number',
												default: -2,
												description: 'Duration of the element in seconds. Use -2 to match scene duration',
											},
										],
									},
									{
										name: 'videoElements',
										displayName: 'Video Elements',
										values: [
											{
												displayName: 'Video URL',
												name: 'src',
												type: 'string',
												default: '',
												description: 'URL of the video to display (MP4 recommended)',
											},
											{
												displayName: 'Position',
												name: 'position',
												type: 'options',
												options: [
													{
														name: 'Center',
														value: 'center-center',
													},
													{
														name: 'Top Left',
														value: 'top-left',
													},
													{
														name: 'Top Right',
														value: 'top-right',
													},
													{
														name: 'Bottom Left',
														value: 'bottom-left',
													},
													{
														name: 'Bottom Right',
														value: 'bottom-right',
													},
													{
														name: 'Custom',
														value: 'custom',
													},
												],
												default: 'center-center',
												description: 'Position of the video in the scene',
											},
											{
												displayName: 'Muted',
												name: 'muted',
												type: 'boolean',
												default: false,
												description: 'Whether to mute the video',
											},
											{
												displayName: 'Resize Mode',
												name: 'resize',
												type: 'options',
												options: [
													{
														name: 'None',
														value: '',
													},
													{
														name: 'Cover',
														value: 'cover',
													},
													{
														name: 'Fit',
														value: 'fit',
													},
												],
												default: '',
												description: 'How the video should be resized to fit the scene',
											},
											{
												displayName: 'Duration (seconds)',
												name: 'duration',
												type: 'number',
												default: -1,
												description: 'Duration of the element in seconds. Use -1 for the full video length',
											},
										],
									},
									{
										name: 'audioElements',
										displayName: 'Audio Elements',
										values: [
											{
												displayName: 'Audio URL',
												name: 'src',
												type: 'string',
												default: '',
												description: 'URL of the audio file (MP3 recommended)',
											},
											{
												displayName: 'Volume',
												name: 'volume',
												type: 'number',
												typeOptions: {
													minValue: 0,
													maxValue: 10,
												},
												default: 1,
												description: 'Volume of the audio (1 is normal volume)',
											},
											{
												displayName: 'Duration (seconds)',
												name: 'duration',
												type: 'number',
												default: -1,
												description: 'Duration of the element in seconds. Use -1 for the full audio length',
											},
										],
									},
								],
							},
						],
					},
				],
			},
			// Template Customization Options
			{
				displayName: 'Template Text Customization',
				name: 'templateTextCustomization',
				type: 'collection',
				placeholder: 'Customize Text',
				default: {},
				displayOptions: {
					show: {
						operation: ['createMovie'],
						inputMethod: ['template'],
						customizeTemplate: [true],
					},
				},
				options: [
					{
						displayName: 'Main Title',
						name: 'mainTitle',
						type: 'string',
						default: '',
						description: 'Main title text to replace in the template',
					},
					{
						displayName: 'Subtitle',
						name: 'subtitle',
						type: 'string',
						default: '',
						description: 'Subtitle text to replace in the template',
					},
					{
						displayName: 'Body Text',
						name: 'bodyText',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Main body text to replace in the template',
					},
				],
			},
			{
				displayName: 'Template Media Customization',
				name: 'templateMediaCustomization',
				type: 'collection',
				placeholder: 'Customize Media',
				default: {},
				displayOptions: {
					show: {
						operation: ['createMovie'],
						inputMethod: ['template'],
						customizeTemplate: [true],
					},
				},
				options: [
					{
						displayName: 'Main Image URL',
						name: 'mainImageUrl',
						type: 'string',
						default: '',
						description: 'URL of the main image to use in the template',
					},
					{
						displayName: 'Background Video URL',
						name: 'backgroundVideoUrl',
						type: 'string',
						default: '',
						description: 'URL of the background video to use in the template',
					},
					{
						displayName: 'Logo URL',
						name: 'logoUrl',
						type: 'string',
						default: '',
						description: 'URL of the logo to use in the template',
					},
					{
						displayName: 'Background Color',
						name: 'backgroundColor',
						type: 'color',
						default: '#000000',
						description: 'Background color for solid color backgrounds',
					},
				],
			},
			// Properties for the Check Movie Status operation
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				default: '',
				description: 'The ID of the movie rendering job to check',
				displayOptions: {
					show: {
						operation: ['checkMovieStatus'],
					},
				},
				required: true,
			},
		],
	};

	// This is the function that will be called by n8n when the node is executed
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		// Get credentials for API call
		const credentials = await this.getCredentials('json2VideoApi');
		const baseUrl = credentials.baseUrl as string || 'https://api.json2video.com/v2';

		// Process each item passed to the node
		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'createMovie') {
					// Get input method
					const inputMethod = this.getNodeParameter('inputMethod', i) as string;
					let movieData: IDataObject = {};

					// Add movie configuration for both input methods
					const movieConfig = this.getNodeParameter('movieConfig', i, {}) as IDataObject;
					
					// Set basic movie properties
					if (movieConfig.resolution) {
						movieData.resolution = movieConfig.resolution;
						
						// Add custom dimensions if specified
						if (movieConfig.resolution === 'custom') {
							if (movieConfig.width) {
								movieData.width = movieConfig.width;
							}
							if (movieConfig.height) {
								movieData.height = movieConfig.height;
							}
						}
					}
					
					// Set other movie properties
					if (movieConfig.quality) {
						movieData.quality = movieConfig.quality;
					}
					
					if (movieConfig.draft !== undefined) {
						movieData.draft = movieConfig.draft;
					}
					
					if (movieConfig.cache !== undefined) {
						movieData.cache = movieConfig.cache;
					}
					
					if (movieConfig.comment) {
						movieData.comment = movieConfig.comment;
					}

					// Helper functions for template handling
					const loadTemplateLocal = async (category: string, name: string): Promise<IDataObject> => {
						// In a production environment, this would load from the filesystem
						// For n8n nodes distributed as packages, we need to embed the templates
					
						// Path convention: category/template-name
						const templatePath = `${category}/${name}`;
					
						// Basic registry of embedded templates
						const templates: { [key: string]: object } = {
							'basic/hello-world': require('./templates/basic/hello-world.json'),
							'basic/image-slideshow': require('./templates/basic/image-slideshow.json'),
							'basic/video-with-text-overlay': require('./templates/basic/video-with-text-overlay.json'),
							'basic/video-with-watermark': require('./templates/basic/video-with-watermark.json'),
							'marketing/black-friday-promo': require('./templates/marketing/black-friday-promo.json'),
							'marketing/corporate-video': require('./templates/marketing/corporate-video.json'),
							'news/cnn-lower-third': require('./templates/news/cnn-lower-third.json'),
							'news/one-line-lower-third': require('./templates/news/one-line-lower-third.json'),
							// Add more templates as they're created
						};
					
						if (!templates[templatePath]) {
							throw new Error(`Template not found: ${templatePath}`);
						}
					
						return templates[templatePath] as IDataObject;
					};
				
					const replaceTextInTemplateLocal = (movieData: IDataObject, textType: string, newText: string): void => {
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
									if (textType === 'title' && isLikelyTitleLocal(element)) {
										element.text = newText;
									} else if (textType === 'subtitle' && isLikelySubtitleLocal(element)) {
										element.text = newText;
									} else if (textType === 'body' && isLikelyBodyTextLocal(element)) {
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
					};
				
					const replaceMediaInTemplateLocal = (movieData: IDataObject, mediaType: string, newSrc: string): void => {
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
									if (isLikelyLogoLocal(element)) {
										element.src = newSrc;
									}
								}
							}
						}
					};
				
					const replaceBackgroundColorInTemplateLocal = (movieData: IDataObject, newColor: string): void => {
						// Process each scene
						for (const scene of movieData.scenes as IDataObject[]) {
							// Replace the background color
							scene['background-color'] = newColor;
						}
					};
				
					const applyTemplateCustomizationsLocal = (
						movieData: IDataObject,
						textCustomization: IDataObject,
						mediaCustomization: IDataObject,
					): void => {
						if (!movieData.scenes || !Array.isArray(movieData.scenes)) {
							return;
						}
					
						// Apply text customizations
						if (textCustomization.mainTitle) {
							replaceTextInTemplateLocal(movieData, 'title', textCustomization.mainTitle as string);
						}
					
						if (textCustomization.subtitle) {
							replaceTextInTemplateLocal(movieData, 'subtitle', textCustomization.subtitle as string);
						}
					
						if (textCustomization.bodyText) {
							replaceTextInTemplateLocal(movieData, 'body', textCustomization.bodyText as string);
						}
					
						// Apply media customizations
						if (mediaCustomization.mainImageUrl) {
							replaceMediaInTemplateLocal(movieData, 'image', mediaCustomization.mainImageUrl as string);
						}
					
						if (mediaCustomization.backgroundVideoUrl) {
							replaceMediaInTemplateLocal(movieData, 'video', mediaCustomization.backgroundVideoUrl as string);
						}
					
						if (mediaCustomization.logoUrl) {
							replaceMediaInTemplateLocal(movieData, 'logo', mediaCustomization.logoUrl as string);
						}
					
						// Apply background color if specified
						if (mediaCustomization.backgroundColor) {
							replaceBackgroundColorInTemplateLocal(movieData, mediaCustomization.backgroundColor as string);
						}
					};
				
					const isLikelyTitleLocal = (element: IDataObject): boolean => {
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
					};
				
					const isLikelySubtitleLocal = (element: IDataObject): boolean => {
						// Subtitles are usually medium sized, below titles
						const text = element.text as string;
					
						if (element.y && typeof element.y === 'number' && element.y > 100) {
							// It's positioned further down, could be a subtitle
							return true;
						}
					
						// Subtitle text is usually medium length
						return Boolean(text && text.length > 30 && text.length < 120);
					};
				
					const isLikelyBodyTextLocal = (element: IDataObject): boolean => {
						// Body text is usually smaller, longer, and positioned in the middle or lower
						const text = element.text as string;
					
						// Body text is usually longer
						return Boolean(text && text.length > 60);
					};
				
					const isLikelyLogoLocal = (element: IDataObject): boolean => {
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
					};
				
					if (inputMethod === 'template') {
						// Use a predefined template
						const templateCategory = this.getNodeParameter('templateCategory', i) as string;
						let templateName = '';
					
						// Get the template based on category
						if (templateCategory === 'basic') {
							templateName = this.getNodeParameter('basicTemplate', i) as string;
						} else if (templateCategory === 'marketing') {
							templateName = this.getNodeParameter('marketingTemplate', i) as string;
						} else if (templateCategory === 'news') {
							templateName = this.getNodeParameter('newsTemplate', i) as string;
						}
					
						// Load the template
						const templateData = await loadTemplateLocal(templateCategory, templateName);
					
						// Merge template with movie config
						movieData = {
							...templateData,
							...movieData,
						};
					
						// Check if we need to customize the template
						const customizeTemplate = this.getNodeParameter('customizeTemplate', i, false) as boolean;
					
						if (customizeTemplate) {
							// Get template customization options
							const textCustomization = this.getNodeParameter('templateTextCustomization', i, {}) as IDataObject;
							const mediaCustomization = this.getNodeParameter('templateMediaCustomization', i, {}) as IDataObject;
						
							// Apply customizations to template
							applyTemplateCustomizationsLocal(movieData, textCustomization, mediaCustomization);
						}
					} else if (inputMethod === 'json') {
						// If using JSON input, parse the scene definition
						const movieDefinition = this.getNodeParameter('movieDefinition', i) as string;
						
						// Parse the JSON if it's provided as a string
						try {
							const scenesData = typeof movieDefinition === 'string'
								? JSON.parse(movieDefinition)
								: movieDefinition;
							
							// Only extract the scenes property from the JSON
							if (scenesData.scenes) {
								movieData.scenes = scenesData.scenes;
							} else {
								// If the JSON doesn't have a scenes property, assume it's an array of scenes
								movieData.scenes = Array.isArray(scenesData) ? scenesData : [scenesData];
							}
						} catch (error) {
							throw new Error(`Invalid JSON in movie definition: ${error.message}`);
						}
					} else {
						// Simple input method - build the scenes from structured inputs
						
						// Process scenes
						const sceneSettings = this.getNodeParameter(
							'sceneSettings.sceneValues',
							i,
							[],
						) as IDataObject[];
						
						if (sceneSettings.length > 0) {
							const scenes = [] as IDataObject[];
							
							// Process each scene
							for (const scene of sceneSettings) {
								const sceneData = {} as IDataObject;
								
								// Set scene properties
								if (scene.backgroundColor) {
									sceneData['background-color'] = scene.backgroundColor;
								}
								
								if (scene.duration !== undefined) {
									sceneData.duration = scene.duration;
								}
								
								// Process elements
								const elements = [] as IDataObject[];
								
								// Process text elements
								const textElements = (scene.elements as IDataObject)?.textElements as IDataObject[] || [];
								for (const element of textElements) {
									const textElement = {
										type: 'text',
										text: element.text,
										style: element.style,
										position: element.position,
										duration: element.duration,
									} as IDataObject;
									
									// Add custom position if specified
									if (element.position === 'custom') {
										textElement.x = element.x;
										textElement.y = element.y;
									}
									
									elements.push(textElement);
								}
								
								// Process image elements
								const imageElements = (scene.elements as IDataObject)?.imageElements as IDataObject[] || [];
								for (const element of imageElements) {
									const imageElement = {
										type: 'image',
										src: element.src,
										position: element.position,
										duration: element.duration,
									} as IDataObject;
									
									// Add custom position if specified
									if (element.position === 'custom') {
										imageElement.x = element.x;
										imageElement.y = element.y;
									}
									
									// Add resize mode if specified
									if (element.resize) {
										imageElement.resize = element.resize;
									}
									
									elements.push(imageElement);
								}
								
								// Process video elements
								const videoElements = (scene.elements as IDataObject)?.videoElements as IDataObject[] || [];
								for (const element of videoElements) {
									const videoElement = {
										type: 'video',
										src: element.src,
										position: element.position,
										duration: element.duration,
										muted: element.muted,
									} as IDataObject;
									
									// Add resize mode if specified
									if (element.resize) {
										videoElement.resize = element.resize;
									}
									
									elements.push(videoElement);
								}
								
								// Process audio elements
								const audioElements = (scene.elements as IDataObject)?.audioElements as IDataObject[] || [];
								for (const element of audioElements) {
									const audioElement = {
										type: 'audio',
										src: element.src,
										volume: element.volume,
										duration: element.duration,
									} as IDataObject;
									
									elements.push(audioElement);
								}
								
								// Add elements to scene
								if (elements.length > 0) {
									sceneData.elements = elements;
								}
								
								scenes.push(sceneData);
							}
							
							// Add scenes to movie
							movieData.scenes = scenes;
						}
					}

					// Before making the API request, validate and fix durations
					if (movieData.scenes && Array.isArray(movieData.scenes)) {
						// Process each scene to ensure no zero durations
						for (const scene of movieData.scenes as IDataObject[]) {
							// If duration is 0, set it to 1 second minimum
							if (scene.duration === 0) {
								scene.duration = 1;
							}

							// Process elements to ensure no zero durations
							if (scene.elements && Array.isArray(scene.elements)) {
								for (const element of scene.elements as IDataObject[]) {
									// If duration is 0, set it to 1 second minimum
									// Keep -1 (auto-calculate) and -2 (match scene) values
									if (element.duration === 0) {
										element.duration = 1;
									}
								}
							}
						}
					}

					// Make the API request to create the movie
					const response = await this.helpers.request({
						method: 'POST',
						url: `${baseUrl}/movies`,
						headers: {
							'Content-Type': 'application/json',
							'x-api-key': credentials.apiKey as string,
						},
						body: movieData,
						json: true,
					});

					returnData.push(response);
				} else if (operation === 'checkMovieStatus') {
					// Get the project ID parameter
					const projectId = this.getNodeParameter('projectId', i) as string;

					// Make the API request to check the movie status
					const response = await this.helpers.request({
						method: 'GET',
						url: `${baseUrl}/movies`,
						qs: {
							project: projectId,
						},
						headers: {
							'x-api-key': credentials.apiKey as string,
						},
						json: true,
					});

					returnData.push(response);
				}
			} catch (error) {
				// Handle errors according to n8n conventions
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;
			}
		}

		// Return the processed data
		return [this.helpers.returnJsonArray(returnData)];
	}

	// These class methods are kept for reference but are no longer used directly
	// Instead we use local functions inside the execute method to avoid 'this' binding issues
}
