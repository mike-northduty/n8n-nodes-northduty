import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IWebhookFunctions,
} from 'n8n-workflow';

type NorthDutyContext =
	| IExecuteFunctions
	| IHookFunctions
	| ILoadOptionsFunctions
	| IWebhookFunctions;

export async function northDutyApiRequest(
	this: NorthDutyContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('northDutyApi');
	const baseUrl = String(credentials.baseUrl ?? 'https://northduty.com').replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}/api/v1${endpoint}`,
		json: true,
	};
	if (body !== undefined && Object.keys(body).length > 0) {
		options.body = body;
	}
	if (qs !== undefined && Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'northDutyApi',
		options,
	)) as IDataObject;
}

export async function getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = (await northDutyApiRequest.call(this, 'GET', '/me')) as {
		data?: { projects?: Array<{ id: number; name?: string; base_url?: string }> };
	};
	const projects = response.data?.projects ?? [];

	return projects
		.map((project) => ({
			name: project.name ?? project.base_url ?? `Project ${project.id}`,
			value: project.id,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}
