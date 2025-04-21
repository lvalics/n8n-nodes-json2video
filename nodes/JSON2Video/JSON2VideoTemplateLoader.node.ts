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

export class JSON2VideoTemplateLoader implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JSON2Video Template Loader',
		name: 'json2VideoTemplateLoader',
		icon: 'file:json2video.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Load JSON2Video templates for use in workflows',
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
						description: 'Load a template by category and name',
						action: 'Load a template by category and name',
					},
				],
				default: 'loadTemplate',
			},
			// Template selection
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
				description: 'Template to load',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{
						name: 'JSON Object',
						value: 'json',
						description: 'Return as a parsed JSON object',
					},
					{
						name: 'Raw JSON String',
						value: 'string',
						description: 'Return as a raw JSON string',
					},
				],
				default: 'json',
				description: 'How to return the template content',
			},
			{
				displayName: 'Add Template Metadata',
				name: 'addMetadata',
				type: 'boolean',
				default: true,
				description: 'Whether to include metadata about the template in the output',
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
		},
	};

	// This is the function that will be called by n8n when the node is executed
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Process each item passed to the node
		for (let i = 0; i < items.length; i++) {
			try {
				// Get template category and name
				const templateCategory = this.getNodeParameter('templateCategory', i) as string;
				const templateName = this.getNodeParameter('templateName', i) as string;
				const outputFormat = this.getNodeParameter('outputFormat', i) as string;
				const addMetadata = this.getNodeParameter('addMetadata', i) as boolean;

				if (!templateCategory || !templateName) {
					throw new Error('Both template category and template name must be selected');
				}

				// Load the template using the category and template name
				let templateData: IDataObject;
				let loadSource = '';
				let loadTimestamp = new Date().toISOString();
				
				try {
					templateData = loadTemplate(templateCategory, templateName);
					
					// Extract debug info if available
					if (templateData._debug) {
						const debugInfo = templateData._debug as IDataObject;
						loadSource = typeof debugInfo.loadedFrom === 'string' ? debugInfo.loadedFrom : 'unknown source';
						loadTimestamp = typeof debugInfo.timestamp === 'string' ? debugInfo.timestamp : loadTimestamp;
						
						// Remove debug info from the template
						delete templateData._debug;
					}
					
					console.log(`Successfully loaded template: ${templateCategory}/${templateName}`);
				} catch (error) {
					console.error('Error loading template:', error);
					throw new Error(`Failed to load template "${templateName}" from category "${templateCategory}": ${error.message}`);
				}

				// Create output based on format choice
				let outputItem: INodeExecutionData;
				
				if (outputFormat === 'string') {
					// Return as string
					const jsonString = JSON.stringify(templateData, null, 2);
					outputItem = {
						json: {
							template: jsonString,
						},
					};
				} else {
					// Return as parsed JSON
					outputItem = {
						json: {
							template: templateData,
						},
					};
				}
				
				// Add metadata if requested
				if (addMetadata) {
					outputItem.json.metadata = {
						category: templateCategory,
						name: templateName,
						loadedFrom: loadSource,
						loadedAt: loadTimestamp,
					};
				}
				
				returnData.push(outputItem);
			} catch (error) {
				// Handle errors according to n8n conventions
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
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
