import {Endpoints} from "@octokit/types";
import {Octokit} from "@octokit/rest";
import {readFileSync} from "fs";
import {RepoBadgeInfo} from "./types";

const secretsFile = "/run/build/secrets/secrets";
const secrets = JSON.parse(readFileSync(secretsFile, 'utf8'));
const username = secrets.USERNAME
const githubToken = secrets.GITHUB_TOKEN

const octokit = new Octokit({
    auth: githubToken
});

type ListUserReposParameters = Endpoints["GET /user/repos"]["parameters"];
type ListUserReposResponse = Endpoints["GET /user/repos"]["response"];

type ListUserRepoActionsParameters = Endpoints["GET /repos/:owner/:repo/actions/workflows"]["parameters"];
type ListUserRepoActionsResponse = Endpoints["GET /repos/:owner/:repo/actions/workflows"]["response"];

// TODO: This is a hack because I don't know how to get the full data type for data within the response
interface SimplifiedUserRepoData {
    name: string;
    html_url: string;
}

async function getSimpleRepoData(): Promise<SimplifiedUserRepoData[]> {
    let userReposParams: ListUserReposParameters = {
        type: "owner",
        sort: "updated"
    }
    const userRepos = await octokit.repos.listForAuthenticatedUser(userReposParams)
    return userRepos.data
}

async function getRepoBadgeInfo(simpleRepoData: SimplifiedUserRepoData): Promise<RepoBadgeInfo[]> {
    let userRepoActionParams: ListUserRepoActionsParameters = {
        owner: username,
        repo: simpleRepoData.name
    }
    const repoWorkflows = await octokit.actions.listRepoWorkflows(userRepoActionParams)
    return repoWorkflows.data.workflows
        .map(workflow => {
            return {
                repoName: simpleRepoData.name,
                repoUrl: simpleRepoData.html_url,
                badgeUrl: workflow.badge_url
            }
        })
}

(async () => {
    const repoNames: SimplifiedUserRepoData[] = await getSimpleRepoData();
    const badgeUrls = (await Promise.all<RepoBadgeInfo[]>(repoNames.map(getRepoBadgeInfo)))
        .filter(workflowBadges => {
            return Array.isArray(workflowBadges) && workflowBadges.length
        }).map(workflowBadges => {
            return workflowBadges[0]
        })

    console.log(JSON.stringify(badgeUrls, null, 2));
})().catch(e => {
    console.log("Fail")
    console.log(e);
});
