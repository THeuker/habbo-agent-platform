---
name: jira-researcher
title: Jira Researcher
description: >
  Fetch, analyze, and report on Jira issues using the Atlassian MCP. Use this
  skill to retrieve sprint tasks, issue details, and priority information.
category: research
tags: [jira, atlassian, sprint, research, planning]
mcp_tools: [mcp__atlassian__searchJiraIssuesUsingJql, mcp__atlassian__getJiraIssue, mcp__atlassian__getVisibleJiraProjects, mcp__atlassian__getAccessibleAtlassianResources, mcp__atlassian__getTeamworkGraphContext]
requires_integration: atlassian
difficulty: beginner
version: "1.2"
---

# Jira Researcher

Fetch and analyze Jira issues using the Atlassian Remote MCP server (`mcp.atlassian.com`).

**CRITICAL: Call these tools directly by their full prefixed name. Do NOT use ToolSearch, ListMcpResourcesTool, ReadMcpResourceTool, Bash, or WebFetch to discover or access Jira data.**

**The Atlassian Remote MCP conditionally exposes tools based on your API token's OAuth scopes.**
Some tools may return "No such tool available" if your token lacks certain scopes — this is NOT a connection error; it is a scope error. Follow the fallback path below when this happens.

---

## Step 1 — Discover accessible cloud sites and projects

Always start here to get the cloudId for your Atlassian site:

```
mcp__atlassian__getAccessibleAtlassianResources({})
```

This returns a list of Atlassian cloud sites with their `cloudId` (e.g. `abc123-...`) and URL (e.g. `https://yourcompany.atlassian.net`). Use the `cloudId` in subsequent Teamwork Graph calls.

Then list available projects:

```
mcp__atlassian__getVisibleJiraProjects({ cloudId: "<cloudId from above>" })
```

---

## Step 2A — Search with JQL (preferred, requires `read:jira-work` scope)

```
mcp__atlassian__searchJiraIssuesUsingJql({
  jql: "ORDER BY updated DESC",
  maxResults: 10
})
```

If this returns issues → report them using the format below.
If this returns `total: 0` → try a narrower JQL: `project = <KEY> ORDER BY updated DESC`
If this returns "No such tool available" → go to Step 2B (scope fallback).

**`maxResults` must be an integer, not a string. Example: `10`, not `"10"`.**

---

## Step 2B — Fallback: Teamwork Graph (requires API token with `read:3P-data:mcp` scope)

Use when `searchJiraIssuesUsingJql` is not available. Fetch context for known issue keys:

```
mcp__atlassian__getTeamworkGraphContext({
  cloudId: "<cloudId from Step 1>",
  objectType: "jira-work-item",
  objectIdentifier: "<issue key, e.g. TPO-42>"
})
```

You must have a real issue key and the real cloudId. Do NOT guess or use placeholder values.

---

## Step 3 — Get full issue details

```
mcp__atlassian__getJiraIssue({ issueKey: "TPO-42" })
```

---

## Interpreting results

| Response | Meaning | Action |
|---|---|---|
| `issues: [...], total: N` | N issues found | Report them |
| `issues: [], total: 0` | No issues match the JQL — connection is fine | Broaden the JQL |
| `"No such tool available"` | Your API token lacks the required OAuth scope | Switch to Step 2B (Teamwork Graph fallback) |
| Error with 401 / Unauthorized | Auth credentials are invalid | Report exact error via `talk_bot` and stop |

**Empty results (`total: 0`) are NOT a connection error.** They mean your JQL matched nothing.

---

## Reporting format

```
[PRIORITY] KEY - Short summary (status)
```

Example: `[HIGH] TPO-42 - Fix login timeout bug (In Progress)`

---

## Scope reference

| Tool | Required scope |
|---|---|
| `searchJiraIssuesUsingJql` | `read:jira-work` (OAuth or admin-enabled API token) |
| `getJiraIssue` | `read:jira-work` |
| `getVisibleJiraProjects` | `read:jira-work` |
| `getAccessibleAtlassianResources` | `read:account` + `read:me` |
| `getTeamworkGraphContext` | API token only (always available with API token auth) |

---

## Notes

- `maxResults` must be an **integer** (e.g. `10`), not a string (e.g. `"10"`).
- Do NOT read `.mcp.json`, log files, or any system files to debug connectivity.
- Do NOT use `getTeamworkGraphContext` with placeholder cloudIds — only use real cloudIds from `getAccessibleAtlassianResources`.
- If any tool returns a genuine error (401, 403, timeout), report the **exact error text** via `mcp__hotel-mcp__talk_bot` and stop. Do NOT generate mock data.
- Pass structured findings to teammates via the task-coordinator file, not just hotel chat.
