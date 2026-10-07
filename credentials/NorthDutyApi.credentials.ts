import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class NorthDutyApi implements ICredentialType {
	name = 'northDutyApi';

	displayName = 'NorthDuty API';

	icon: Icon = {
		light: 'file:../icons/northduty.svg',
		dark: 'file:../icons/northduty.dark.svg',
	};

	documentationUrl = 'https://northduty.com/integrations/n8n/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Personal API token from your NorthDuty profile (Profile → API tokens). Tokens start with "ndk_".',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://northduty.com',
			description: 'The NorthDuty instance to connect to. Leave the default unless told otherwise.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/v1/me',
		},
	};
}
