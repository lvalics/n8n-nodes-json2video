import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import {
	getTemplateCategories,
	getTemplatesForCategory,
	loadTemplate,
	applyTemplateCustomizations
} from './templateLoader';

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
			// Template Selection - Dynamically generated from templateLoader
			{
				displayName: 'Template Category',
				name: 'templateCategory',
				type: 'options',
				options: getTemplateCategories(),
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
				options: getTemplatesForCategory('basic'),
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
				options: getTemplatesForCategory('marketing'),
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
				options: getTemplatesForCategory('news'),
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
			{
				displayName: 'Customization Method',
				name: 'customizationMethod',
				type: 'options',
				options: [
					{
						name: 'User Interface',
						value: 'ui',
						description: 'Use simplified UI fields to customize the template',
					},
					{
						name: 'Edit JSON',
						value: 'json',
						description: 'Directly edit the template JSON',
					},
				],
				default: 'ui',
				description: 'How to customize the template',
				displayOptions: {
					show: {
						operation: ['createMovie'],
						inputMethod: ['template'],
						customizeTemplate: [true],
					},
				},
			},
			{
				displayName: 'Template JSON',
				name: 'templateJson',
				type: 'json',
				typeOptions: {
					rows: 12, // Give more space for editing
				},
				default: '{}',
				description: 'Edit the template JSON directly. NOTE: The first time you select a template, this field will be empty. Click "Execute Node" once to load the template, then you can edit it.',
				displayOptions: {
					show: {
						operation: ['createMovie'],
						inputMethod: ['template'],
						customizeTemplate: [true],
						customizationMethod: ['json'],
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
					// Template handling is now moved to the templateLoader.ts module
				
					// Template helper functions have been moved to templateLoader.ts
				
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
						const templateData = loadTemplate(templateCategory, templateName);
					
						// Merge template with movie config
						movieData = {
							...templateData,
							...movieData,
						};
					
						// Check if we need to customize the template
						const customizeTemplate = this.getNodeParameter('customizeTemplate', i, false) as boolean;
					
						if (customizeTemplate) {
						    const customizationMethod = this.getNodeParameter('customizationMethod', i, 'ui') as string;

						    if (customizationMethod === 'json') {
								// Get the JSON from the editor (it may be empty the first time)
								let templateJson = this.getNodeParameter('templateJson', i, '{}') as string;
								
								// If the JSON is empty, replace it with the actual template
								if (templateJson === '{}') {
									// We'd ideally like to set the parameter's value for the UI, but n8n doesn't support this
									// Instead, we just proceed with the loaded template
									templateJson = JSON.stringify(templateData, null, 2);
								}
								
								try {
									// Parse the JSON
									const customizedTemplate = typeof templateJson === 'string' 
										? JSON.parse(templateJson) 
										: templateJson;
									
									// Replace movieData with the customized template, but keep important movie config
									const { resolution, quality, draft, cache, comment } = movieData as IDataObject;
									movieData = {
										...customizedTemplate,
										resolution,
										quality, 
										draft,
										cache,
										comment,
									};
								} catch (error) {
									throw new Error(`Invalid JSON in template customization: ${error.message}`);
								}
							} else {
								// UI customization
								const textCustomization = this.getNodeParameter('templateTextCustomization', i, {}) as IDataObject;
								const mediaCustomization = this.getNodeParameter('templateMediaCustomization', i, {}) as IDataObject;
						
								// Apply customizations to template using functions from the templateLoader
								applyTemplateCustomizations(movieData, textCustomization, mediaCustomization);
							}
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
