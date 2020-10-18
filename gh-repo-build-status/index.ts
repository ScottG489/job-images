import {Endpoints} from "@octokit/types";
import {Octokit} from "@octokit/rest";
import {readFileSync} from "fs";

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

async function getRepoNames() {
    let userReposParams: ListUserReposParameters = {
        type: "owner",
        sort: "updated"
    }
    const userRepos = await octokit.repos.listForAuthenticatedUser(userReposParams)

    return userRepos.data.map(repo => {
        return repo.name
    })
}

async function getWorkflowBadgeUrl(repoName: string) {
    let userRepoActionParams: ListUserRepoActionsParameters = {
        owner: username,
        repo: repoName
    }
    const repoWorkflows = await octokit.actions.listRepoWorkflows(userRepoActionParams)
    return repoWorkflows.data.workflows
        .map(workflow => {
            return workflow.badge_url
        })
}

(async () => {
    const repoNames = await getRepoNames();
    const badgeUrls = await Promise.all(repoNames.map(getWorkflowBadgeUrl))

    console.log(JSON.stringify(badgeUrls, null, 2));
})().catch(e => {
    console.log("Fail")
    console.log(e);
});
