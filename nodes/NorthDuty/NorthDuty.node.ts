import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

import { getProjects } from '../shared/transport';

export class NorthDuty implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NorthDuty',
		name: 'northDuty',
		icon: {
			light: 'file:../../icons/northduty.svg',
			dark: 'file:../../icons/northduty.dark.svg',
		},
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Read alerts and projects from NorthDuty: user journey monitoring plus uptime, SSL and site health checks',
		defaults: {
			name: 'NorthDuty',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'northDutyApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}/api/v1',
			headers: {
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Alert',
						value: 'alert',
					},
					{
						name: 'Project',
						value: 'project',
					},
				],
				default: 'alert',
			},

			// ----------------------------------
			//             alert
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['alert'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many alerts',
						description: 'Get the most recent alerts',
						routing: {
							request: {
								method: 'GET',
								url: '/alerts',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
								],
							},
						},
					},
				],
				default: 'getMany',
			},
			{
				displayName: 'Project Name or ID',
				name: 'projectId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getProjects',
				},
				displayOptions: {
					show: {
						resource: ['alert'],
						operation: ['getMany'],
					},
				},
				default: '',
				description:
					'Only return alerts for this project. Leave empty for all projects. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				routing: {
					send: {
						type: 'query',
						property: 'project_id',
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 50,
				},
				displayOptions: {
					show: {
						resource: ['alert'],
						operation: ['getMany'],
					},
				},
				default: 50,
				description: 'Max number of results to return',
				routing: {
					send: {
						type: 'query',
						property: 'limit',
					},
				},
			},

			// ----------------------------------
			//             project
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['project'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many projects',
						description: 'Get the projects the API token can access',
						routing: {
							request: {
								method: 'GET',
								url: '/me',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data.projects',
										},
									},
								],
							},
						},
					},
				],
				default: 'getMany',
			},
		],
	};

	methods = {
		loadOptions: {
			getProjects,
		},
	};
}
