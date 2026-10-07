import {
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';

import { getProjects, northDutyApiRequest } from '../shared/transport';

export class NorthDutyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NorthDuty Trigger',
		name: 'northDutyTrigger',
		icon: {
			light: 'file:../../icons/northduty.svg',
			dark: 'file:../../icons/northduty.dark.svg',
		},
		group: ['trigger'],
		version: 1,
		subtitle: '=Project ID: {{$parameter["projectId"]}}',
		description:
			'Starts the workflow when NorthDuty detects a problem on a monitored site (new alert)',
		defaults: {
			name: 'NorthDuty Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'northDutyApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Project Name or ID',
				name: 'projectId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getProjects',
				},
				required: true,
				default: '',
				description:
					'The NorthDuty project whose alerts trigger this workflow. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Severities',
				name: 'severities',
				type: 'multiOptions',
				options: [
					{
						name: 'Critical',
						value: 'critical',
					},
					{
						name: 'Warning',
						value: 'warning',
					},
				],
				default: [],
				description: 'Only trigger for alerts with these severities. Leave empty for all.',
			},
			{
				displayName: 'Alert Types',
				name: 'rules',
				type: 'multiOptions',
				options: [
					{
						name: 'Domain Name Nearing Expiry',
						value: 'domain_expiry',
					},
					{
						name: 'Health Score Below Threshold',
						value: 'health_score_below',
					},
					{
						name: 'Response Time Above Threshold',
						value: 'response_time_above',
					},
					{
						name: 'Security Score Below Threshold',
						value: 'security_score_below',
					},
					{
						name: 'SSL Certificate Nearing Expiry',
						value: 'ssl_expiry',
					},
					{
						name: 'User Journey Failure',
						value: 'user_flow_failure',
					},
				],
				default: [],
				description: 'Only trigger for these alert types. Leave empty for all.',
			},
		],
	};

	methods = {
		loadOptions: {
			getProjects,
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.hookId === undefined) {
					return false;
				}

				try {
					const response = (await northDutyApiRequest.call(this, 'GET', '/hooks')) as {
						data?: Array<{ id: number }>;
					};
					const exists = (response.data ?? []).some((hook) => hook.id === webhookData.hookId);
					if (!exists) {
						delete webhookData.hookId;
					}
					return exists;
				} catch (error) {
					this.logger.warn(
						`NorthDuty Trigger: could not verify the webhook subscription, re-creating it (${(error as Error).message})`,
					);
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const projectId = Number(this.getNodeParameter('projectId'));

				const response = (await northDutyApiRequest.call(this, 'POST', '/hooks', {
					project_id: projectId,
					url: webhookUrl,
				})) as { data?: { id: number } };

				if (response.data?.id === undefined) {
					return false;
				}

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.hookId = response.data.id;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.hookId === undefined) {
					return true;
				}

				try {
					await northDutyApiRequest.call(this, 'DELETE', `/hooks/${webhookData.hookId}`);
				} catch (error) {
					// The hook may already have been removed on the NorthDuty side.
					this.logger.warn(
						`NorthDuty Trigger: could not delete the webhook subscription (${(error as Error).message})`,
					);
				}
				delete webhookData.hookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const alert = this.getBodyData() as IDataObject;

		const severities = this.getNodeParameter('severities', []) as string[];
		if (severities.length > 0 && typeof alert.severity === 'string') {
			if (!severities.includes(alert.severity)) {
				return {};
			}
		}

		const rules = this.getNodeParameter('rules', []) as string[];
		if (rules.length > 0 && typeof alert.rule === 'string') {
			if (!rules.includes(alert.rule)) {
				return {};
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(alert)],
		};
	}
}
