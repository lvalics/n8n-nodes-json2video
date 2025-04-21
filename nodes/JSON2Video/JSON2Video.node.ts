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

// Import template loader functions
import {
  loadTemplate,
  getTemplateCategories,
  getTemplatesForCategory
} from './templateLoader';

export class JSON2Video implements INodeType {
	// Static template options are used instead of dynamic loading
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
					{
						name: 'Create Movie from Template',
						value: 'createMovieFromTemplate',
						description: 'Create a movie using a predefined template',
						action: 'Create a movie using a predefined template',
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
				],
				default: 'simple',
				displayOptions: {
					show: {
						operation: ['createMovie'],
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
			// Properties for the Template operation
			// Template category and name selection
			{
				displayName: 'Template Category',
				name: 'templateCategory',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTemplateCategories',
				},
				default: 'basic',
				required: true,
				description: 'Category of templates to choose from',
				displayOptions: {
					show: {
						operation: ['createMovieFromTemplate'],
					},
				},
			},
			{
				displayName: 'Template',
				name: 'templateName',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTemplateOptions',
					loadOptionsDependsOn: ['templateCategory'],
				},
				default: 'hello-world',
				required: true,
				description: 'Template to use as starting point',
				displayOptions: {
					show: {
						operation: ['createMovieFromTemplate'],
					},
				},
			},
			{
				displayName: 'Template Content',
				name: 'templateContent',
				type: 'json',
				typeOptions: {
					rows: 12,
					alwaysOpenEditWindow: true,
				},
				default: '{}',
				displayOptions: {
					show: {
						operation: ['createMovieFromTemplate'],
					},
				},
				description: 'The content of the selected template (read-only, updates when template is loaded)',
				noDataExpression: true,
			},
			{
				displayName: 'Load Template',
				name: 'loadTemplate',
				type: 'button',
				typeOptions: {
					loadOptionsMethod: 'getTemplateContent',
				},
				displayOptions: {
					show: {
						operation: ['createMovieFromTemplate'],
					},
				},
				description: 'Click to load the content of the selected template',
				default: '', // Required for button type
			},
		],
	};

	// Methods for dynamic loading of options
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
			async getTemplateContent(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const templateCategory = this.getCurrentNodeParameter('templateCategory') as string;
				const templateName = this.getCurrentNodeParameter('templateName') as string;
				
				if (!templateCategory || !templateName) {
					return [];
				}
				
				try {
					const templateData = loadTemplate(templateCategory, templateName);
					// Remove debug info if present
					if (templateData._debug) {
						delete templateData._debug;
					}
			
					// Instead of setting parameter directly, return the content as an option
					// that n8n will use to display the template
					return [{
						name: 'Template Loaded Successfully',
						value: JSON.stringify(templateData, null, 2),
						description: `Loaded template from ${templateCategory}/${templateName}`,
					}];
				} catch (error) {
					console.error('Error loading template content:', error);
					
					// Return error message as an option
					const errorMessage = { error: `Failed to load template: ${error.message}` };
					return [{
						name: 'Error Loading Template',
						value: JSON.stringify(errorMessage, null, 2),
						description: error.message,
					}];
				}
			},
		},
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
						// Get the template JSON data from the input
						const templateJson = this.getNodeParameter('templateJson', i, '{}') as string;

						try {
							// Parse the template JSON
							const templateData = typeof templateJson === 'string'
								? JSON.parse(templateJson)
								: templateJson;

							// Merge template with movie config
							movieData = {
								...templateData,
								...movieData,
							};
						} catch (error) {
							throw new Error(`Invalid JSON in template: ${error.message}`);
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

					// Template is now customized directly via the JSON editor

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
				} else if (operation === 'createMovieFromTemplate') {
					// Get template category and name
					const templateCategory = this.getNodeParameter('templateCategory', i) as string;
					const templateName = this.getNodeParameter('templateName', i) as string;
					
					if (!templateCategory || !templateName) {
						throw new Error('Both template category and template name must be selected');
					}
					
					// Load the template using the category and template name
					let templateData: IDataObject;
					try {
						templateData = loadTemplate(templateCategory, templateName);
						
						// Extract any debug info before using the template
						const debugInfo = templateData._debug as IDataObject | undefined;
						if (debugInfo) {
							console.log('Template debug info:', debugInfo);
							
							// Set debug info for the UI - create a detailed message for logging
							const debugInfoString = `Loading from: ${templateCategory}/${templateName}\n${
								typeof debugInfo.loadedFrom === 'string' ? debugInfo.loadedFrom : 'unknown source'
							}\nTimestamp: ${
								typeof debugInfo.timestamp === 'string' ? debugInfo.timestamp : new Date().toISOString()
							}`;
							console.log(debugInfoString);
							
							// Store this information in the returnData for this execution
							// This way it will appear in the execution output
							returnData.push({
								templatePath: typeof debugInfo.loadedFrom === 'string' ? debugInfo.loadedFrom : 'unknown source',
								templateName: `${templateCategory}/${templateName}`,
								loadedAt: typeof debugInfo.timestamp === 'string' ? debugInfo.timestamp : new Date().toISOString(),
								note: "To load the template JSON, execute the node once after selecting a template."
							});
							
							// Remove debug info from actual template data
							delete templateData._debug;
						}

						console.log(`Loaded template: ${templateCategory}/${templateName}`);
						// templateData is already set from loadTemplate above
					} catch (error) {
						console.error('Error loading template:', error);
						throw new Error(`Failed to load template "${templateName}" from category "${templateCategory}": ${error.message}`);
					}

					// Add movie configuration
					const movieConfig = this.getNodeParameter('movieConfig', i, {}) as IDataObject;

					// Set basic movie properties from movie config
					let movieData: IDataObject = { ...templateData };
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
