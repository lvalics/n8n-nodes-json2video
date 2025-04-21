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
} from './templateLoader';

export class JSON2VideoTemplateLoader implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JSON2Video Template Loader',
		name: 'json2VideoTemplateLoader',
		icon: 'file:json2video.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Load templates from the JSON2Video template library',
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
						description: 'Load a template from the template library',
						action: 'Load a template from the template library',
					},
				],
				default: 'loadTemplate',
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
						operation: ['loadTemplate'],
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
						operation: ['loadTemplate'],
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
						operation: ['loadTemplate'],
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
						operation: ['loadTemplate'],
						templateCategory: ['news'],
					},
				},
			},
			{
				displayName: 'Edit Template',
				name: 'editTemplate',
				type: 'boolean',
				default: false,
				description: 'Whether to edit the template before returning it',
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
				typeOptions: {
					rows: 12, // Give more space for editing
				},
				default: '{}',
				description: 'Edit the template JSON. IMPORTANT: First run will be empty - click Execute once to see the template, then edit and execute again.',
				displayOptions: {
					show: {
						operation: ['loadTemplate'],
						editTemplate: [true],
					},
				},
			},
		],
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
					let templateData = loadTemplate(templateCategory, templateName);
				
					// Check if user wants to edit the template
					const editTemplate = this.getNodeParameter('editTemplate', i, false) as boolean;
				
					if (editTemplate) {
						// Get the JSON from the editor (it may be empty the first time)
						const templateJson = this.getNodeParameter('templateJson', i, '{}') as string;
						
						// If the JSON is not empty and not the default, use it instead
						if (templateJson && templateJson !== '{}') {
							try {
								// Parse the JSON
								const userEditedTemplate = typeof templateJson === 'string' 
									? JSON.parse(templateJson) 
									: templateJson;
								
								// Use the user-edited template
								templateData = userEditedTemplate;
							} catch (error) {
								throw new Error(`Invalid JSON in template customization: ${error.message}`);
							}
						}
						
						// Add helpful information in the output
						returnData.push({
							json: {
								...templateData,
								_templateInfo: {
									category: templateCategory,
									name: templateName,
									note: 'On first run, execute once to see the template. Then edit and execute again to apply changes.'
								}
							},
							pairedItem: { item: i },
						});
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
