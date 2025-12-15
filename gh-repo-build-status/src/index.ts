import {Endpoints} from "@octokit/types";
import {Octokit} from "@octokit/rest";
import {readFileSync} from "fs";
import { RepoBuildInfo } from "./types";

const secretsFile = "/run/build/secrets/secrets";
const userSecrets = process.argv[2]
const secrets = userSecrets ? JSON.parse(userSecrets) : JSON.parse(readFileSync(secretsFile, 'utf8'));
const username = secrets.USERNAME
const githubToken = secrets.GITHUB_TOKEN

const octokit = new Octokit({
    auth: githubToken
});

type ListUserReposParameters = Endpoints["GET /user/repos"]["parameters"];

// TODO: This is a hack because I don't know how to get the full data type for data within the response
interface SimplifiedUserRepoData {
    name: string;
    html_url: string;
    fork: boolean;
}

async function listSimpleRepoData(): Promise<SimplifiedUserRepoData[]> {
    let userReposParams: ListUserReposParameters = {
        type: "owner",
        sort: "updated",
        per_page: 100
    }
    return (await octokit.repos.listForAuthenticatedUser(userReposParams)).data
}

async function getBranches(repo: SimplifiedUserRepoData) {
    return (await octokit.repos.listBranches({
        owner: username,
        repo: repo.name,
    })).data;
}

async function getBranchBuildStatus(repo: SimplifiedUserRepoData, branchName: string) {
    return (await octokit.checks.listSuitesForRef({
        owner: username,
        repo: repo.name,
        ref: branchName
    })).data.check_suites
        .filter(checkSuite => {
            return checkSuite.status === 'completed'
        }).map(checkSuite => {
            return checkSuite.conclusion
        });
}

(async () => {
    const simpleRepos: SimplifiedUserRepoData[] = (await listSimpleRepoData())
        .filter(repo => {
            return !repo.fork;
        });

    const repoBuildStatus = (await Promise.all(simpleRepos.map(async repo => {
        const branches = (await getBranches(repo))
            .map(branch => branch.name);

        const branchResults = (await Promise.all(branches.map(async branchName => {
            return (await getBranchBuildStatus(repo, branchName))
        }))).flat();

        if (Array.isArray(branchResults) && branchResults.length) {
            return {
                repoName: repo.name,
                repoUrl: repo.html_url,
                conclusion: branchResults.some(result => result === 'failure') ? 'failure' : 'success'
            }
        }
    }))).filter(i => i !== undefined)

    console.log(JSON.stringify(repoBuildStatus, null, 2));
})().catch(e => {
    console.log("Fail")
    console.log(e);
});
