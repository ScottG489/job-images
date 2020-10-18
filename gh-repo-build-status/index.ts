const { Octokit } = require("@octokit/rest");
var fs = require('fs');

const secretsFile = "/run/build/secrets/secrets";
var secrets = JSON.parse(fs.readFileSync(secretsFile, 'utf8'));
const username = secrets.USERNAME
const githubToken = secrets.GITHUB_TOKEN

const octokit = new Octokit({
    auth: secrets.GITHUB_TOKEN
});


async function lol() {
    return await octokit.repos.listForUser({ username, });
}

(async () => {
    var text = await lol();
    console.log(JSON.stringify(text, null, 2));
})().catch(e => {
    console.log("Fail")
    console.log(e);
});
