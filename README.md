# n8n-nodes-northduty

This is an n8n community node for [NorthDuty](https://northduty.com). NorthDuty runs your checkout, signup, login and form journeys in a real browser on a schedule, and checks every site for uptime, response time, SSL and domain expiry and overall health. This node lets you start an n8n workflow the moment NorthDuty raises an alert, and read alerts and projects from your account.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Example workflows](#example-workflows)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. The package name is `n8n-nodes-northduty`.

## Operations

### NorthDuty Trigger

- **New Alert** — starts a workflow the moment NorthDuty detects a problem on a monitored site. Pick a project, optionally filter by severity (`critical` / `warning`) and alert type (user journey failure, health score, response time, SSL expiry, domain expiry, security score). The subscription is registered and removed automatically when the workflow is activated or deactivated.

Each alert delivers a JSON payload like:

```json
{
	"title": "[NorthDuty] My Store: User journey failure",
	"rule": "user_flow_failure",
	"ruleLabel": "User journey failure",
	"severity": "critical",
	"project": { "id": 8, "name": "My Store", "baseUrl": "https://example.com" },
	"threshold": null,
	"observedValue": null,
	"unit": "",
	"comparator": "",
	"dashboardUrl": "https://northduty.com/app/projects/8",
	"message": "Checkout journey failed on the latest run."
}
```

### NorthDuty

- **Alert → Get Many** — fetch the most recent alerts, optionally filtered by project.
- **Project → Get Many** — list the projects your API token can access.

## Credentials

1. Sign in to [NorthDuty](https://northduty.com) and open **Profile → API tokens**.
2. Create a token (tokens start with `ndk_`) and copy it.
3. In n8n, create **NorthDuty API** credentials and paste the token. Leave the Base URL as `https://northduty.com`.

Webhook alert delivery (used by the trigger) requires a NorthDuty plan that includes webhook notification channels.

Note: NorthDuty only accepts `https://` webhook URLs, so the trigger needs your n8n instance to be reachable over HTTPS (n8n Cloud always is; for local development use a tunnel).

## Compatibility

Built with the `@n8n/node-cli` toolchain for n8n 1.x and 2.x. Uses the NorthDuty public API v1 and has no runtime dependencies.

## Usage

1. Add **NorthDuty API** credentials (see above).
2. Add a **NorthDuty Trigger** node, pick a project, and optionally narrow it to critical alerts or to specific alert types.
3. Connect whatever should happen next, then activate the workflow. The trigger registers its webhook with NorthDuty on activation and removes it on deactivation.

Every alert arrives as one item with the payload shown above, so later nodes can use expressions such as `{{ $json.project.name }}`, `{{ $json.ruleLabel }}` and `{{ $json.dashboardUrl }}`.

## Example workflows

- **Checkout broke → page the on-call person:** NorthDuty Trigger (alert type: User Journey Failure, severity: critical) → Slack or Telegram message with the project name, the failed step from `message`, and the dashboard link.
- **Alert log for client reporting:** NorthDuty Trigger (all alerts) → Google Sheets "Append row" with date, project, `ruleLabel`, severity and `observedValue`. Agencies use this to show clients a monthly incident history.
- **Ticket for every outage:** NorthDuty Trigger (alert type: Health Score Below Threshold or Response Time Above Threshold) → Jira, Linear or ClickUp "Create issue", with `title` as the summary.
- **Certificate and domain renewals:** NorthDuty Trigger (alert types: SSL Certificate Nearing Expiry, Domain Name Nearing Expiry) → create a task in Todoist or Asana for whoever renews them.
- **Daily digest:** Schedule Trigger (every morning) → NorthDuty "Alert → Get Many" (limit 50) → Filter (last 24 hours) → email summary.

## Resources

- [NorthDuty n8n integration guide](https://northduty.com/integrations/n8n/)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
