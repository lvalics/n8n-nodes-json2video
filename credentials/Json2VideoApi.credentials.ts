import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class Json2VideoApi implements ICredentialType {
	// Define the name and display properties of the credential
	name = 'json2VideoApi';
	displayName = 'JSON2Video API';
	documentationUrl = 'https://json2video.com/docs/v2/getting-started';

	// Define the credential properties
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			},
			description: 'Your JSON2Video API key',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.json2video.com/v2',
			description: 'The base URL for the JSON2Video API',
		},
	];

	// Define how authentication is handled in requests
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	// Define a test request to verify credentials
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/movies',
			method: 'GET',
		},
	};
}
