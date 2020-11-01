import {drive_v3, google} from 'googleapis';

import fs from "fs";
import {FileMeta, SecretsConfig} from "./types";
import Drive = drive_v3.Drive;
import Schema$File = drive_v3.Schema$File;
import nullthrows from "nullthrows";
import {Readable} from "stream";

const secretsFile = "/run/build/secrets/secrets";
const secrets: SecretsConfig = JSON.parse(fs.readFileSync(secretsFile, 'utf8'));

const drive: Drive = getDriveClient(secrets);

const downloadDestinationDir = '/tmp/takeout';

(async () => {
    if (!fs.existsSync(downloadDestinationDir)) {
        throw new Error('Download destination directory does not exist')
    }

    // Get all takeout files ordered by createTime (latest being last)
    console.log("Finding takeout files")
    const fileMetas: FileMeta[] = await getOrderedTakeoutFilesResponse()
    if (fileMetas.length === 0) {
        console.log('No takeout files found')
        process.exit(0)
    }

    // Get the latest file from list
    const latestTakeoutFileMeta: FileMeta = getLatestTakeoutFileMeta(fileMetas)

    // Get latest takeout file
    console.log(`Starting download of takeout file: '${latestTakeoutFileMeta.name}'`)
    const latestTakeoutFile: Readable = await getLatestTakeoutFile(latestTakeoutFileMeta.id)

    // Write file to disk
    const fileDest = `${downloadDestinationDir}/${latestTakeoutFileMeta.name}`
    console.log(`Saving to disk at: ${fileDest}`)
    const dest = fs.createWriteStream(fileDest);
    latestTakeoutFile.pipe(dest)
})().catch(e => {
    console.log("Fail")
    console.log(e);
    process.exit(1)
});

async function getOrderedTakeoutFilesResponse(): Promise<FileMeta[]> {
    const listResponse = await drive.files.list({
        spaces: 'drive',
        fields: '*',
        orderBy: "createdTime",
        q: 'name contains "takeout" ' +
            'and mimeType != "application/vnd.google-apps.folder" ' +
            'and trashed = false'
    })
    const files = nullthrows(listResponse.data.files, 'No takeout files found')

    return files.map(toFileMeta);
}

function getLatestTakeoutFileMeta(fileMetadata: FileMeta[]): FileMeta {
    const file = fileMetadata.pop()
    return nullthrows(file, 'Unable to determine latest takeout file id')
}

async function getLatestTakeoutFile(latestTakeoutFileId: string) {
    const resp = await drive.files.get({
        fileId: latestTakeoutFileId,
        alt: 'media'
    }, {responseType: 'stream'})

    return resp.data as Readable
}

function toFileMeta(file: Schema$File): FileMeta {
    const fileId = nullthrows(file.id, 'File doesn\'t have id')
    const name = nullthrows(file.name, 'File doesn\'t have name')
    return {
        id: fileId,
        name: name
    }
}

function getDriveClient(secrets: SecretsConfig): Drive {
    const auth = new google.auth.OAuth2(
        secrets.CLIENT_ID,
        secrets.CLIENT_SECRET,
        secrets.REDIRECT_URL)
    auth.setCredentials({refresh_token: secrets.REFRESH_TOKEN})

    return google.drive({version: 'v3', auth});
}
