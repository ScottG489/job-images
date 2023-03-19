import {Endpoints} from "@octokit/types";
import {Octokit} from "@octokit/rest";
import {readFileSync} from "fs";
import {RepoBadgeInfo, RepoBuildInfo} from "./types";

const secretsFile = "/run/build/secrets/secrets";
const userSecrets = process.argv[2]
const secrets = userSecrets ? JSON.parse(userSecrets) : JSON.parse(readFileSync(secretsFile, 'utf8'));
const username = secrets.USERNAME
const githubToken = secrets.GITHUB_TOKEN

const octokit = new Octokit({
    auth: githubToken
});

type ListUserReposParameters = Endpoints["GET /user/repos"]["parameters"];

type ListUserRepoActionsParameters = Endpoints["GET /repos/:owner/:repo/actions/workflows"]["parameters"];
type ListWorkflowRunsParams = Endpoints["GET /repos/:owner/:repo/actions/runs"]["parameters"];

// TODO: This is a hack because I don't know how to get the full data type for data within the response
interface SimplifiedUserRepoData {
    name: string;
    html_url: string;
    fork: boolean;
}

interface SimplifiedRepoWorkflow {
    badge_url: string;
}

interface SimplifiedWorkflowRun {
    conclusion: string | null;
}

async function listSimpleRepoData(): Promise<SimplifiedUserRepoData[]> {
    let userReposParams: ListUserReposParameters = {
        type: "owner",
        sort: "updated"
    }
    return await (await octokit.repos.listForAuthenticatedUser(userReposParams)).data
}

async function listSimpleRepoWorkflows(simpleRepoData: SimplifiedUserRepoData): Promise<SimplifiedRepoWorkflow[]> {
    let userRepoActionParams: ListUserRepoActionsParameters = {
        owner: username,
        repo: simpleRepoData.name,
        page: 1,
        per_page: 1
    }
    return (await octokit.actions.listRepoWorkflows(userRepoActionParams)).data.workflows
}

async function listWorkflowRuns(badgeInfo: RepoBadgeInfo): Promise<SimplifiedWorkflowRun[]> {
    let userRepoListWorkflowRunsParams: ListWorkflowRunsParams = {
        owner: username,
        repo: badgeInfo.repoName,
        page: 1,
        per_page: 1
    }
    return (await octokit.actions.listWorkflowRunsForRepo(userRepoListWorkflowRunsParams)).data.workflow_runs
}

async function getRepoBadgeInfo(simpleRepoData: SimplifiedUserRepoData): Promise<RepoBadgeInfo[]> {
    const repoWorkflows = await listSimpleRepoWorkflows(simpleRepoData)

    return repoWorkflows
        .map(workflow => {
            return {
                repoName: simpleRepoData.name,
                repoUrl: simpleRepoData.html_url,
                badgeUrl: workflow.badge_url
            }
        })
}

async function getRepoBuildInfo(badgeInfo: RepoBadgeInfo): Promise<RepoBuildInfo[]> {
    const workflowRuns: SimplifiedWorkflowRun[] = await listWorkflowRuns(badgeInfo)

    return workflowRuns
        .map(workflowRun => {
            return {
                repoName: badgeInfo.repoName,
                repoUrl: badgeInfo.repoUrl,
                badgeUrl: badgeInfo.badgeUrl,
                workflowRunConclusion: workflowRun.conclusion === null ? "" : workflowRun.conclusion
            }
        })
}

(async () => {
    const simpleRepo: SimplifiedUserRepoData[] = (await listSimpleRepoData())
        .filter(repo => {
            return !repo.fork;
        });
    const badgeInfos: RepoBadgeInfo[] = (await Promise.all<RepoBadgeInfo[]>(simpleRepo.map(getRepoBadgeInfo)))
        .filter(workflowBadges => {
            return Array.isArray(workflowBadges) && workflowBadges.length
        }).map(workflowBadges => {
            return workflowBadges[0]
        })
    const buildInfos: RepoBuildInfo[] =
        (await Promise.all<RepoBuildInfo[]>(badgeInfos.map(getRepoBuildInfo)))
            .filter((workflowBuilds: RepoBuildInfo[]) => {
                return Array.isArray(workflowBuilds) && workflowBuilds.length
            }).map((workflowBuilds: RepoBuildInfo[]) => {
            return workflowBuilds[0]
        })

    console.log(JSON.stringify(buildInfos, null, 2));
})().catch(e => {
    console.log("Fail")
    console.log(e);
});
