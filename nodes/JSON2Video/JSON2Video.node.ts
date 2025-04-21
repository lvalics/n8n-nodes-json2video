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
			// Properties for the Create Movie operation
			{
				displayName: 'Movie Definition',
				name: 'movieDefinition',
				type: 'json',
				default: '{\n  "scenes": [\n    {\n      "elements": [\n        {\n          "type": "text",\n          "text": "Hello World!",\n          "style": "001"\n        }\n      ]\n    }\n  ]\n}',
				description: 'The JSON structure defining the movie content',
				displayOptions: {
					show: {
						operation: ['createMovie'],
					},
				},
				required: true,
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
					// Get the movie definition
					const movieDefinition = this.getNodeParameter('movieDefinition', i) as string;
					let parsedDefinition: IDataObject;

					// Parse the JSON if it's provided as a string
					try {
						parsedDefinition = typeof movieDefinition === 'string'
							? JSON.parse(movieDefinition)
							: movieDefinition;
					} catch (error) {
						throw new Error(`Invalid JSON in movie definition: ${error.message}`);
					}

					// Make the API request to create the movie
					const response = await this.helpers.request({
						method: 'POST',
						url: `${baseUrl}/movies`,
						headers: {
							'Content-Type': 'application/json',
							'x-api-key': credentials.apiKey as string,
						},
						body: parsedDefinition,
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
}
