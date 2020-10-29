import {drive_v3, google} from 'googleapis';
import fs from "fs";
import {isPresent} from 'ts-is-present';


// const secretsFile = "/run/build/secrets/secrets";
const secretsFile = "credentials.json";
const auth = new google.auth.GoogleAuth({
    keyFile: secretsFile,
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({version: 'v3', auth});

interface Foo {
    id: string;
    createdTime: string;
}
(async () => {
    // Takeout folder

    const list = await drive.files.list({
        spaces: 'drive',
        fields: '*',
        // q: 'mimeType!="application/vnd.google-apps.folder"'
    })

    // console.log(del)
    // const aaa = await drive.permissions.list({
    //     fileId: fileId,
    //     fields: '*',
    // })
    // console.log(list)

    const perm = await drive.permissions.create({
        fileId: fileId,
        fields: '*',
        requestBody: {
            emailAddress: 'service account email goes here',
            type: 'user',
            role: 'reader'
        }
    })
    console.log(perm)







    const asdf = await drive.files.list({
        // spaces: 'drive',
        fields: '*',
        q: `'${fileId}' in parents`
    }, function (err, response) {
        // TODO handle response
        console.log(err)
    });
    console.log(asdf)
    const response = await drive.files.list({
        spaces: 'drive',
        fields: '*',
        // q: 'mimeType!="application/vnd.google-apps.folder"'
        q: `'${fileId}' in parents`
    })
    console.log('')
    const foo = response.data.files
        // TODO: Hack to ignore null | undefined type on Schema$File
        ?.map((f): Foo => {
            return f as Foo
        })
        ?.sort((f1: Foo, f2: Foo) => {
            return Date.parse(f1.createdTime) - Date.parse(f2.createdTime)
        })
        .pop()

    console.log(foo)
        // ?.map(file => {
        //     return file.id
        // })
        // .filter(isPresent)
        // .map(async (fileId) => {
        //     const foo: any = await drive.files.get({
        //         fileId: fileId,
        //         alt: 'media'
        //     }, {responseType: 'blob'}).catch(e => {
        //         console.log(e.message.text());
        //     })
        //
        //     try {
        //         const data: Blob = foo.data
        //         fs.writeFileSync(`foo/${fileId}.tgz`, Buffer.from(new Uint8Array(await data.arrayBuffer())));
        //     } catch (e) {
        //     }
        // })
})().catch(e => {
    console.log("Fail")
    console.log(e);
});
